import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CategoryWithCount } from "@/features/categories/categories.schema";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { formatUegPostDate } from "@/features/posts/utils/format-ueg-post-date";
import {
  isEmergencyCategory,
  postDocCode,
} from "@/features/posts/utils/portal-media";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

export const POLICY_PER_PAGE = 8;

const PAGE_WINDOW = 5;

interface PolicyPageProps {
  posts: Array<PostItem>;
  categories: Array<CategoryWithCount>;
  selectedCategory?: string;
  onCategoryClick: (categoryName?: string) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void | Promise<unknown>;
}

function pageNumbers(current: number, max: number): Array<number> {
  const start = Math.max(1, Math.min(current - 2, max - PAGE_WINDOW + 1));
  const end = Math.min(max, start + PAGE_WINDOW - 1);
  const numbers: Array<number> = [];
  for (let value = start; value <= end; value += 1) numbers.push(value);
  return numbers;
}

function publishedYear(post: PostItem): number | null {
  if (!post.publishedAt) return null;
  const date = new Date(post.publishedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.getUTCFullYear();
}

/**
 * 政策法规 — the public record view. Documents are the published posts, shown
 * with their document reference, issuing category and record dates.
 */
export function PolicyPage({
  posts,
  categories,
  selectedCategory,
  onCategoryClick,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: PolicyPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [year, setYear] = useState<number | null>(null);
  // 分类类型决定归属：政策页只展示 policy 类分类
  const streamCategories = categories.filter(
    (category) => category.type === "policy",
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, year]);

  const years = useMemo(() => {
    const found = new Set<number>();
    for (const post of posts) {
      const value = publishedYear(post);
      if (value) found.add(value);
    }
    return [...found].sort((a, b) => b - a);
  }, [posts]);

  const filtered = useMemo(
    () => (year ? posts.filter((post) => publishedYear(post) === year) : posts),
    [posts, year],
  );

  const loadedPages = Math.max(1, Math.ceil(filtered.length / POLICY_PER_PAGE));
  const maxPage = hasNextPage ? loadedPages + 1 : loadedPages;

  useEffect(() => {
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [currentPage, maxPage]);

  const visiblePosts = useMemo(() => {
    const start = (currentPage - 1) * POLICY_PER_PAGE;
    return filtered.slice(start, start + POLICY_PER_PAGE);
  }, [filtered, currentPage]);

  const goToPage = useCallback(
    (target: number) => {
      if (target < 1 || target > maxPage) return;
      if (target > loadedPages) void fetchNextPage();
      setCurrentPage(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [fetchNextPage, loadedPages, maxPage],
  );

  return (
    <div className="ueg-policy-page">
      <section className="head">
        <div className="crumb">UEG / PUBLIC RECORD / POLICY &amp; REGULATIONS</div>
        <h1>
          政策法规 <span>POLICY &amp; REGULATIONS</span>
        </h1>
      </section>

      <div className="toolbar">
        <button
          type="button"
          className={cn("filter", !selectedCategory && "active")}
          onClick={() => onCategoryClick(undefined)}
        >
          全部
        </button>
        {streamCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={cn(
              "filter",
              selectedCategory === category.name && "active",
            )}
            onClick={() => onCategoryClick(category.name)}
          >
            {category.name}
          </button>
        ))}
      </div>

      <section className="content-grid">
        <div>
          {visiblePosts.length > 0 ? (
            <div className="policy-list">
              {visiblePosts.map((post) => {
                const category = post.category?.name;
                const emergency = isEmergencyCategory(category);
                return (
                  <article
                    key={post.id}
                    className={cn("policy-card", emergency && "is-emergency")}
                  >
                    <div>
                      <div className="policy-id">{postDocCode(post)}</div>
                      <h2 className="policy-title">
                        <Link to="/post/$slug" params={{ slug: post.slug }}>
                          {post.title}
                        </Link>
                      </h2>
                      <p className="policy-summary">{post.summary ?? ""}</p>
                      <div className="policy-meta">
                        <span>
                          发布机关：
                          <span className="meta-strong">
                            {category ?? m.ueg_nav_policy()}
                          </span>
                        </span>
                        <span>
                          发布日期：{formatUegPostDate(post.publishedAt)}
                        </span>
                        {post.updatedAt ? (
                          <span>
                            更新日期：{formatUegPostDate(post.updatedAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="policy-side">
                      <span
                        className={cn(
                          "status",
                          emergency
                            ? "repealed"
                            : post.pinnedAt
                              ? "pending"
                              : undefined,
                        )}
                      >
                        ●{" "}
                        {emergency ? "紧急文件" : post.pinnedAt ? "重点文件" : "现行有效"}
                      </span>
                      <Link
                        to="/post/$slug"
                        params={{ slug: post.slug }}
                        className="view-btn"
                      >
                        查看全文 <b>→</b>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty">{m.posts_no_posts()}</div>
          )}

          {isFetchingNextPage ? (
            <div className="policy-list" style={{ marginTop: "12px" }}>
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="policy-card is-skeleton">
                  <div>
                    <div className="sk-line w-25" />
                    <div className="sk-line w-60" />
                    <div className="sk-line w-90" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {maxPage > 1 ? (
            <div className="pagination">
              <button
                type="button"
                className="page-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="上一页"
              >
                ‹
              </button>
              {pageNumbers(currentPage, maxPage).map((number) => (
                <button
                  key={number}
                  type="button"
                  className={cn("page-btn", number === currentPage && "active")}
                  onClick={() => goToPage(number)}
                  aria-current={number === currentPage ? "page" : undefined}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                className="page-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === maxPage}
                aria-label="下一页"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>

        <aside className="sidebar">
          <div className="side-title">
            <h2>法规导航</h2>
            <small>POLICY INDEX</small>
          </div>

          <div className="side-section">
            <div className="side-kicker">DOCUMENT CATEGORIES</div>
            <div className="side-list">
              <button
                type="button"
                className={cn(!selectedCategory && "active")}
                onClick={() => onCategoryClick(undefined)}
              >
                全部文件
              </button>
              {streamCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={cn(
                    selectedCategory === category.name && "active",
                  )}
                  onClick={() => onCategoryClick(category.name)}
                >
                  {category.name}
                  <span style={{ marginLeft: "6px", opacity: 0.6 }}>
                    {category.postCount}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {years.length > 0 ? (
            <div className="side-section">
              <div className="side-kicker">ANNUAL INDEX</div>
              <div className="year-list">
                {years.map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={cn("year", year === value && "active")}
                    onClick={() =>
                      setYear((current) => (current === value ? null : value))
                    }
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="doc-panel">
            <div className="doc-panel-title">PUBLIC DOCUMENT ACCESS</div>
            <div className="doc-panel-item">
              UEG 所有公开政策文件均由联合地球政府官方信息系统发布。
            </div>
            <div className="doc-panel-item">
              文件编号、发布机关及生效日期均为公开档案字段。
            </div>
            <div className="doc-panel-item">
              部分历史文件可能存在修订、替代或废止记录。
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
