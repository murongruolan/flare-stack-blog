import { invalidate } from "@/features/cache/public-cache";
import * as StreamRepo from "@/features/categories/data/category-streams.data";
import * as CategoryRepo from "@/features/categories/data/categories.data";
import type {
  CreateStreamInput,
  DeleteStreamInput,
  UpdateStreamInput,
} from "@/features/categories/categories.schema";
import { err, ok } from "@/lib/errors";

export async function getStreams(context: DbContext) {
  return StreamRepo.listStreams(context.db);
}

export async function createStream(
  context: DbContext & { executionCtx: ExecutionContext },
  data: CreateStreamInput,
) {
  const name = data.name.trim();
  if (await StreamRepo.streamNameExists(context.db, name)) {
    return err({ reason: "STREAM_NAME_ALREADY_EXISTS" });
  }
  const slug = await StreamRepo.generateStreamSlug(context.db, name);
  const stream = await StreamRepo.insertStream(context.db, { name, slug });
  context.executionCtx.waitUntil(
    invalidate.categoryChanged(context, { slugs: [] }),
  );
  return ok(stream);
}

export async function updateStream(
  context: DbContext & { executionCtx: ExecutionContext },
  data: UpdateStreamInput,
) {
  const existing = await StreamRepo.findStreamById(context.db, data.id);
  if (!existing) {
    return err({ reason: "STREAM_NOT_FOUND" });
  }
  const name = data.data.name.trim();
  if (name !== existing.name && (await StreamRepo.streamNameExists(context.db, name))) {
    return err({ reason: "STREAM_NAME_ALREADY_EXISTS" });
  }
  const affectedPosts = await CategoryRepo.getPublishedPostsByStreamSlug(
    context.db,
    existing.slug,
  );
  const stream = await StreamRepo.updateStream(context.db, data.id, {
    name,
  });
  context.executionCtx.waitUntil(
    invalidate.categoryChanged(context, {
      slugs: affectedPosts.flatMap((post) => (post.slug ? [post.slug] : [])),
    }),
  );
  return ok(stream);
}

export async function deleteStream(
  context: DbContext & { executionCtx: ExecutionContext },
  data: DeleteStreamInput,
) {
  const existing = await StreamRepo.findStreamById(context.db, data.id);
  if (!existing) {
    return err({ reason: "STREAM_NOT_FOUND" });
  }
  if (StreamRepo.RESERVED_STREAM_SLUGS.includes(existing.slug)) {
    return err({ reason: "STREAM_RESERVED" });
  }
  const inUse = await StreamRepo.countCategoriesByStreamSlug(
    context.db,
    existing.slug,
  );
  if (inUse > 0) {
    return err({ reason: "STREAM_IN_USE", count: inUse });
  }
  await StreamRepo.deleteStream(context.db, data.id);
  context.executionCtx.waitUntil(
    invalidate.categoryChanged(context, { slugs: [] }),
  );
  return ok({ success: true });
}
