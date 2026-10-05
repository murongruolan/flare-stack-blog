import { countryZh } from "./iso-country-names";

/**
 * 发动机数据的解析与内存索引层。
 *
 * 开发阶段数据不入库、不上传：用户在浏览器里选择本地 engines.geojson，
 * 这里负责把文件文本一次性解析成内存结构并建立索引，供搜索 / 筛选 /
 * 地图渲染使用。字段名不写死，通过别名表做轻量映射，兼容生成器未来的
 * 字段调整。
 */

export interface EngineRecord {
  id: string;
  name: string;
  commonName: string | null;
  country: string;
  countryName: string;
  continent: string;
  continentName: string;
  region: string | null;
  city: string | null;
  status: string | null;
  engineType: string | null;
  population: number | null;
  lng: number;
  lat: number;
  /** 小写拼接串，搜索用，避免每次过滤都遍历字段 */
  searchBlob: string;
}

export interface FacetEntry {
  code: string;
  name: string;
  count: number;
}

export interface EngineDataset {
  fileName: string;
  engines: EngineRecord[];
  byId: Map<string, EngineRecord>;
  countries: FacetEntry[];
  continents: FacetEntry[];
  statuses: FacetEntry[];
  types: FacetEntry[];
}

export class EngineDataError extends Error {}

export const CONTINENT_ZH: Record<string, string> = {
  AS: "亚洲",
  EU: "欧洲",
  AF: "非洲",
  NA: "北美洲",
  SA: "南美洲",
  OC: "大洋洲",
  AN: "南极洲",
};

const ID_KEYS = ["engine_id", "engineid", "id"];
const NAME_KEYS = ["name", "engine_name", "enginename", "title"];
const COMMON_KEYS = ["commonname", "common_name", "nickname", "alias"];
const COUNTRY_KEYS = ["country", "country_code", "countrycode", "iso2"];
const CONTINENT_KEYS = ["continent", "continent_code"];
const REGION_KEYS = ["region", "region_code", "province", "state"];
const CITY_KEYS = ["city", "underground_city", "location_city"];
const STATUS_KEYS = ["status", "engine_status"];
const TYPE_KEYS = ["engine_type", "enginetype", "type", "model"];
const POPULATION_KEYS = ["design_population", "population", "capacity"];
const LAT_KEYS = ["latitude", "lat", "纬度"];
const LNG_KEYS = ["longitude", "lng", "lon", "经度"];

