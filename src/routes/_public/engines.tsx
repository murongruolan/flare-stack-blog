import { createFileRoute } from "@tanstack/react-router";
import { EngineBrowser } from "@/features/engines/components/engine-browser";
import { engineDataSourcesQuery } from "@/features/engines/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/engines")({
  // 数据源 URL 由 loader 随 SSR 水合注入，无额外客户端请求
  loader: async ({ context }) => {
    const dataSources = await context.queryClient.ensureQueryData(
      engineDataSourcesQuery,
    );
    return {
      title: m.ueg_nav_engines(),
      dataSources,
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
  const { dataSources } = Route.useLoaderData();
  return (
    <EngineBrowser
      dataUrl={dataSources.dataUrl}
      modelUrl={dataSources.modelUrl}
    />
  );
}
