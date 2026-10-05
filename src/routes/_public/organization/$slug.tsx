import { createFileRoute, notFound } from "@tanstack/react-router";
import { siteConfigQuery, siteDomainQuery } from "@/features/config/queries";
import { OrganizationDetailPage } from "@/features/organization/components/organization-detail-page";
import { getOrganization } from "@/features/organization/data/organizations";
import { buildCanonicalUrl, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_public/organization/$slug")({
  component: RouteComponent,
  loader: async ({ context, params }) => {
    const org = getOrganization(params.slug);
    if (!org) {
      throw notFound();
    }

    const [domain, siteConfig] = await Promise.all([
      context.queryClient.ensureQueryData(siteDomainQuery),
      context.queryClient.ensureQueryData(siteConfigQuery),
    ]);

    return {
      title: org.title,
      description: org.summary || siteConfig.description,
      canonicalHref: buildCanonicalUrl(domain, `/organization/${org.slug}`),
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

function RouteComponent() {
  const { slug } = Route.useParams();
  return <OrganizationDetailPage slug={slug} />;
}
