import { getCategoryOptions as readCategoryOptions } from "./data/category-options.data";
import { invalidate } from "@/features/cache/public-cache";
import { publicCategoryList } from "@/features/categories/categories.cache";
import * as CategoryRepo from "@/features/categories/data/categories.data";
import * as StreamRepo from "@/features/categories/data/category-streams.data";
import type {
  CreateCategoryInput,
  DeleteCategoryInput,
  GetCategoriesInput,
  UpdateCategoryInput,
} from "@/features/categories/categories.schema";
import { NEWS_STREAM_SLUG } from "@/lib/db/schema";
import { err, ok } from "@/lib/errors";

async function invalidateCategoryRelatedCache(
  context: DbContext & { executionCtx: ExecutionContext },
  affectedPosts: Array<{ id: number; slug: string | null }>,
) {
  await invalidate.categoryChanged(context, {
    slugs: affectedPosts.flatMap((post) => (post.slug ? [post.slug] : [])),
  });
}

export async function getPublicCategories(
  context: DbContext & {
    executionCtx: ExecutionContext;
  },
) {
  return publicCategoryList.get(context, {});
}

export async function getCategories(
  context: DbContext,
  data: GetCategoriesInput = {},
) {
  const { sortBy = "name", sortDir = "asc", publicOnly = false } = data;
  const [
    items,
    uncategorizedPostCount,
    publicItems,
    uncategorizedPublicPostCount,
  ] = await Promise.all([
    CategoryRepo.getAllCategoriesWithCount(context.db, {
      sortBy,
      sortDir,
      publicOnly,
    }),
    CategoryRepo.countUncategorizedPosts(context.db),
    CategoryRepo.getAllCategoriesWithCount(context.db, { publicOnly: true }),
    CategoryRepo.countUncategorizedPosts(context.db, true),
  ]);
  const publicCounts = new Map(
    publicItems.map((item) => [item.id, item.postCount]),
  );
  return {
    items: items.map((item) => ({
      ...item,
      publicPostCount: publicCounts.get(item.id) ?? 0,
    })),
    uncategorizedPostCount,
    uncategorizedPublicPostCount,
  };
}

export async function resolveStreamSlug(
  db: DB,
  streamSlug: string | null | undefined,
): Promise<{ reason?: "STREAM_NOT_FOUND"; slug: string | null }> {
  if (streamSlug == null || streamSlug === "") return { slug: null };
  const exists = await StreamRepo.streamSlugExists(db, streamSlug);
  return exists ? { slug: streamSlug } : { reason: "STREAM_NOT_FOUND", slug: null };
}

export const createCategory = async (
  context: DbContext,
  data: CreateCategoryInput,
) => {
  const exists = await CategoryRepo.nameExists(context.db, data.name);
  if (exists) {
    return err({ reason: "CATEGORY_NAME_ALREADY_EXISTS" });
  }
  const stream = await resolveStreamSlug(
    context.db,
    data.streamSlug ?? NEWS_STREAM_SLUG,
  );
  if (stream.reason) {
    return err({ reason: stream.reason });
  }

  const category = await CategoryRepo.insertCategory(context.db, {
    name: data.name,
    streamSlug: stream.slug,
  });
  return ok(category);
};

export async function updateCategory(
  context: DbContext & { executionCtx: ExecutionContext },
  data: UpdateCategoryInput,
) {
  const existing = await CategoryRepo.findCategoryById(context.db, data.id);
  if (!existing) {
    return err({ reason: "CATEGORY_NOT_FOUND" });
  }

  if (data.data.name && data.data.name !== existing.name) {
    const exists = await CategoryRepo.nameExists(context.db, data.data.name, {
      excludeId: data.id,
    });
    if (exists) {
      return err({ reason: "CATEGORY_NAME_ALREADY_EXISTS" });
    }
  }

  let nextStreamSlug = existing.streamSlug;
  if (data.data.streamSlug !== undefined) {
    const resolved = await resolveStreamSlug(context.db, data.data.streamSlug);
    if (resolved.reason) {
      return err({ reason: resolved.reason });
    }
    nextStreamSlug = resolved.slug;
  }

  const affectedPosts = await CategoryRepo.getPublishedPostsByCategoryId(
    context.db,
    data.id,
  );
  const category = await CategoryRepo.updateCategory(context.db, data.id, {
    ...(data.data.name ? { name: data.data.name } : {}),
    ...(data.data.streamSlug !== undefined
      ? { streamSlug: nextStreamSlug }
      : {}),
  });

  context.executionCtx.waitUntil(
    invalidateCategoryRelatedCache(context, affectedPosts),
  );

  return ok(category);
}

export async function deleteCategory(
  context: DbContext & { executionCtx: ExecutionContext },
  data: DeleteCategoryInput,
) {
  const category = await CategoryRepo.findCategoryById(context.db, data.id);
  if (!category) {
    return err({ reason: "CATEGORY_NOT_FOUND" });
  }

  const affectedPosts = await CategoryRepo.getPublishedPostsByCategoryId(
    context.db,
    data.id,
  );
  await CategoryRepo.deleteCategory(context.db, data.id);

  context.executionCtx.waitUntil(
    invalidateCategoryRelatedCache(context, affectedPosts),
  );

  return ok({ success: true });
}

export function getCategoryOptions(context: DbContext) {
  return readCategoryOptions(context.db);
}
