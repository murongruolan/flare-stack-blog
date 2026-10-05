import { createFileRoute } from "@tanstack/react-router";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { OrganizationPage } from "@/features/organization/components/organization-page";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/organization/")({
  component: OrganizationPage,
  loader: async ({ context }) => {
    const [domain, siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: m.ueg_nav_org(),
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/organization"),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/organization")],
  }),
});
