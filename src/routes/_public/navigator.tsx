import { createFileRoute } from "@tanstack/react-router";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { NavigatorPage } from "@/features/public-service/components/navigator-page";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/navigator")({
  component: NavigatorPage,
  loader: async ({ context }) => {
    const [domain, siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: m.ueg_nav_navigator(),
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/navigator"),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/navigator")],
  }),
});
