import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MercatorCoordinate } from "maplibre-gl";
import type { CustomLayerInterface, MapLibreMap } from "maplibre-gl";
import { ENGINE_MODEL_URL } from "./engine-assets";
import type { EngineRecord } from "./parse-engines";

/**
 * 发动机 3D 模型图层（zoom ≥ MODEL_ZOOM_THRESHOLD 时替代圆点）。
 *
 * 矩阵方案与 MapLibre 官方 three.js globe 示例一致：
 * - mercator 投影：模型矩阵 = T(merc) · Rz(π) · Rx(π/2) · S(-s,s,s)
 * - globe 投影：   模型矩阵 = Ry(lng) · Rx(-lat) · T(0,0,1) · Rx(π/2) · S(1/R)
 *   （R = 6371008.8m，globe 空间是单位球；projectionTransition 决定当前
 *   用哪套，跨模式时重建实例矩阵。）
 *
 * 性能策略（10,000 台，视口内可能数百台）：
 * - GLB 的 77 个网格按材质合并 → 每材质一个 InstancedMesh，
 *   全部模型仅「材质数」（≤10）次绘制调用。
 * - 实例矩阵只在 moveend / 数据变化 / 投影模式切换时重建；
 *   render() 每帧仅写相机投影矩阵 + 一次 render。
 * - 不调用 triggerRepaint：模型相对地图静态，地图重绘时顺带渲染。
 */

export const MODEL_ZOOM_THRESHOLD = 5;
const MAX_INSTANCES = 1200;
const MODEL_HEIGHT_METERS = 11000; // 行星发动机设定高度 ~11km
const MODEL_ALTITUDE_METERS = 120; // 贴地抬升：底面与地图平面共面会深度打架（z-fighting 抽搐）
const EARTH_RADIUS = 6371008.8;

const DRACO_DECODER_PATH = "/draco/";

export interface EngineModelLayer {
  layer: CustomLayerInterface;
  /** 数据（筛选结果）变化或视口移动后调用；模型模式下重建实例。 */
  syncEngines: () => void;
  /** zoom 跨越阈值时切换圆点 / 模型。 */
  syncVisibility: () => void;
  /** 模型模式下，点击拾取容差范围内最近的发动机。 */
  pickAt: (
    point: { x: number; y: number },
    tolerancePx?: number,
  ) => EngineRecord | null;
  /** GLB 是否加载成功；失败时上层保持圆点渲染。 */
  isReady: () => boolean;
  /** 调试：实例 / 模式状态。 */
  debug: () => {
    modelReady: boolean;
    modelMode: boolean;
    matrixSpace: string;
    instanceCount: number;
    sets: number;
  };
}

