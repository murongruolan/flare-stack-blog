import { createFileRoute } from "@tanstack/react-router";
import { OrganizationPageV2 } from "@/features/organization/components/organization-page-v2";

/**
 * 机构介绍 V2（对比版）：按外部锐评重排。
 * 与 /organization（V1）并存用于视觉对比，赢家留下、输家删除。
 */
export const Route = createFileRoute("/_public/organization-v2")({
  component: OrganizationPageV2,
  loader: () => ({ title: "机构介绍 V2 · 对比版" }),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData?.title }],
  }),
});
