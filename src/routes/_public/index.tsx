import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { getHomeBackgroundPreloadImages } from "@/components/layout/preload-images";
import { siteDomainQuery } from "@/features/config/queries";
import { engineDataSourcesQuery } from "@/features/engines/queries";
import { HomePage } from "@/features/posts/components/home-page";
import { HomePageSkeleton } from "@/features/posts/components/home-page-skeleton";
import {
  dynamicsPostsQuery,
  homePostsQuery,
  noticePostsQuery,
} from "@/features/posts/queries";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_public/")({
  validateSearch: z.object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .max(1_000_000)
      .optional()
      .catch(undefined),
  }),
  loaderDeps: ({ search }) => ({ page: search.page ?? 1 }),
  loader: async ({ context, deps }) => {
    const [posts, domain] = await Promise.all([
      context.queryClient.ensureQueryData(homePostsQuery(deps.page)),
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(noticePostsQuery()),
      context.queryClient.ensureQueryData(dynamicsPostsQuery()),
    ]);
    // 数据源设置仅一行 D1 读取，随页面 SSR 预热，组件侧 useSuspenseQuery 不再发请求
    await context.queryClient.ensureQueryData(engineDataSourcesQuery);

    if (posts.page !== deps.page) {
      throw redirect({
        to: "/",
        search: { page: posts.page === 1 ? undefined : posts.page },
        replace: true,
      });
    }
    return {
      canonicalHref: buildCanonicalUrl(domain, "/", {
        page: posts.page === 1 ? undefined : String(posts.page),
      }),
      preloadImages: getHomeBackgroundPreloadImages(context.siteConfig),
    };
  },
  head: ({ loaderData }) => ({
    links: [
      canonicalLink(loaderData?.canonicalHref ?? "/"),
      ...(loaderData?.preloadImages ?? []).map((href) => ({
        rel: "preload" as const,
        as: "image",
        href,
      })),
    ],
  }),
  pendingComponent: HomePageSkeleton,
  component: HomeRoute,
});

function HomeRoute() {
  const { data: dataSources } = useSuspenseQuery(engineDataSourcesQuery);
  const { data: notices } = useSuspenseQuery(noticePostsQuery());
  const { data: dynamics } = useSuspenseQuery(dynamicsPostsQuery());
  return (
    <HomePage
      notices={notices.items}
      dynamics={dynamics.items}
      engineDataUrl={dataSources.dataUrl}
      engineModelUrl={dataSources.modelUrl}
    />
  );
}
