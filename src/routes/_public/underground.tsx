import { createFileRoute } from "@tanstack/react-router";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { UndergroundPage } from "@/features/public-service/components/underground-page";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/underground")({
  component: UndergroundPage,
  loader: async ({ context }) => {
    const [domain, siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: m.ueg_nav_underground(),
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/underground"),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/underground")],
  }),
});
