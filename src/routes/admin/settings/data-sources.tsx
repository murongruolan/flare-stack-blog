import { createFileRoute } from "@tanstack/react-router";
import { EngineDataSourcesSection } from "@/features/engines/components/admin/engine-data-sources";
import { engineDataSourcesQuery } from "@/features/engines/queries";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/admin/settings/data-sources")({
  ssr: false,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(engineDataSourcesQuery);
    return { title: m.settings_nav_data_sources() };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title }],
  }),
  component: EngineDataSourcesSection,
});
