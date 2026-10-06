import { createFileRoute } from "@tanstack/react-router";
import { engineDataSourcesQuery } from "@/features/engines/queries";
import { ModelObservatory } from "@/features/engines/components/engine-viewer";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/engines")({
  loader: async ({ context }) => {
    // 观察页只用到模型 URL；数据源设置 SSR 预热，无额外客户端请求
    const dataSources = await context.queryClient.ensureQueryData(
      engineDataSourcesQuery,
    );
    return {
      title: m.ueg_nav_engines(),
      modelUrl: dataSources.modelUrl,
      cardSingleUrl: dataSources.cardSingleUrl,
      cardDoubleUrl: dataSources.cardDoubleUrl,
    };
  },
  component: EnginesRouteComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
    // 在线字体集（文派字库）：仅本路由加载，供数字生命卡刻印使用；
    // 服务不可达时静默失败，刻印回退系统黑体栈
    links: [
      { rel: "preconnect", href: "https://cn.windfonts.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://cn.windfonts.com/api/css?family=wenfeng-alhyznht&weight=regular&subset=full&version=full&fallback=wenfeng-albbpht&fallbackWeight=regular",
      },
    ],
  }),
});

function EnginesRouteComponent() {
  const { modelUrl, cardSingleUrl, cardDoubleUrl } = Route.useLoaderData();
  return (
    <ModelObservatory
      engineModelUrl={modelUrl}
      cardSingleUrl={cardSingleUrl}
      cardDoubleUrl={cardDoubleUrl}
    />
  );
}
