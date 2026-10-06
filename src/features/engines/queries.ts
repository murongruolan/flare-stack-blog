import { orpc } from "@/lib/orpc";

/**
 * 发动机数据源 URL（管理员配置的 R2 路径，原样使用）。staleTime 5 分钟：
 * SPA 内反复进出 /engines 不再重复发请求；首次由路由 loader 预取并随
 * SSR 水合，无额外客户端请求。保存走 orpcClient.engines.admin.update。
 */
export const engineDataSourcesQuery = orpc.engines.getDataSources.queryOptions({
  staleTime: 5 * 60 * 1000,
});
