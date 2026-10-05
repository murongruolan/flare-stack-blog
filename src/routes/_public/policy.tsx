import {
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { categoriesQueryOptions } from "@/features/categories/queries";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import {
  POLICY_PER_PAGE,
  PolicyPage,
} from "@/features/posts/components/policy-page";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import { PostCategoryNameSchema } from "@/features/posts/schema/posts.schema";
import { withCategoryFilter } from "@/features/posts/utils/post-public-search";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/policy")({
  validateSearch: z.object({
    categoryName: PostCategoryNameSchema,
  }),
  component: RouteComponent,
  loaderDeps: ({ search }) => ({ categoryName: search.categoryName }),
  loader: async ({ context, deps }) => {
    const [, , domain, siteConfig] = await Promise.all([
      context.queryClient.prefetchInfiniteQuery(
        postsInfiniteQueryOptions({
          categoryName: deps.categoryName,
          limit: POLICY_PER_PAGE,
        }),
      ),
      context.queryClient.prefetchQuery(categoriesQueryOptions),
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: m.ueg_nav_policy(),
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/policy", {
        categoryName: deps.categoryName,
      }),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/policy")],
  }),
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: categories } = useSuspenseQuery(categoriesQueryOptions);
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useSuspenseInfiniteQuery(
      postsInfiniteQueryOptions({
        categoryName: search.categoryName,
        limit: POLICY_PER_PAGE,
      }),
    );

  const posts = useMemo(() => data.pages.flatMap((page) => page.items), [data]);

  const handleCategoryClick = (categoryName?: string) => {
    navigate({ search: withCategoryFilter(categoryName), replace: true });
  };

  return (
    <PolicyPage
      posts={posts}
      categories={categories}
      selectedCategory={search.categoryName}
      onCategoryClick={handleCategoryClick}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  );
}
