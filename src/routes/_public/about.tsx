import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/features/about/components/about-page";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
  loader: async ({ context }) => {
    const [domain, siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: m.ueg_nav_about(),
      description: siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, "/about"),
    };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.title },
      { name: "description", content: loaderData?.description },
    ],
    links: [canonicalLink(loaderData?.canonicalHref ?? "/about")],
  }),
});
