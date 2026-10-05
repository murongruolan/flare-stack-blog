import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { ClientOnly, Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPublicImageSrc,
  PUBLIC_IMAGE_WIDTH,
} from "@/features/media/utils/media.utils";
import { CommentSection } from "@/features/comments/components/comment-section";
import { ContentRenderer } from "@/features/posts/components/content/content-renderer";
import { postsInfiniteQueryOptions } from "@/features/posts/queries";
import type { PostWithToc } from "@/features/posts/schema/posts.schema";
import { formatUegPostDate } from "@/features/posts/utils/format-ueg-post-date";
import { isEmergencyCategory, postDocCode } from "@/features/posts/utils/portal-media";
import { withTagFilter } from "@/features/posts/utils/post-public-search";
import type { TableOfContentsItem } from "@/features/posts/utils/toc";
import { authClient } from "@/lib/auth/auth.client";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import ZoomableImage from "./content/zoomable-image";

interface PostPageProps {
  post: Exclude<PostWithToc, null>;
  authorName: string;
}

const RELATED_LIMIT = 5;
const RELATED_SHOWN = 3;

export { RELATED_LIMIT };

function scrollToHeading(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  const top = element.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo({
    top,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? ("instant" as ScrollBehavior)
      : "smooth",
  });
}

/** Sidebar contents list with active-section tracking. */
function ArticleToc({ headers }: { headers: Array<TableOfContentsItem> }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headers.length === 0) return;
    const onScroll = () => {
      let current: string | null = headers[0]?.id ?? null;
      for (const heading of headers) {
        const element = document.getElementById(heading.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= 120) current = heading.id;
        else break;
      }
      setActiveId(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [headers]);

  if (headers.length === 0) return null;

  return (
    <div className="toc">
      {headers.map((heading) => (
        <a
          key={heading.id}
          href={`#${heading.id}`}
          className={cn(activeId === heading.id && "active")}
          onClick={(event) => {
            if (
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            ) {
              return;
            }
            event.preventDefault();
            history.replaceState(null, "", `#${heading.id}`);
            scrollToHeading(heading.id);
          }}
        >
          {heading.text.replace(/#$/, "")}
        </a>
      ))}
    </div>
  );
}

/** Real share actions: copy, native share when available, print. */
function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const flash = () => {
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-actions">
      <button
        type="button"
        className="share-btn"
        onClick={async () => {
          const url = window.location.href;
          try {
            await navigator.clipboard.writeText(url);
            flash();
          } catch {
            window.prompt("复制链接", url);
          }
        }}
      >
        {copied ? "已复制链接" : "复制链接"}
      </button>
      <button
        type="button"
        className="share-btn"
        onClick={async () => {
          const url = window.location.href;
          if (typeof navigator.share === "function") {
            try {
              await navigator.share({ title, url });
              return;
            } catch {
              /* the reader dismissed the sheet */
            }
          }
          try {
            await navigator.clipboard.writeText(url);
            flash();
          } catch {
            window.prompt("分享档案", url);
          }
        }}
      >
        {copied ? "已复制链接" : "分享档案"}
      </button>
      <button
        type="button"
        className="share-btn"
        onClick={() => window.print()}
      >
        打印
      </button>
    </div>
  );
}

export function PostPage({ post, authorName }: PostPageProps) {
  const { data: session } = authClient.useSession();
  // 浏览量字段后端暂未提供，数据里带出来时才展示
  const viewCount = (post as { viewCount?: number }).viewCount;

  const { data: related } = useSuspenseInfiniteQuery(
    postsInfiniteQueryOptions({
      categoryName: post.category?.name,
      limit: RELATED_LIMIT,
    }),
  );

  const relatedPosts = useMemo(() => {
    const items = related.pages.flatMap((page) => page.items);
    return items
      .filter((item) => item.slug !== post.slug)
      .slice(0, RELATED_SHOWN);
  }, [related, post.slug]);

  const emergency = isEmergencyCategory(post.category?.name);
  const docCode = postDocCode(post);
  const wordCount = post.readTimeInMinutes * 300;

  return (
    <div className="ueg-article-page">
      <div className="crumb">
        UEG / INFORMATION CENTER / NEWS / {docCode}
      </div>

      <div className="article-layout">
        <article className="article">
          <header className="article-head">
            <span className={cn("tag", emergency && "alert")}>
              {post.category?.name ?? m.ueg_nav_news()}
            </span>
            <h1>{post.title}</h1>
            <div className="meta">
              <span>发布：{authorName}</span>
              <span>{formatUegPostDate(post.publishedAt)}</span>
              <span>档案编号：{docCode}</span>
              <span>公开级别：PUBLIC</span>
              <span>
                {m.post_word_count({ count: wordCount })} ·{" "}
                {m.read_time({ count: post.readTimeInMinutes })}
              </span>
              {viewCount !== undefined ? (
                <span>{m.post_views_count({ count: viewCount })}</span>
              ) : null}
              <ClientOnly>
                {session?.user.role === "admin" ? (
                  <Link
                    to="/admin/posts/edit/$id"
                    params={{ id: String(post.id) }}
                    className="inline-flex items-center gap-1"
                  >
                    <Pencil size={11} strokeWidth={1.5} />
                    {m.post_edit()}
                  </Link>
                ) : null}
              </ClientOnly>
            </div>
          </header>

          <div className="article-body">
            {post.summary ? <p className="lead">{post.summary}</p> : null}

            {post.cover ? (
              <div className="mt-6 mb-8 overflow-hidden rounded-xl">
                <ZoomableImage
                  src={getPublicImageSrc(
                    post.cover.url,
                    PUBLIC_IMAGE_WIDTH.cover,
                  )}
                  alt={post.title}
                  width={post.cover.width ?? undefined}
                  height={post.cover.height ?? undefined}
                  className="w-full h-auto object-cover"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>
            ) : (
              <div className="image-placeholder" aria-hidden="true" />
            )}

            <div className="prose dark:prose-invert prose-base max-w-none! fuwari-custom-md">
              <ContentRenderer content={post.contentJson} />
            </div>

            {post.tags && post.tags.length > 0 ? (
              <div className="doc-row">
                {post.tags.map((tag) => (
                  <Link
                    key={tag.name}
                    className="doc-chip"
                    to="/posts"
                    search={withTagFilter(tag.name)}
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            ) : null}

            <div className="share">
              <span>ARTICLE / PUBLIC RECORD</span>
              <ShareActions title={post.title} />
            </div>
          </div>
        </article>

        <aside className="side">
          {relatedPosts.length > 0 ? (
            <div className="panel">
              <div className="panel-title">
                <h2>相关文章</h2>
                <small>RELATED</small>
              </div>
              {relatedPosts.map((item) => (
                <Link
                  key={item.slug}
                  className="related"
                  to="/post/$slug"
                  params={{ slug: item.slug }}
                >
                  <div className="k">
                    {item.category?.name ?? "ARCHIVE"} ·{" "}
                    {formatUegPostDate(item.publishedAt)}
                  </div>
                  <div className="t">{item.title}</div>
                  <div className="d">{postDocCode(item)}</div>
                </Link>
              ))}
            </div>
          ) : null}

          {post.toc.length > 0 ? (
            <div className="panel">
              <div className="panel-title">
                <h2>文章导航</h2>
                <small>CONTENTS</small>
              </div>
              <ArticleToc headers={post.toc} />
            </div>
          ) : null}

          <div className="panel">
            <div className="panel-title">
              <h2>申请服务</h2>
              <small>PUBLIC SERVICE</small>
            </div>
            <Link className="apply-card" to="/navigator">
              <div className="apply-kicker">APPLICATION / 01</div>
              <div className="apply-title">{m.ueg_feature_navigator_title()}</div>
              <div className="apply-sub">
                NAVIGATOR SPACE STATION RECRUITMENT
              </div>
              <div className="apply-desc">进入 UEG 领航员计划申请系统。</div>
              <span className="apply-go">进入申请 →</span>
            </Link>
            <Link className="apply-card" to="/underground">
              <div className="apply-kicker">APPLICATION / 02</div>
              <div className="apply-title">{m.ueg_feature_underground_title()}</div>
              <div className="apply-sub">
                UNDERGROUND CITY ACCESS PROGRAM
              </div>
              <div className="apply-desc">进入 UEG 地下城居民资格认证系统。</div>
              <span className="apply-go">进入申请 →</span>
            </Link>
          </div>
        </aside>
      </div>

      <section className="article mt-4">
        <div className="article-body">
          <CommentSection postId={post.id} />
        </div>
      </section>
    </div>
  );
}
