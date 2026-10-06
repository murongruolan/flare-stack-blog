import {
  LngLatBounds,
  Map as MaplibreMap,
  MapGeoJSONFeature,
  MapMouseEvent,
  NavigationControl,
  setWorkerUrl,
  type GeoJSONSource,
} from "maplibre-gl";
// maplibre v6 把 worker 拆成独立文件并用 import.meta.url 相对解析，
// vite 依赖预打包会让该路径 404（Worker failed to load），需显式指定。
// 正式上线处理 vector tiles 时一并考虑构建期产物。
import engineWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
setWorkerUrl(engineWorkerUrl);
import { useEffect, useRef } from "react";
import type { EngineRecord } from "../lib/parse-engines";
import {
  createEngineModelLayer,
  MODEL_ZOOM_THRESHOLD,
  type EngineModelLayer,
} from "../lib/engine-model-layer";
import {
  LAYERS,
  createEngineMapStyle,
  engineLayers,
} from "../lib/engine-map-style";

const ENGINES_SOURCE = "engines";
const SELECTED_SOURCE = "engine-selected";

interface EngineGlobeProps {
  engines: EngineRecord[];
  /** 数据集换代标记：文件重新选择后重新 fitBounds。 */
  datasetKey: string;
  selected: EngineRecord | null;
  onSelect: (engine: EngineRecord) => void;
  /** 搜索定位目标（经纬度），变化时飞行过去。 */
  focusTarget: { lng: number; lat: number; key: number } | null;
  /** R2 模型文件 URL（后台「数据源」配置注入）。 */
  modelUrl: string;
}

function toFeatureCollection(engines: EngineRecord[]) {
  return {
    type: "FeatureCollection" as const,
    features: engines.map((engine) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [engine.lng, engine.lat],
      },
      properties: {
        engineId: engine.id,
        population: engine.population ?? 0,
      },
    })),
  };
}

