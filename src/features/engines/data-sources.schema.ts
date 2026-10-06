import { z } from "zod";

/**
 * R2 对象 key 约束：字母/数字开头，仅字母数字与 . _ - /，
 * 不允许 ".."、首尾斜杠和空白。管理员在后台直接填 R2 路径，
 * 例如 blog-media/engines/planetary-engine-draco.glb。
 */
const R2_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

function r2KeyField(extension: RegExp) {
  return z
    .string()
    .trim()
    .max(400)
    .refine(
      (value) => value === "" || (!value.includes("..") && R2_KEY_PATTERN.test(value)),
      { message: "INVALID_R2_KEY" },
    )
    .refine((value) => value === "" || extension.test(value), {
      message: "INVALID_EXTENSION",
    })
    .default("");
}

export const EngineDataSourcesInputSchema = z.object({
  engineModelKey: r2KeyField(/\.glb$/i),
  engineDataKey: r2KeyField(/\.(geojson|json|csv)$/i),
});

export type EngineDataSourcesInput = z.infer<typeof EngineDataSourcesInputSchema>;

export const EngineDataSourcesSchema = z.object({
  /** 实际生效的 R2 key（配置值或内置默认值）。 */
  modelKey: z.string(),
  dataKey: z.string(),
  /** 带 /images 前缀和 ?v= 版本号的最终资源 URL，前端直接使用。 */
  modelUrl: z.string(),
  dataUrl: z.string(),
  revision: z.number().int().nonnegative(),
  /** 是否至少配置过一项（false = 全部走内置默认）。 */
  configured: z.boolean(),
});

export type EngineDataSources = z.infer<typeof EngineDataSourcesSchema>;
