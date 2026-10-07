import { and, asc, count, eq, ne } from "drizzle-orm";
import { CategoriesTable, CategoryStreamsTable } from "@/lib/db/schema";
import {
  NEWS_STREAM_SLUG,
  POLICY_STREAM_SLUG,
} from "@/lib/db/schema/posts.table";

export const RESERVED_STREAM_SLUGS = [NEWS_STREAM_SLUG, POLICY_STREAM_SLUG];

export async function listStreams(db: DB) {
  return await db
    .select()
    .from(CategoryStreamsTable)
    .orderBy(asc(CategoryStreamsTable.id));
}

export async function streamNameExists(
  db: DB,
  name: string,
  options: { excludeId?: number } = {},
) {
  const conditions = [eq(CategoryStreamsTable.name, name)];
  if (options.excludeId != null) {
    conditions.push(ne(CategoryStreamsTable.id, options.excludeId));
  }
  const [row] = await db
    .select({ id: CategoryStreamsTable.id })
    .from(CategoryStreamsTable)
    .where(and(...conditions))
    .limit(1);
  return !!row;
}

export async function streamSlugExists(db: DB, slug: string) {
  const [row] = await db
    .select({ id: CategoryStreamsTable.id })
    .from(CategoryStreamsTable)
    .where(eq(CategoryStreamsTable.slug, slug))
    .limit(1);
  return !!row;
}

/**
 * Slugs are the wiring between streams and public pages, so existing rows
 * never change theirs; new rows get a name-derived slug with a numeric
 * suffix when taken.
 */
export async function generateStreamSlug(db: DB, name: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "stream";
  let slug = base;
  for (let n = 2; (await streamSlugExists(db, slug)); n += 1) {
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function findStreamById(db: DB, id: number) {
  return await db.query.CategoryStreamsTable.findFirst({
    where: eq(CategoryStreamsTable.id, id),
  });
}

export async function insertStream(
  db: DB,
  data: typeof CategoryStreamsTable.$inferInsert,
) {
  const [stream] = await db.insert(CategoryStreamsTable).values(data).returning();
  return stream;
}

export async function updateStream(db: DB, id: number, data: { name: string }) {
  const [stream] = await db
    .update(CategoryStreamsTable)
    .set(data)
    .where(eq(CategoryStreamsTable.id, id))
    .returning();
  return stream;
}

export async function deleteStream(db: DB, id: number) {
  await db.delete(CategoryStreamsTable).where(eq(CategoryStreamsTable.id, id));
}

export async function countCategoriesByStreamSlug(db: DB, slug: string) {
  const [row] = await db
    .select({ n: count() })
    .from(CategoriesTable)
    .where(eq(CategoriesTable.streamSlug, slug));
  return Number(row?.n ?? 0);
}