export function EngineGlobe({
  engines,
  datasetKey,
  selected,
  onSelect,
  focusTarget,
  modelUrl,
}: EngineGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const zoomReadoutRef = useRef<HTMLSpanElement | null>(null);
  const modelLayerRef = useRef<EngineModelLayer | null>(null);
  const enginesRef = useRef(engines);
  enginesRef.current = engines;

  // 初始化地图：只跑一次；React 严格模式双挂载由 cleanup 兜底。
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new MaplibreMap({
      container,
      style: createEngineMapStyle(),
      center: [70, 28],
      zoom: 1.35,
      attributionControl: false,
      renderWorldCopies: false,
    });
    mapRef.current = map;
    readyRef.current = false;
    // 开发阶段调试句柄：控制台可直接访问地图实例
    (window as unknown as Record<string, unknown>).__engineMap = map;

    map.addControl(
      new NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    map.on("style.load", () => {
      map.setProjection({ type: "globe" });
    });

    // 临时：实时缩放比例读数（模型 LOD 阈值调试用）
    const syncZoomReadout = () => {
      if (zoomReadoutRef.current) {
        zoomReadoutRef.current.textContent = map.getZoom().toFixed(2);
      }
    };
    map.on("zoom", syncZoomReadout);
    map.on("load", syncZoomReadout);
    const syncModelVisibility = () => modelLayerRef.current?.syncVisibility();
    map.on("zoom", syncModelVisibility);
    map.on("load", syncModelVisibility);

    map.on("load", () => {
      map.addSource(ENGINES_SOURCE, {
        type: "geojson",
        data: toFeatureCollection(enginesRef.current),
        cluster: true,
        clusterRadius: 42,
        clusterMaxZoom: 5,
        maxzoom: 10,
      });
      map.addSource(SELECTED_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      for (const layer of engineLayers(ENGINES_SOURCE, SELECTED_SOURCE)) {
        map.addLayer(layer);
      }
      readyRef.current = true;

      // 3D 模型层：zoom ≥ 5 时替代圆点
      modelLayerRef.current = createEngineModelLayer({
        map,
        getEngines: () => enginesRef.current,
        modelUrl,
      });
      map.addLayer(modelLayerRef.current.layer);
      (window as unknown as Record<string, unknown>).__engineModelDebug =
        () => modelLayerRef.current?.debug();
    });

    const onPointClick = (
      event: MapMouseEvent & {
        features?: MapGeoJSONFeature[];
      },
    ) => {
      const engineId = event.features?.[0]?.properties?.engineId;
      if (typeof engineId !== "string") return;
      const engine = enginesRef.current.find((item) => item.id === engineId);
      if (engine) onSelectRef.current(engine);
    };
    const onClusterClick = (
      event: MapMouseEvent & {
        features?: MapGeoJSONFeature[];
      },
    ) => {
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.cluster_id ?? feature?.properties?.clusterId;
      const source = map.getSource(ENGINES_SOURCE) as
        | GeoJSONSource
        | undefined;
      if (!source || !feature || typeof clusterId !== "number") return;
      void source
        .getClusterExpansionZoom(clusterId)
        .then((zoom) => {
          const coords = (
            feature.geometry as { coordinates: [number, number] }
          ).coordinates;
          map.easeTo({
            center: coords,
            zoom: Math.min(zoom + 0.2, 9),
            duration: 600,
          });
        })
        .catch(() => {});
    };
    const setPointer = (
      event: MapMouseEvent & {
        features?: MapGeoJSONFeature[];
      },
    ) => {
      map.getCanvas().style.cursor = event.features?.length ? "pointer" : "";
    };

    map.on("moveend", () => modelLayerRef.current?.syncEngines());
    map.on("click", (event) => {
      if (map.getZoom() < MODEL_ZOOM_THRESHOLD) return;
      const engine = modelLayerRef.current?.pickAt({ x: event.point.x, y: event.point.y });
      if (engine) onSelectRef.current(engine);
    });
    map.on("click", LAYERS.points, onPointClick);
    map.on("click", LAYERS.clusters, onClusterClick);
    map.on("click", LAYERS.clusterCount, onClusterClick);
    // 数字标签图层盖在圆圈上，点击数字也要触发展开
    map.on("mousemove", LAYERS.points, setPointer);
    map.on("mousemove", LAYERS.clusters, setPointer);
    map.on("mousemove", LAYERS.clusterCount, setPointer);
    map.on("mouseleave", LAYERS.points, () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseleave", LAYERS.clusters, () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
  }, []);

  // 数据（含筛选结果）变化 → 增量 setData，不重建地图。
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const source = map.getSource(ENGINES_SOURCE) as
        | GeoJSONSource
        | undefined;
      source?.setData(toFeatureCollection(engines));
    };
    whenReady(map, readyRef, apply);
    modelLayerRef.current?.syncEngines();
  }, [engines]);

  // 选中发动机 → 高亮图层。
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const source = map.getSource(SELECTED_SOURCE) as
        | GeoJSONSource
        | undefined;
      if (!source) return;
      source.setData(
        selected
          ? {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  geometry: {
                    type: "Point",
                    coordinates: [selected.lng, selected.lat],
                  },
                  properties: {},
                },
              ],
            }
          : { type: "FeatureCollection", features: [] },
      );
    };
    whenReady(map, readyRef, apply);
  }, [selected]);

  // 搜索定位。
  useEffect(() => {
    if (!focusTarget) return;
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({
      center: [focusTarget.lng, focusTarget.lat],
      zoom: Math.max(map.getZoom(), 4.4),
      duration: 900,
      essential: true,
    });
  }, [focusTarget]);

  // 新数据集载入 → 自动适配全球范围，随后转向亚洲朝向
  // （UEG 世界观里亚洲/中国区域是发动机网络核心）。
  useEffect(() => {
    const map = mapRef.current;
    if (!map || engines.length === 0) return;
    const fit = () => {
      const bounds = new LngLatBounds();
      for (const engine of engines) bounds.extend([engine.lng, engine.lat]);
      map.fitBounds(bounds, { padding: 80, duration: 900, maxZoom: 2.4 });
      map.easeTo({ center: [88, 28], duration: 1400, easing: (t) => t });
    };
    whenReady(map, readyRef, fit);
    // datasetKey 变化（重新选文件）时才重新适配。
  }, [datasetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="engine-globe-wrap">
      <div ref={containerRef} className="engine-globe" />
      <div className="engine-zoom-hud" title="临时调试：确定模型 LOD 的缩放阈值后可移除">
        <span className="engine-zoom-label">ZOOM</span>
        <span ref={zoomReadoutRef} className="engine-zoom-value">
          1.44
        </span>
        <span className="engine-zoom-note">TEMP · 模型 LOD 阈值待定</span>
      </div>
    </div>
  );
}

function whenReady(
  map: MaplibreMap,
  readyRef: { current: boolean },
  callback: () => void,
) {
  if (readyRef.current) callback();
  else map.once("load", callback);
}