function pick(record: Record<string, unknown>, aliases: string[]): unknown {
  const lowered = record.__lowered as Record<string, unknown> | undefined;
  if (!lowered) return undefined;
  for (const key of aliases) {
    const value = lowered[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function lowerKeys(record: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    result[key.toLowerCase()] = value;
  }
  result.__lowered = result;
  return result;
}

function toText(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === "" ? null : text;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = toText(value);
  if (text === null) return null;
  const parsed = Number(text.replace(/[, ]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

/** 最低限度的 GeoJSON Point 提取，兼容 properties 里的经纬度兜底。 */
function extractCoords(
  geometry: { type?: string; coordinates?: unknown } | null | undefined,
  record: Record<string, unknown>,
): { lng: number; lat: number } | null {
  if (
    geometry &&
    geometry.type === "Point" &&
    Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length >= 2
  ) {
    const lng = toNumber(geometry.coordinates[0]);
    const lat = toNumber(geometry.coordinates[1]);
    if (lng !== null && lat !== null) return { lng, lat };
  }
  const lat = toNumber(pick(record, LAT_KEYS));
  const lng = toNumber(pick(record, LNG_KEYS));
  if (lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lng, lat };
  }
  return null;
}

function mapFeature(
  geometry: { type?: string; coordinates?: unknown } | null | undefined,
  properties: Record<string, unknown>,
): EngineRecord | null {
  const record = lowerKeys(properties);
  const coords = extractCoords(geometry, record);
  if (!coords) return null;
  const id = toText(pick(record, ID_KEYS));
  if (!id) return null;
  const name = toText(pick(record, NAME_KEYS)) ?? id;
  const commonName = toText(pick(record, COMMON_KEYS));
  const country = toText(pick(record, COUNTRY_KEYS)) ?? "--";
  const continent = (toText(pick(record, CONTINENT_KEYS)) ?? "").toUpperCase();
  const status = toText(pick(record, STATUS_KEYS));
  const engineType = toText(pick(record, TYPE_KEYS));
  const city = toText(pick(record, CITY_KEYS));
  const region = toText(pick(record, REGION_KEYS));
  const population = toNumber(pick(record, POPULATION_KEYS));
  const countryName = countryZh(country);
  const continentName = CONTINENT_ZH[continent] ?? continent;
  return {
    id,
    name,
    commonName,
    country,
    countryName,
    continent,
    continentName,
    region,
    city,
    status,
    engineType,
    population,
    lng: coords.lng,
    lat: coords.lat,
    searchBlob: [
      id,
      name,
      commonName ?? "",
      countryName,
      country,
      city ?? "",
      region ?? "",
      continentName,
      status ?? "",
    ]
      .join(" ")
      .toLowerCase(),
  };
}

function facet(
  values: Iterable<string | null>,
  nameOf: (code: string) => string,
): FacetEntry[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([code, count]) => ({ code, name: nameOf(code), count }))
    .sort((a, b) => b.count - a.count);
}

export function buildDataset(
  fileName: string,
  engines: EngineRecord[],
): EngineDataset {
  const byId = new Map<string, EngineRecord>();
  for (const engine of engines) {
    const existing = byId.get(engine.id);
    if (!existing) byId.set(engine.id, engine);
  }
  return {
    fileName,
    engines,
    byId,
    countries: facet(
      engines.map((engine) => engine.country),
      countryZh,
    ),
    continents: facet(
      engines.map((engine) => engine.continent),
      (code) => CONTINENT_ZH[code] ?? code,
    ),
    statuses: facet(
      engines.map((engine) => engine.status),
      (code) => code,
    ),
    types: facet(
      engines.map((engine) => engine.engineType),
      (code) => code,
    ),
  };
}

function parseGeoJson(raw: unknown, fileName: string): EngineDataset {
  const root = raw as {
    type?: string;
    features?: unknown;
    geometry?: unknown;
    properties?: unknown;
  };
  const features =
    root.type === "FeatureCollection"
      ? root.features
      : root.type === "Feature"
        ? [root]
        : null;
  if (!Array.isArray(features)) {
    throw new EngineDataError("NO_FEATURE_COLLECTION");
  }
  const engines: EngineRecord[] = [];
  for (const feature of features) {
    if (!feature || typeof feature !== "object") continue;
    const typed = feature as {
      geometry?: unknown;
      properties?: unknown;
    };
    const properties =
      typed.properties && typeof typed.properties === "object"
        ? (typed.properties as Record<string, unknown>)
        : {};
    const engine = mapFeature(
      typed.geometry as { type?: string; coordinates?: unknown } | null,
      properties,
    );
    if (engine) engines.push(engine);
  }
  if (engines.length === 0) throw new EngineDataError("NO_ENGINE_RECORDS");
  return buildDataset(fileName, engines);
}

/** 轻量 CSV 兜底：首行为表头，按别名映射列。 */
function parseCsv(text: string, fileName: string): EngineDataset {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length < 2) throw new EngineDataError("NO_ENGINE_RECORDS");
  const delimiter = [",", ";", "\t"]
    .map((d) => ({ d, n: lines[0].split(d).length }))
    .sort((a, b) => b.n - a.n)[0].d;
  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const engines: EngineRecord[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(delimiter);
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = cells[index]?.trim() ?? "";
    });
    const engine = mapFeature(null, record);
    if (engine) engines.push(engine);
  }
  if (engines.length === 0) throw new EngineDataError("NO_ENGINE_RECORDS");
  return buildDataset(fileName, engines);
}

export function parseEngineFile(text: string, fileName: string): EngineDataset {
  const trimmed = text.trim();
  if (trimmed === "") throw new EngineDataError("EMPTY_FILE");
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let raw: unknown;
    try {
      raw = JSON.parse(trimmed);
    } catch {
      throw new EngineDataError("PARSE_FAILED");
    }
    return parseGeoJson(raw, fileName);
  }
  return parseCsv(trimmed, fileName);
}
