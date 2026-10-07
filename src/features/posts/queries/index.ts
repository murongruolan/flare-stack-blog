import {
  normalizePostCategoryName,
  normalizePostTagName,
  type GetPostsInput,
} from "@/features/posts/schema/posts.schema";
import { orpc } from "@/lib/orpc";

export function homePostsQuery(page: number) {
  return orpc.posts.home.queryOptions({ input: { page } });
}

export function postsInfiniteQueryOptions(
  filters: {
    tagName?: string;
    categoryName?: string;
    uncategorized?: boolean;
    categoryType?: string;
    limit?: number;
  } = {},
) {
  const pageSize = filters.limit ?? 12;
  const tagName = normalizePostTagName(filters.tagName);
  const categoryName = normalizePostCategoryName(filters.categoryName);
  const uncategorized = filters.uncategorized === true;
  return orpc.posts.list.infiniteOptions({
    input: (pageParam: number | undefined) => ({
      cursor: pageParam,
      limit: pageSize,
      tagName,
      categoryName: uncategorized ? undefined : categoryName,
      uncategorized: uncategorized || undefined,
      categoryType: filters.categoryType,
    }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

/**
 * 通告分类：首页「最新通告」栏只从这里取。分类是后台数据，这里按名匹配；
 * 改名需同步此常量。
 */
export const NOTICE_CATEGORY_NAMES = ["政府公告", "紧急通告"];

export function noticePostsQuery(limit = 5) {
  return orpc.posts.list.queryOptions({
    input: { limit, categoryNames: NOTICE_CATEGORY_NAMES },
  });
}

export function dynamicsPostsQuery(limit = 4) {
  return orpc.posts.list.queryOptions({
    input: { limit, excludeCategoryNames: NOTICE_CATEGORY_NAMES },
  });
}

export function postBySlugQuery(slug: string) {
  return orpc.posts.bySlug.queryOptions({ input: { slug } });
}

export function postByIdQuery(id: number) {
  return orpc.posts.admin.get.queryOptions({ input: { id } });
}

export function adminPostsQuery(input: GetPostsInput) {
  return orpc.posts.admin.list.queryOptions({ input });
}

export function adjacentPostsQuery(slug: string) {
  return orpc.posts.adjacent.queryOptions({ input: { slug } });
}

export function postRevisionListQuery(postId: number) {
  return orpc.posts.admin.revisions.list.queryOptions({
    input: { postId },
  });
}

export function postRevisionDetailQuery(postId: number, revisionId: number) {
  return orpc.posts.admin.revisions.get.queryOptions({
    input: { postId, revisionId },
  });
}

export function popularPostsQuery(limit?: number) {
  return orpc.posts.popular.queryOptions({ input: { limit } });
}
