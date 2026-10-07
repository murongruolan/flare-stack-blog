import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { CategoriesTable, CategoryStreamsTable } from "@/lib/db/schema";

const coercedDate = z.union([z.date(), z.string().pipe(z.coerce.date())]);

const CategorySelectSchema = createSelectSchema(CategoriesTable, {
  createdAt: coercedDate,
});

export const CategoryOptionSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  streamSlug: z.string().nullable(),
});

export const PublicCategorySchema = CategoryOptionSchema;

export const CategoryWithCountSchema = CategorySelectSchema.extend({
  postCount: z.number(),
  streamName: z.string().nullable(),
});

export const CreateCategoryInputSchema = z.object({
  name: z.string().min(1).max(50),
  streamSlug: z.string().min(1).max(40).nullable().optional(),
});

export const UpdateCategoryInputSchema = z.object({
  id: z.number(),
  data: z.object({
    name: z.string().min(1).max(50).optional(),
    streamSlug: z.string().min(1).max(40).nullable().optional(),
  }),
});

export const DeleteCategoryInputSchema = z.object({
  id: z.number(),
});

export const GetCategoriesInputSchema = z.object({
  sortBy: z.enum(["name", "createdAt", "postCount"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  publicOnly: z.boolean().optional(),
});

// ==================== streams (内容归属) ====================

export const StreamSchema = createSelectSchema(CategoryStreamsTable, {
  createdAt: coercedDate,
});

export const CreateStreamInputSchema = z.object({
  name: z.string().min(1).max(50),
});

export const UpdateStreamInputSchema = z.object({
  id: z.number(),
  data: z.object({
    name: z.string().min(1).max(50),
  }),
});

export const DeleteStreamInputSchema = z.object({
  id: z.number(),
});

export type CategoryWithCount = z.infer<typeof CategoryWithCountSchema>;
export type CreateCategoryInput = z.infer<typeof CreateCategoryInputSchema>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryInputSchema>;
export type DeleteCategoryInput = z.infer<typeof DeleteCategoryInputSchema>;
export type GetCategoriesInput = z.infer<typeof GetCategoriesInputSchema>;
export type Stream = z.infer<typeof StreamSchema>;
export type CreateStreamInput = z.infer<typeof CreateStreamInputSchema>;
export type UpdateStreamInput = z.infer<typeof UpdateStreamInputSchema>;
export type DeleteStreamInput = z.infer<typeof DeleteStreamInputSchema>;
