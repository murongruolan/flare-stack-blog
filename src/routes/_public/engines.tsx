import { createFileRoute } from "@tanstack/react-router";
import { EngineBrowser } from "@/features/engines/components/engine-browser";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/engines")({
  component: EngineBrowser,
  loader: () => {
    return {
      title: m.ueg_nav_engines(),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title,
      },
    ],
  }),
});
