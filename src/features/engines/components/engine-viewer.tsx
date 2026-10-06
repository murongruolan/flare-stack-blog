import { useEffect, useRef, useState } from "react";
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

const DRACO_DECODER_PATH = "/draco/";

const CAMERA_HOME = new THREE.Vector3(4.4, 2.7, 5.1);
const FOCUS_POINT = new THREE.Vector3(0, 1.0, 0);

/**
 * 发动机观察（/engines）：独立 Three.js 场景展示行星发动机模型，
 * OrbitControls 自由旋转 / 缩放 / 平移。与地图实例层共用同一套
 * GLB 预处理与材质修复规则（黑镜面 → 暗钢占位）。
 */
export function EngineViewer({
  modelUrl = ENGINE_MODEL_URL,
}: {
  modelUrl?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const readoutRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    const disposables: Array<{ dispose: () => void }> = [];

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x050c12, 1);
    container.appendChild(renderer.domElement);
    disposables.push(renderer);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050c12);
    scene.fog = new THREE.Fog(0x050c12, 16, 38);

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

    // 地面网格衬托模型比例
    const grid = new THREE.GridHelper(24, 60, 0x2a4654, 0x152631);
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    scene.add(grid);
    disposables.push(grid.geometry, grid.material as THREE.Material);

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

    // 模型加载：同一套 GLB 预处理 + 材质修复
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
        const fixMaterial = createGltfMaterialFixer(new Set(texturedNames));
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
                mesh.material = fixMaterial(
                  mesh.material as THREE.MeshStandardMaterial,
                );
              });
              scene.add(root);

              camera.position.copy(CAMERA_HOME);
              controls.target.copy(FOCUS_POINT);
              controls.update();

              setPhase("ready");
            } catch {
              setPhase("error");
            }
          },
          () => {
            if (!disposed) setPhase("error");
          },
        );
      })
      .catch(() => {
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
  }, [modelUrl]);

  const toggleRotate = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.autoRotate = !controls.autoRotate;
    setAutoRotate(controls.autoRotate);
  };

  const resetView = () => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.target.copy(FOCUS_POINT);
    controls.object.position.copy(CAMERA_HOME);
    controls.update();
  };

  return (
    <div className="ueg-engines-page ueg-engine-view">
      <section className="head engine-head">
        <div className="engine-head-main">
          <div className="crumb">UEG / GLOBAL ENGINE NETWORK / OBSERVATORY</div>
          <h1>
            发动机观察 <span>ENGINE OBSERVATORY</span>
          </h1>
        </div>
      </section>

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
    </div>
  );
}
