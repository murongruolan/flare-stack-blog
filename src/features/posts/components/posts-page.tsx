import { Link } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryWithCount } from "@/features/categories/categories.schema";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { formatUegPostDate } from "@/features/posts/utils/format-ueg-post-date";
import {
  isEmergencyCategory,
  postImage,
} from "@/features/posts/utils/portal-media";
import { PUBLIC_IMAGE_WIDTH } from "@/features/media/utils/media.utils";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import { UegApplyCards } from "./ueg-apply-cards";

export const POSTS_PER_PAGE = 8;

const PAGE_WINDOW = 5;

interface PostsPageProps {
  posts: Array<PostItem>;
  categories: Array<CategoryWithCount>;
  selectedCategory?: string;
  selectedTag?: string;
  onCategoryClick: (categoryName?: string) => void;
  onClearTag: () => void;
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

export function PostsPage({
  posts,
  categories,
  selectedCategory,
  selectedTag,
  onCategoryClick,
  onClearTag,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: PostsPageProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const listRef = useRef<HTMLDivElement>(null);

  // A filter change resets pagination.
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedTag]);

  const loadedPages = Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
  const maxPage = hasNextPage ? loadedPages + 1 : loadedPages;

  // A short final page can leave the reader on a page that no longer exists.
  useEffect(() => {
    if (currentPage > maxPage) setCurrentPage(maxPage);
  }, [currentPage, maxPage]);

  const visiblePosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return posts.slice(start, start + POSTS_PER_PAGE);
  }, [posts, currentPage]);

  const goToPage = useCallback(
    (target: number) => {
      if (target < 1 || target > maxPage) return;
      if (target > loadedPages) {
        void fetchNextPage();
      }
      setCurrentPage(target);
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [fetchNextPage, loadedPages, maxPage],
  );

  return (
    <div className="ueg-news-page">
      <section className="head">
        <div className="crumb">UEG / INFORMATION CENTER / NEWS</div>
        <h1>
          新闻动态 <span>NEWS &amp; INFORMATION</span>
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
        {categories.map((category) => (
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
        {selectedTag ? (
          <button type="button" className="active-tag" onClick={onClearTag}>
            标签：{selectedTag} <b>×</b>
          </button>
        ) : null}
      </div>

      <section className="layout">
        <div ref={listRef}>
          {visiblePosts.length > 0 ? (
            <div className="list">
              {visiblePosts.map((post) => {
                const category = post.category?.name;
                const emergency = isEmergencyCategory(category);
                return (
                  <article
                    key={post.id}
                    className={cn("card", emergency && "is-emergency")}
                  >
                    <Link
                      to="/post/$slug"
                      params={{ slug: post.slug }}
                      className="thumb"
                      style={
                        {
                          "--thumb-image": `url('${postImage(
                            post,
                            PUBLIC_IMAGE_WIDTH.cover,
                          )}')`,
                        } as CSSProperties
                      }
                      aria-label={post.title}
                    />
                    <div className="body">
                      <div className="meta">
                        <span className={cn("tag", emergency && "alert")}>
                          {category ?? m.ueg_nav_news()}
                        </span>
                        <span>{formatUegPostDate(post.publishedAt)}</span>
                      </div>
                      <h2 className="title">
                        <Link to="/post/$slug" params={{ slug: post.slug }}>
                          {post.title}
                        </Link>
                      </h2>
                      <p className="desc">{post.summary ?? ""}</p>
                      <Link
                        to="/post/$slug"
                        params={{ slug: post.slug }}
                        className="read"
                      >
                        阅读全文 <b>→</b>
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
            <div className="list" style={{ marginTop: "12px" }}>
              {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="card is-skeleton">
                  <span className="thumb" />
                  <div className="body">
                    <div className="sk-line w-30" />
                    <div className="sk-line w-70" />
                    <div className="sk-line w-90" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {maxPage > 1 ? (
            <div className="pages">
              <button
                type="button"
                className="pagebtn"
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
                  className={cn("pagebtn", number === currentPage && "active")}
                  onClick={() => goToPage(number)}
                  aria-current={number === currentPage ? "page" : undefined}
                >
                  {number}
                </button>
              ))}
              <button
                type="button"
                className="pagebtn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === maxPage}
                aria-label="下一页"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>

        <UegApplyCards />
      </section>
    </div>
  );
}
