import type {
  LayerSpecification,
  StyleSpecification,
} from "maplibre-gl";

/**
 * UEG 全球行星发动机网络的 MapLibre 样式。
 * 底图用 MapLibre demotiles（免密钥、无 account），配色完全覆盖为
 * UEG 设计系统色：深空海洋 + 冷钢陆地 + 极暗国界，不含任何地图厂商配色。
 */
export const BASEMAP_TILES_URL = "https://demotiles.maplibre.org/tiles/tiles.json";
export const BASEMAP_GLYPHS_URL =
  "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";
const CLUSTER_FONT = ["Open Sans Semibold"];

export const LAYERS = {
  clusters: "engines-clusters",
  clusterCount: "engines-cluster-count",
  points: "engines-points",
  selected: "engine-selected-halo",
  selectedDot: "engine-selected-dot",
} as const;

export function createEngineMapStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: BASEMAP_GLYPHS_URL,
    sources: {
      basemap: { type: "vector", url: BASEMAP_TILES_URL },
    },
    layers: [
      {
        id: "ocean",
        type: "background",
        paint: { "background-color": "#071018" },
      },
      {
        id: "land",
        type: "fill",
        source: "basemap",
        "source-layer": "countries",
        filter: ["!=", ["get", "ISO_A2"], "AQ"],
        paint: { "fill-color": "#0d1822", "fill-opacity": 0.92 },
      },
      {
        id: "land-outline",
        type: "line",
        source: "basemap",
        "source-layer": "countries",
        paint: {
          "line-color": "#293b45",
          "line-width": 0.7,
          "line-opacity": 0.9,
        },
      },
      {
        id: "graticule",
        type: "line",
        source: "basemap",
        "source-layer": "geolines",
        paint: {
          "line-color": "#7897a4",
          "line-opacity": 0.14,
          "line-width": 0.6,
        },
      },
    ],
  };
}

export function engineLayers(
  enginesSource: string,
  selectedSource: string,
): LayerSpecification[] {
  return [
    {
      id: LAYERS.clusters,
      type: "circle",
      source: enginesSource,
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step",
          ["get", "point_count"],
          "rgba(120, 151, 164, 0.16)",
          100,
          "rgba(175, 199, 209, 0.20)",
          500,
          "rgba(175, 199, 209, 0.26)",
        ],
        "circle-radius": [
          "step",
          ["get", "point_count"],
          11,
          100,
          16,
          500,
          22,
        ],
        "circle-stroke-width": 1,
        "circle-stroke-color": "rgba(175, 199, 209, 0.55)",
        "circle-stroke-opacity": 0.55,
      },
    },
    {
      id: LAYERS.clusterCount,
      type: "symbol",
      source: enginesSource,
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": CLUSTER_FONT,
        "text-size": 10,
      },
      paint: {
        "text-color": "#afc7d1",
        "text-halo-color": "#071018",
        "text-halo-width": 1,
      },
    },
    {
      id: LAYERS.points,
      type: "circle",
      source: enginesSource,
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "case",
          [">=", ["coalesce", ["get", "population"], 0], 200000],
          "#c18a55",
          "#afc7d1",
        ],
        "circle-radius": [
          "case",
          [">=", ["coalesce", ["get", "population"], 0], 200000],
          3.6,
          2.6,
        ],
        "circle-opacity": 0.85,
        "circle-stroke-width": 0.8,
        "circle-stroke-color": "rgba(175, 199, 209, 0.28)",
      },
    },
    {
      id: LAYERS.selected,
      type: "circle",
      source: selectedSource,
      paint: {
        "circle-color": "rgba(193, 138, 85, 0.16)",
        "circle-radius": 13,
        "circle-stroke-width": 1.4,
        "circle-stroke-color": "#c18a55",
      },
    },
    {
      id: LAYERS.selectedDot,
      type: "circle",
      source: selectedSource,
      paint: {
        "circle-color": "#e2e0d6",
        "circle-radius": 4.2,
        "circle-stroke-width": 1,
        "circle-stroke-color": "rgba(226, 224, 214, 0.7)",
      },
    },
  ];
}