export function createEngineModelLayer(options: {
  map: MapLibreMap;
  getEngines: () => EngineRecord[];
  modelUrl?: string;
}): EngineModelLayer {
  const { map, getEngines } = options;
  const modelUrl = options.modelUrl ?? ENGINE_MODEL_URL;

  const camera = new THREE.Camera();
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xfff2e2, 1.6);
  key.position.set(1, -1.2, 2).normalize();
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb8c4, 1.0);
  rim.position.set(-1.4, 0.8, -0.6).normalize();
  scene.add(rim);

  // 与 maplibre 共享同一个 WebGL2 上下文（onAdd 时由 maplibre 传入）
  const renderer = new THREE.WebGLRenderer({
    canvas: map.getCanvas(),
    context: map.getCanvas().getContext("webgl2") as WebGL2RenderingContext,
    antialias: true,
  });
  renderer.autoClear = false;
  // PBR 环境反射强度压暗：UEG 深空基调，避免金属件泛白
  scene.environmentIntensity = 0.35;
  // PBR 材质（金属度高的部件）没有环境贴图会渲染成黑色，用内置棚 Environment 补光
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const modelGroup = new THREE.Group();
  modelGroup.visible = false;
  scene.add(modelGroup);

  let modelReady = false;
  let modelMode = false;
  /** 上一次 render 观测到的投影模式（0=mercator，1=globe）。 */
  let projectionTransition = 0;
  /** 实例矩阵当前按哪种投影空间构建。 */
  let matrixSpace: "mercator" | "globe" = "mercator";
  let instanceSets: Array<{ mesh: THREE.InstancedMesh }> = [];
  /** GLB 引用了贴图但未打包贴图文件的材质名（渲染时用中性钢色占位）。 */
  const texturedMaterialNames = new Set<string>();
  let blackSubstitute: THREE.MeshStandardMaterial | null = null;
  let texturedSubstitute: THREE.MeshStandardMaterial | null = null;

  const layer: CustomLayerInterface = {
    id: "engines-3d-models",
    type: "custom",
    renderingMode: "3d", // 必须 3D：globe 深度缓冲需要
    onAdd(_map, gl) {
      void gl;
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
      const gltfLoader = new GLTFLoader();
      gltfLoader.setDRACOLoader(dracoLoader);
      fetch(modelUrl)
        .then((response) => {
          if (!response.ok) throw new Error();
          return response.arrayBuffer();
        })
        .then((buffer) => stripDeadTextureReferences(buffer))
        .then(({ buffer, texturedNames }) => {
          for (const name of texturedNames) texturedMaterialNames.add(name);
          gltfLoader.parse(
            buffer,
            "",
            (gltf) => {
              try {
                buildInstanceTemplates(gltf.scene);
                modelReady = true;
                applyVisibility();
                map.triggerRepaint();
              } catch (error) {
                console.error("[engines] 模型实例构建异常：", error);
              }
            },
            (error) => {
              console.warn(
                "[engines] 模型加载失败，保持圆点渲染：",
                String(error).slice(0, 140),
              );
            },
          );
        })
        .catch((error) => {
          console.warn(
            "[engines] 模型加载失败，保持圆点渲染：",
            String(error).slice(0, 140),
          );
        });
    },
    render(_gl, args) {
      if (!modelReady || !modelMode || !modelGroup.visible) return;
      const projData = args?.defaultProjectionData;
      if (!projData?.mainMatrix) return;
      projectionTransition = projData.projectionTransition ?? 0;
      // 滞后带：transition 在 0.45~0.55 之间保持原空间，避免边界震荡反复重建
      const targetSpace: "mercator" | "globe" =
        matrixSpace === "mercator"
          ? projectionTransition > 0.55
            ? "globe"
            : "mercator"
          : projectionTransition < 0.45
            ? "mercator"
            : "globe";
      if (targetSpace !== matrixSpace) {
        matrixSpace = targetSpace;
        rebuildInstances();
      }
      camera.projectionMatrix.fromArray(projData.mainMatrix);
      renderer.resetState();
      renderer.render(scene, camera);
    },
  };

  /**
   * 材质整理：双面 + 共享桶。
   * 开发版 GLB 未打包贴图，其中 5 个材质是 baseColor=纯黑 + metalness=1
   * 的"黑镜面"——任何光照下都渲染成纯黑（Blender 里有贴图所以正常），
   * 在此替换为暗钢色占位；带自发光（火焰件）的材质保留原样。
   */
  function resolveMaterial(
    source: THREE.MeshStandardMaterial,
  ): THREE.MeshStandardMaterial {
    const luminance =
      source.color.r * 0.2126 + source.color.g * 0.7152 + source.color.b * 0.0722;
    const emissive =
      source.emissive.getHex() !== 0 || source.emissiveIntensity > 0;
    if (!emissive && luminance < 0.02 && source.metalness >= 0.5) {
      if (!blackSubstitute) {
        blackSubstitute = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#4a5a64"),
          metalness: 0.55,
          roughness: 0.45,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });
      }
      return blackSubstitute;
    }
    if (texturedMaterialNames.has(source.name)) {
      if (!texturedSubstitute) {
        texturedSubstitute = new THREE.MeshStandardMaterial({
          color: new THREE.Color("#5a6a74"),
          metalness: 0.5,
          roughness: 0.5,
          side: THREE.DoubleSide,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        });
      }
      return texturedSubstitute;
    }
    const material = source.clone();
    material.side = THREE.DoubleSide;
    material.polygonOffset = true;
    material.polygonOffsetFactor = -2;
    material.polygonOffsetUnits = -2;
    return material;
  }

  /**
   * GLB 预处理：剥离引用了不存在贴图文件的 texture 属性。
   * 开发版 GLB 只导出了材质、没打包贴图（images: 0），GLTFLoader 遇到
   * 贴图加载失败会拒绝整个模型。返回处理后的 GLB 与贴图材质名集合，
   * 供渲染端用中性钢色占位。
   */
  function stripDeadTextureReferences(buffer: ArrayBuffer): {
    buffer: ArrayBuffer;
    texturedNames: string[];
  } {
    const header = new DataView(buffer);
    const magic = header.getUint32(0, true);
    if (magic !== 0x46546c67) return { buffer, texturedNames: [] }; // 不是 GLB
    const jsonLength = header.getUint32(12, true);
    const jsonBytes = new Uint8Array(buffer, 20, jsonLength);
    // GLB 规范允许 JSON 块尾部用空格/零填充，裁掉后再解析
    const jsonText = new TextDecoder().decode(jsonBytes).replace(/[s ]+$/, "");
    const gltf = JSON.parse(jsonText);
    const texturedNames: string[] = [];
    for (const material of gltf.materials ?? []) {
      const pbr = material.pbrMetallicRoughness ?? {};
      const hadTexture =
        pbr.baseColorTexture ||
        pbr.metallicRoughnessTexture ||
        material.normalTexture ||
        material.emissiveTexture;
      if (!hadTexture) continue;
      texturedNames.push(material.name ?? "unnamed");
      delete pbr.baseColorTexture;
      delete pbr.metallicRoughnessTexture;
      delete material.normalTexture;
      delete material.emissiveTexture;
      delete material.occlusionTexture;
    }
    const outJsonText = JSON.stringify(gltf);
    const jsonChunk = new TextEncoder().encode(outJsonText);
    const paddedLength = Math.ceil(jsonChunk.length / 4) * 4;
    const padded = new Uint8Array(paddedLength);
    padded.set(jsonChunk);
    padded.fill(0x20, jsonChunk.length); // 规范：JSON 块用空格填充
    const binChunk = new Uint8Array(
      buffer,
      20 + jsonLength + 8,
      buffer.byteLength - 20 - jsonLength - 8,
    );
    const total = 12 + 8 + paddedLength + 8 + binChunk.length;
    const out = new Uint8Array(total);
    const view = new DataView(out.buffer);
    view.setUint32(0, 0x46546c67, true);
    view.setUint32(4, 2, true);
    view.setUint32(8, total, true);
    view.setUint32(12, paddedLength, true);
    view.setUint32(16, 0x4e4f534a, true); // 'JSON'
    out.set(padded, 20);
    view.setUint32(20 + paddedLength, binChunk.length, true);
    view.setUint32(24 + paddedLength, 0x004e4942, true); // 'BIN'
    out.set(binChunk, 28 + paddedLength);
    return { buffer: out.buffer, texturedNames };
  }

  /** GLB 场景 → 每材质一个 InstancedMesh（合并几何、底面贴地、高度归一）。 */
  function buildInstanceTemplates(root: THREE.Object3D) {
    root.updateMatrixWorld(true);
    const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>();
    root.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
      const worldMatrix = mesh.matrixWorld;
      const world = (mesh.geometry as THREE.BufferGeometry).clone();
      world.applyMatrix4(worldMatrix);
      // 索引必须保留：索引式网格丢了 index 会把顶点连成三角形汤（碎裂根因）
      const minimal = new THREE.BufferGeometry();
      const position = world.getAttribute("position");
      if (!position) return;
      minimal.setAttribute("position", position.clone());
      if (!world.getAttribute("normal")) world.computeVertexNormals();
      minimal.setAttribute("normal", world.getAttribute("normal")!.clone());
      const sourceIndex = world.getIndex();
      if (sourceIndex) minimal.setIndex(sourceIndex.clone());
      // 负缩放节点（镜像）会翻转三角绕序：不修正会让一半面被背面剔除
      if (worldMatrix.determinant() < 0) flipWinding(minimal);
      // 统一展开为非索引：mergeGeometries 要求同批几何索引一致性一致
      const flat = minimal.getIndex() ? minimal.toNonIndexed() : minimal;
      // 材质统一双面：模型里镜像/薄片件多，单面剔除会造成漏面观感
      const material = resolveMaterial(mesh.material as THREE.MeshStandardMaterial);
      const bucket = byMaterial.get(material) ?? [];
      bucket.push(flat);
      byMaterial.set(material, bucket);
    });

    const box = new THREE.Box3();
    for (const geometries of byMaterial.values()) {
      for (const geometry of geometries) {
        geometry.computeBoundingBox();
        box.union(geometry.boundingBox!);
      }
    }
    const sizeX = box.max.x - box.min.x;
    const sizeZ = box.max.z - box.min.z;
    const height = Math.max(box.max.y - box.min.y, 1e-6);

    instanceSets = [];
    for (const [material, geometries] of byMaterial) {
      for (const geometry of geometries) {
        geometry.translate(-(box.min.x + sizeX / 2), -box.min.y, -(box.min.z + sizeZ / 2));
        geometry.scale(1 / height, 1 / height, 1 / height);
      }
      const merged = mergeGeometries(geometries, false);
      if (!merged) continue;
      const mesh = new THREE.InstancedMesh(merged, material, MAX_INSTANCES);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      mesh.count = 0;
      modelGroup.add(mesh);
      instanceSets.push({ mesh });
    }
  }

  /** 单台发动机的实例矩阵（按当前投影空间构建）。 */
  function instanceMatrix(lng: number, lat: number): THREE.Matrix4 {
    const s = MODEL_HEIGHT_METERS;
    if (matrixSpace === "globe") {
      // globe：单位球空间，模型立在球面上、随经纬度转向
      return new THREE.Matrix4()
        .makeRotationY((lng / 180) * Math.PI)
        .multiply(new THREE.Matrix4().makeRotationX((-lat / 180) * Math.PI))
        .multiply(new THREE.Matrix4().makeTranslation(0, 0, 1 + MODEL_ALTITUDE_METERS / EARTH_RADIUS))
        .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
        .multiply(
          new THREE.Matrix4().makeScale(
            s / EARTH_RADIUS,
            s / EARTH_RADIUS,
            s / EARTH_RADIUS,
          ),
        );
    }
    const merc = MercatorCoordinate.fromLngLat([lng, lat], MODEL_ALTITUDE_METERS);
    const scale = s * merc.meterInMercatorCoordinateUnits();
    return new THREE.Matrix4()
      .makeTranslation(merc.x, merc.y, merc.z)
      .multiply(new THREE.Matrix4().makeRotationZ(Math.PI))
      .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
      .multiply(new THREE.Matrix4().makeScale(-scale, scale, scale));
  }

  /** 交换每个三角形的 1、2 号顶点，恢复被镜像矩阵翻转的绕序。 */
  function flipWinding(geometry: THREE.BufferGeometry) {
    const index = geometry.getIndex();
    if (index) {
      const a = index.array as ArrayLike<number> & Record<number, number>;
      for (let i = 0; i < a.length; i += 3) {
        const tmp = a[i + 1];
        a[i + 1] = a[i + 2];
        a[i + 2] = tmp;
      }
      return;
    }
    for (const name of ["position", "normal"]) {
      const attr = geometry.getAttribute(name) as THREE.BufferAttribute | undefined;
      if (!attr) continue;
      const array = attr.array as Float32Array;
      const stride = attr.itemSize;
      for (let v = 0; v < attr.count; v += 3) {
        for (let c = 0; c < stride; c++) {
          const i1 = (v + 1) * stride + c;
          const i2 = (v + 2) * stride + c;
          const tmp = array[i1];
          array[i1] = array[i2];
          array[i2] = tmp;
        }
      }
      attr.needsUpdate = true;
    }
  }

  /** 按当前 zoom 与模型就绪状态切换圆点/模型。 */
  function applyVisibility() {
      const showModels = modelReady && map.getZoom() >= MODEL_ZOOM_THRESHOLD;
      if (modelMode === showModels) return;
      modelMode = showModels;
      modelGroup.visible = showModels;
      for (const id of [
        "engines-points",
        "engines-clusters",
        "engines-cluster-count",
      ]) {
        try {
          if (map.getLayer(id)) {
            map.setLayoutProperty(
              id,
              "visibility",
              showModels ? "none" : "visible",
            );
          }
        } catch {
          // 样式重建间隙图层可能暂时不存在
        }
      }
      if (showModels) rebuildInstances();
      map.triggerRepaint();
  }

  /** 视野内发动机 → 实例矩阵重建。 */
  function rebuildInstances() {
    if (!modelReady) return;
    const bounds = map.getBounds();
    const pad = 0.3;
    const visible = getEngines()
      .filter(
        (engine) =>
          engine.lng >= bounds.getWest() - pad &&
          engine.lng <= bounds.getEast() + pad &&
          engine.lat >= bounds.getSouth() - pad &&
          engine.lat <= bounds.getNorth() + pad,
      )
      .slice(0, MAX_INSTANCES);

    visible.forEach((engine, index) => {
      const matrix = instanceMatrix(engine.lng, engine.lat);
      for (const { mesh } of instanceSets) {
        mesh.setMatrixAt(index, matrix);
      }
    });
    for (const { mesh } of instanceSets) {
      mesh.count = visible.length;
      mesh.instanceMatrix.needsUpdate = true;
    }
  }

  return {
    layer,
    isReady: () => modelReady,
    debug: () => ({
      modelReady,
      modelMode,
      matrixSpace,
      instanceCount: instanceSets[0]?.mesh.count ?? 0,
      sets: instanceSets.length,
    }),

    syncEngines: rebuildInstances,

    syncVisibility() {
      applyVisibility();
    },

    pickAt(point, tolerancePx = 20) {
      if (!modelMode || !modelReady) return null;
      let best: EngineRecord | null = null;
      let bestPx = tolerancePx * tolerancePx;
      for (const engine of getEngines()) {
        const p = map.project([engine.lng, engine.lat]);
        const dx = p.x - point.x;
        const dy = p.y - point.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < bestPx) {
          bestPx = d2;
          best = engine;
        }
      }
      return best;
    },
  };
}
