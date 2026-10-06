/** 发动机浏览器云端资产（R2，经站点 /images/ 路由透出）。 */

/** 内置默认 R2 key：后台「数据源」未配置时回退使用。 */
export const DEFAULT_ENGINE_DATA_KEY = "blog-media/engines/engines.geojson";
export const DEFAULT_ENGINE_MODEL_KEY =
  "blog-media/engines/planetary-engine-draco.glb";

/**
 * 资源 URL = key + ?v=revision。revision 只在管理员更换 key 时递增，
 * 因此 URL 变化即缓存失效；未变化时浏览器/边缘可永久缓存（immutable）。
 */
export function engineAssetUrl(key: string, revision: number): string {
  return `/images/${key}?v=${revision}`;
}

export const ENGINE_DATA_URL = engineAssetUrl(DEFAULT_ENGINE_DATA_KEY, 0);
export const ENGINE_MODEL_URL = engineAssetUrl(DEFAULT_ENGINE_MODEL_KEY, 0);
