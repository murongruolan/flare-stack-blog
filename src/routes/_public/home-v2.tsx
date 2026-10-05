import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { HomePageV2 } from "@/features/posts/components/home-page-v2";
import { homePostsQuery } from "@/features/posts/queries";

/**
 * 首页 V2（对比版）：按外部锐评重排的首页副本。
 * 与 / （V1）并存用于视觉对比，赢家留下、输家删除。
 */
export const Route = createFileRoute("/_public/home-v2")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(homePostsQuery(1));
    return { title: "首页 V2 · 对比版" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title }],
  }),
  component: HomeV2Route,
});

function HomeV2Route() {
  const { data } = useSuspenseQuery(homePostsQuery(1));
  return <HomePageV2 posts={data.items} />;
}
