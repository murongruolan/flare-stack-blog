import { createFileRoute } from "@tanstack/react-router";
import { engineDataSourcesQuery } from "@/features/engines/queries";
import { EngineViewer } from "@/features/engines/components/engine-viewer";
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
    };
  },
  component: EnginesRouteComponent,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
});

function EnginesRouteComponent() {
  const { modelUrl } = Route.useLoaderData();
  return <EngineViewer modelUrl={modelUrl} />;
}
