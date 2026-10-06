import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ENGINE_MODEL_URL } from "../lib/engine-assets";
import {
  createGltfMaterialFixer,
  stripDeadTextureReferences,
} from "../lib/engine-model-layer";
import { cn } from "@/lib/utils";
import "./engine-viewer.css";

type Phase = "loading" | "ready" | "error";

/** 卡面刻印：把指定 Decal 贴图上的名字区域重绘为用户输入的文字。 */
interface EngraveConfig {
  /** 材质名后缀（如 face_hengyu 匹配 Decal_face_hengyu）。 */
  materialSuffix: string;
  /** 名字区域（相对贴图 0~1）。 */
  region: { x: number; y: number; w: number; h: number };
}

const DRACO_DECODER_PATH = "/draco/";

const CAMERA_HOME = new THREE.Vector3(4.4, 2.7, 5.1);
const FOCUS_POINT = new THREE.Vector3(0, 1.0, 0);

/**
 * 单个模型视口：独立 Three.js 场景 + OrbitControls 自由观察。
 * fixMaterials=true 走地图实例层同款材质修复（黑镜面 → 暗钢占位，
 * 供无贴图的发动机 GLB）；带贴图的模型（数字生命卡）传 false 原样渲染。
 */
function ModelViewport({
  modelUrl,
  fixMaterials = true,
  extraActions,
  engrave,
  onEngraverReady,
  space = false,
}: {
  modelUrl: string;
  fixMaterials?: boolean;
  extraActions?: ReactNode;
  engrave?: EngraveConfig;
  /** 模型就绪且找到刻印贴图后回调，传入重绘函数（入参为名字，空串恢复）。 */
  onEngraverReady?: (redraw: ((name: string) => void) | null) => void;
  /** 空间场景：星空背景，无地面网格、无雾。 */
  space?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const readoutRef = useRef<HTMLDivElement | null>(null);
  // 归一化后的取景参数（按模型包围球自适应），复位视角用
  const homeRef = useRef<{ center: THREE.Vector3; distance: number }>({
    center: FOCUS_POINT.clone(),
    distance: CAMERA_HOME.length(),
  });
  const [phase, setPhase] = useState<Phase>("loading");
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setPhase("loading");
    onEngraverReady?.(null);
    let disposed = false;
    const disposables: Array<{ dispose: () => void }> = [];

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(space ? 0x010409 : 0x050c12, 1);
    container.appendChild(renderer.domElement);
    disposables.push(renderer);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(space ? 0x010409 : 0x050c12);
    if (!space) scene.fog = new THREE.Fog(0x050c12, 16, 38);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.05,
      120,
    );

    // PBR 环境光：内置棚 Environment（与地图实例层同款），再加主/轮廓光
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.5;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xfff2e2, 1.8);
    key.position.set(4, 6, 3);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9fb8c4, 1.1);
    rim.position.set(-5, 3, -4);
    scene.add(rim);

    // 地面网格衬托模型比例（空间场景换成星空）
    if (space) {
      const starCount = 900;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        // 均匀撒在半径 55~95 的球壳上，略偏上层避免底部过密
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const radius = 55 + Math.random() * 40;
        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = Math.abs(radius * Math.cos(phi)) * 0.8 - 12;
        positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      }
      const starGeometry = new THREE.BufferGeometry();
      starGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      const starMaterial = new THREE.PointsMaterial({
        color: 0xcfe0f0,
        size: 0.35,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
      });
      const stars = new THREE.Points(starGeometry, starMaterial);
      scene.add(stars);
      disposables.push(starGeometry, starMaterial);
    } else {
      const grid = new THREE.GridHelper(24, 60, 0x2a4654, 0x152631);
      (grid.material as THREE.Material).transparent = true;
      (grid.material as THREE.Material).opacity = 0.55;
      scene.add(grid);
      disposables.push(grid.geometry, grid.material as THREE.Material);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.1;
    controls.minDistance = 0.4;
    controls.maxDistance = 18;
    controlsRef.current = controls;
    disposables.push(controls);

    const resize = () => {
      if (!container.clientWidth) return;
      camera.aspect = container.clientWidth / Math.max(1, container.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      // 视角读数：离地高度（地面 y=0）+ 到目标点距离（min/maxDistance 限制的就是它）
      const readout = readoutRef.current;
      if (readout) {
        readout.textContent = `离地高度 ${camera.position.y.toFixed(2)} · 目标距离 ${camera.position.distanceTo(controls.target).toFixed(2)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    // 模型加载：GLB 预处理（剥失效贴图引用，打包完好的模型为空操作）
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    const gltfLoader = new GLTFLoader();
    gltfLoader.setDRACOLoader(dracoLoader);

    fetch(modelUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => stripDeadTextureReferences(buffer))
      .then(({ buffer, texturedNames }) => {
        if (disposed) return;
        // 贴图材质名在预处理后才知道，fixer 需在此创建
        const fixMaterial = fixMaterials
          ? createGltfMaterialFixer(new Set(texturedNames))
          : null;
        gltfLoader.parse(
          buffer,
          "",
          (gltf) => {
            if (disposed) return;
            try {
              const root = gltf.scene;
              root.updateMatrixWorld(true);

              // 归一化：模型缩放到 2.4 单位高、居中、底面贴网格
              const box = new THREE.Box3().setFromObject(root);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              const scale = 2.4 / Math.max(size.y, 0.0001);
              root.scale.setScalar(scale);
              root.position.set(
                -center.x * scale,
                -box.min.y * scale,
                -center.z * scale,
              );

              root.traverse((child) => {
                const mesh = child as THREE.Mesh;
                if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
                if (fixMaterial) {
                  mesh.material = fixMaterial(
                    mesh.material as THREE.MeshStandardMaterial,
                  );
                }
              });
              scene.add(root);

              // 取景按包围球自适应：发动机直立窄高、卡片宽扁，
              // 固定机位会让宽扁模型贴脸。沿默认机位方向退到
              // 包围球的 2.2 倍半径处，目标点取包围球中心。
              root.updateMatrixWorld(true);
              const sphere = new THREE.Box3()
                .setFromObject(root)
                .getBoundingSphere(new THREE.Sphere());
              const homeDir = CAMERA_HOME.clone().sub(FOCUS_POINT).normalize();
              homeRef.current = {
                center: sphere.center.clone(),
                distance: Math.max(sphere.radius * 2.2, 1),
              };
              // 缩放上限与雾随模型尺寸放开：宽扁模型归一化后包围球大，
              // 固定 maxDistance=18 会让「缩到最小也展示不全」，雾也会
              // 把远端卡体淡出。发动机（radius≈4）维持原值。
              controls.maxDistance = Math.max(18, sphere.radius * 2.8);
              const fog = scene.fog as THREE.Fog | null;
              if (fog) {
                fog.near = Math.max(16, sphere.radius * 2.5);
                fog.far = Math.max(38, sphere.radius * 7);
              }
              camera.position
                .copy(sphere.center)
                .addScaledVector(homeDir, homeRef.current.distance);
              controls.target.copy(sphere.center);
              controls.update();

              // 卡面刻印：找到目标 Decal 贴图，画到 canvas 上供运行时重绘
              if (engrave) {
                let decalTexture: THREE.Texture | null = null;
                root.traverse((child) => {
                  const mesh = child as THREE.Mesh;
                  if (!(mesh as unknown as { isMesh?: boolean }).isMesh) return;
                  const materials = Array.isArray(mesh.material)
                    ? mesh.material
                    : [mesh.material];
                  for (const material of materials as THREE.MeshStandardMaterial[]) {
                    if (
                      material.name?.endsWith(engrave.materialSuffix) &&
                      material.map
                    ) {
                      decalTexture = material.map;
                    }
                  }
                });
                if (decalTexture) {
                  const texture = decalTexture as THREE.Texture;
                  const image = texture.image as ImageBitmap;
                  const canvas = document.createElement("canvas");
                  canvas.width = image.width;
                  canvas.height = image.height;
                  const ctx = canvas.getContext("2d")!;
                  ctx.drawImage(image, 0, 0);
                  // 关键：把 texture 的图像源换成 canvas，needsUpdate 才会上传
                  // 重绘后的内容（只改 canvas 不换 image，GPU 永远拿到原图）
                  texture.image = canvas;
                  // 调试句柄：与 __engineMap 同款，控制台/验证脚本可导出贴图内容
                  (window as unknown as Record<string, unknown>).__cardEngraveCanvas =
                    canvas;
                  // 刻印字体：优先用 /engines 路由 <link> 引入的在线字体集
                  // （文派字库，CSS 里的真名从 document.fonts 按 slug 探测），
                  // 探测不到/加载失败回退系统黑体栈——Windows 即微软雅黑 Bold。
                  // canvas 不触发 unicode-range 分片下载，须 fonts.load 显式加载。
                  const fallbackFont = '"Microsoft YaHei", "PingFang SC", sans-serif';
                  let fontExpr = fallbackFont;
                  let fontWeight = "700";
                  let lastName = "";
                  let loadedForLabel = "";
                  const redraw = (name: string) => {
                    const text = name.trim();
                    lastName = name;
                    ctx.drawImage(image, 0, 0);
                    if (text) {
                      const rx = engrave.region.x * image.width;
                      const ry = engrave.region.y * image.height;
                      const rw = engrave.region.w * image.width;
                      const rh = engrave.region.h * image.height;
                      // 原版没有底板：名字直接印在全透明卡面上，
                      // 清空区域（含原字与色条）后只画文字
                      ctx.clearRect(rx, ry, rw, rh);
                      // 字号随名字长度收缩，超长也压在原区域内
                      let size = Math.round(rh * 0.8);
                      const label = `|| ${text}`;
                      ctx.fillStyle = "#d0e9ff";
                      ctx.textBaseline = "middle";
                      ctx.font = `${fontWeight} ${size}px ${fontExpr}`;
                      while (
                        size > 12 &&
                        ctx.measureText(label).width > rw * 1.05
                      ) {
                        size -= 4;
                        ctx.font = `${fontWeight} ${size}px ${fontExpr}`;
                      }
                      ctx.fillText(label, rx, ry + rh * 0.55);
                      // 在线字体的分片按需加载：首次遇到新名字先画回退栈，
                      // 覆盖该文本的分片到位后重画一次
                      if (
                        fontExpr !== fallbackFont &&
                        loadedForLabel !== text
                      ) {
                        loadedForLabel = text;
                        document.fonts
                          .load(`400 48px ${fontExpr}`, text)
                          .then(() => redraw(lastName))
                          .catch(() => {});
                      }
                    }
                    texture.needsUpdate = true;
                  };
                  document.fonts.ready.then(() => {
                    for (const face of document.fonts) {
                      if (/alhyznht|阿里汉仪/i.test(face.family)) {
                        // 该字体只提供 regular 字重，避免合成加粗走样
                        fontExpr = `"${face.family}", ${fallbackFont}`;
                        fontWeight = "400";
                        break;
                      }
                    }
                    if (fontExpr !== fallbackFont && lastName.trim()) {
                      redraw(lastName);
                    }
                  });
                  onEngraverReady?.(redraw);
                } else {
                  onEngraverReady?.(null);
                }
              }

              setPhase("ready");
            } catch (error) {
              console.error("[engines] 模型实例处理异常：", error);
              setPhase("error");
            }
          },
          (error) => {
            console.error("[engines] GLTF 解析失败：", error);
            if (!disposed) setPhase("error");
          },
        );
      })
      .catch((error) => {
        console.error("[engines] 模型加载失败：", error);
        if (!disposed) setPhase("error");
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      dracoLoader.dispose();
      for (const item of disposables) item.dispose();
      scene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if ((mesh as unknown as { isMesh?: boolean }).isMesh) {
          mesh.geometry?.dispose();
        }
      });
      renderer.domElement.remove();
      controlsRef.current = null;
    };
  }, [modelUrl, fixMaterials]);

  const toggleRotate = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.autoRotate = !controls.autoRotate;
    setAutoRotate(controls.autoRotate);
  };

  const resetView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    const { center, distance } = homeRef.current;
    controls.target.copy(center);
    controls.object.position.copy(center).addScaledVector(
      CAMERA_HOME.clone().sub(FOCUS_POINT).normalize(),
      distance,
    );
    controls.update();
  };

  return (
    <div className="engine-view-wrap">
      <div ref={containerRef} className="engine-view-canvas" />

      {phase === "loading" ? (
        <div className="engine-view-loading" role="status">
          <span className="engine-view-loading-dot" aria-hidden="true" />
          LOADING MODEL ...
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="engine-view-error" role="alert">
          模型加载失败，请刷新重试。
        </div>
      ) : null}

      {phase === "ready" ? (
        <>
          <div className="engine-view-actions">
            {extraActions}
            <button
              type="button"
              className={cn("engine-view-btn", autoRotate && "active")}
              onClick={toggleRotate}
            >
              自动旋转 {autoRotate ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              className="engine-view-btn"
              onClick={resetView}
            >
              复位视角
            </button>
          </div>
          <div className="engine-view-hint" aria-hidden="true">
            左键旋转 · 滚轮缩放 · 右键平移
          </div>
          <div ref={readoutRef} className="engine-view-readout">
            离地高度 2.70 · 目标距离 6.95
          </div>
        </>
      ) : null}
    </div>
  );
}

/**
 * 卡面刻印配置：双人卡 face_hengyu 贴图（2048×720）上「|| 图恒宇」
 * 名字块的实测区域（像素 bbox / 贴图尺寸）。
 */
const CARD_ENGRAVE: EngraveConfig = {
  materialSuffix: "face_hengyu",
  region: { x: 0.077, y: 0.755, w: 0.272, h: 0.186 },
};

/**
 * 模型观察（/engines）：第一区块行星发动机模型，第二区块数字生命卡
 * （单人/双人共用一个视口，HUD 切换，默认双人；支持输入姓名实时
 * 刻印到卡面贴图）。
 */
export function ModelObservatory({
  engineModelUrl = ENGINE_MODEL_URL,
  cardSingleUrl = "",
  cardDoubleUrl = "",
  stationUrl = "",
}: {
  engineModelUrl?: string;
  cardSingleUrl?: string;
  cardDoubleUrl?: string;
  stationUrl?: string;
}) {
  const [cardMode, setCardMode] = useState<"double" | "single">(
    cardDoubleUrl ? "double" : "single",
  );
  const hasCard = Boolean(cardSingleUrl || cardDoubleUrl);
  const cardUrl =
    (cardMode === "single" ? cardSingleUrl : cardDoubleUrl) ||
    cardSingleUrl ||
    cardDoubleUrl;

  const engraverRef = useRef<((name: string) => void) | null>(null);
  const engraveNameRef = useRef("");
  const [engraveName, setEngraveName] = useState("");
  const handleEngraveName = (value: string) => {
    engraveNameRef.current = value;
    setEngraveName(value);
    engraverRef.current?.(value);
  };
  // 稳定引用：模型（重）加载就绪后用当前名字重放一次
  const handleEngraverReady = useCallback(
    (redraw: ((name: string) => void) | null) => {
      engraverRef.current = redraw;
      redraw?.(engraveNameRef.current);
    },
    [],
  );

  return (
    <div className="ueg-engines-page ueg-engine-view">
      <section className="head engine-head">
        <div className="engine-head-main">
          <div className="crumb">UEG / MODEL ARCHIVE / OBSERVATORY</div>
          <h1>
            模型观察 <span>MODEL OBSERVATORY</span>
          </h1>
        </div>
      </section>

      <div className="engine-view-blockhead">
        <h2>
          行星发动机 <span>PLANETARY ENGINE</span>
        </h2>
      </div>
      <ModelViewport modelUrl={engineModelUrl} fixMaterials />

      {hasCard ? (
        <>
          <div className="engine-view-blockhead">
            <h2>
              数字生命卡 <span>DIGITAL LIFE CARD</span>
            </h2>
            <input
              type="text"
              className="engine-view-engrave"
              value={engraveName}
              maxLength={16}
              placeholder="输入姓名，实时刻印到卡面"
              spellCheck={false}
              onChange={(event) => handleEngraveName(event.target.value)}
            />
          </div>
          <ModelViewport
            modelUrl={cardUrl}
            fixMaterials={false}
            engrave={CARD_ENGRAVE}
            onEngraverReady={handleEngraverReady}
            extraActions={
              <div className="engine-view-switch">
                <button
                  type="button"
                  className={cn(
                    "engine-view-btn",
                    cardMode === "double" && "active",
                  )}
                  disabled={!cardDoubleUrl}
                  onClick={() => setCardMode("double")}
                >
                  双人
                </button>
                <button
                  type="button"
                  className={cn(
                    "engine-view-btn",
                    cardMode === "single" && "active",
                  )}
                  disabled={!cardSingleUrl}
                  onClick={() => setCardMode("single")}
                >
                  单人
                </button>
              </div>
            }
          />
        </>
      ) : (
        <>
          <div className="engine-view-blockhead">
            <h2>
              数字生命卡 <span>DIGITAL LIFE CARD</span>
            </h2>
          </div>
          <div className="engine-view-wrap engine-view-placeholder">
            模型待配置 · 请在管理后台「数据源」中填写数字生命卡路径
          </div>
        </>
      )}

      <div className="engine-view-blockhead">
        <h2>
          空间站预览 <span>SPACE STATION PREVIEW</span>
        </h2>
      </div>
      {stationUrl ? (
        <ModelViewport modelUrl={stationUrl} fixMaterials={false} space />
      ) : (
        <div className="engine-view-wrap engine-view-placeholder">
          模型待配置 · 请在管理后台「数据源」中填写空间站模型路径
        </div>
      )}
    </div>
  );
}
