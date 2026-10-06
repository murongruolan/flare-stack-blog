/** 发动机浏览器云端资产（R2，经站点 /images/ 路由透出）。 */

/** 内置默认 R2 key：后台「数据源」未配置时回退使用。 */
export const DEFAULT_ENGINE_DATA_KEY = "blog-media/engines/engines.geojson";
export const DEFAULT_ENGINE_MODEL_KEY =
  "blog-media/engines/planetary-engine-draco.glb";

/** 资源 URL：管理员配置的 key 原样使用，内容更替靠换文件名。 */
export function engineAssetUrl(key: string): string {
  return `/images/${key}`;
}

export const ENGINE_DATA_URL = engineAssetUrl(DEFAULT_ENGINE_DATA_KEY);
export const ENGINE_MODEL_URL = engineAssetUrl(DEFAULT_ENGINE_MODEL_KEY);
