import { Link } from "@tanstack/react-router";
import { Clock, Eye, Flame, Globe, TriangleAlert } from "lucide-react";
import {
  getPublicImageSrc,
  PUBLIC_IMAGE_WIDTH,
} from "@/features/media/utils/media.utils";
import { withCategoryFilter } from "@/features/posts/utils/post-public-search";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { formatPublicPostDate } from "@/features/posts/utils/format-public-post-date";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

interface PostCardProps {
  post: PostItem;
  pinned?: boolean;
  popular?: boolean;
}

type UrgencyLevel = "normal" | "featured" | "emergency";

const EMERGENCY_KEYWORDS = ["紧急", "emergency", "urgent", "alert"];

function isEmergencyCategory(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => n.includes(keyword));
}

function resolveUrgency(
  post: PostItem,
  pinned?: boolean,
  popular?: boolean,
): UrgencyLevel {
  if (isEmergencyCategory(post.category?.name)) return "emergency";
  if (pinned || popular) return "featured";
  return "normal";
}

const URGENCY_CARD_CLASS: Record<UrgencyLevel, string> = {
  normal: "",
  featured: "ueg-card-featured",
  emergency: "ueg-card-emergency",
};

export function PostCard({ post, pinned, popular }: PostCardProps) {
  const urgency = resolveUrgency(post, pinned, popular);
  const tagNames = (post.tags ?? []).map((t) => t.name);
  const hasCover = Boolean(post.cover);
  const categoryName = post.category?.name;

  return (
    <article
      className={cn("ueg-card flex flex-col overflow-hidden relative", URGENCY_CARD_CLASS[urgency])}
    >
      {/* Cover */}
      {hasCover && post.cover ? (
        <Link
          to="/post/$slug"
          params={{ slug: post.slug }}
          aria-label={post.title}
          className="block relative aspect-video overflow-hidden group/cover"
        >
          <img
            src={getPublicImageSrc(post.cover.url, PUBLIC_IMAGE_WIDTH.cover)}
            alt={post.title}
            width={post.cover.width ?? undefined}
            height={post.cover.height ?? undefined}
            className="w-full h-full object-cover transition-transform duration-300 group-hover/cover:scale-105"
          />
          <div className="absolute inset-0 bg-black/0 group-hover/cover:bg-black/25 transition-colors" />
        </Link>
      ) : (
        <div className="relative aspect-video w-full bg-(--ueg-deep) flex items-center justify-center overflow-hidden">
          <Globe
            size={44}
            strokeWidth={1}
            className="text-(--ueg-panel) opacity-80"
          />
        </div>
      )}

      {/* Urgency badge */}
      {urgency !== "normal" && (
        <div className="absolute top-3 left-3 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider px-2.5 py-1 rounded-md uppercase",
              urgency === "emergency"
                ? "bg-(--ueg-red)/90 text-white"
                : "bg-(--ueg-amber)/90 text-[#1a1208]",
            )}
          >
            {urgency === "emergency" ? (
              <>
                <TriangleAlert size={12} strokeWidth={2.5} />
                {m.ueg_emergency()}
              </>
            ) : (
              <>
                {pinned ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-current" />
                ) : (
                  <Flame size={12} strokeWidth={2.5} />
                )}
                {m.ueg_featured()}
              </>
            )}
          </span>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-col flex-1 p-5 md:p-6">
        <time
          dateTime={post.publishedAt?.toISOString()}
          className="ueg-post-time text-[11px] font-semibold mb-2.5"
        >
          {formatPublicPostDate(post.publishedAt)}
        </time>

        <h3 className="mb-2.5">
          <Link
            to="/post/$slug"
            params={{ slug: post.slug }}
            className="ueg-post-title text-xl md:text-2xl font-bold leading-snug line-clamp-2 hover:text-(--ueg-steel) transition-colors"
          >
            {post.title}
          </Link>
        </h3>

        <p className="ueg-post-summary text-sm leading-relaxed line-clamp-3 mb-4 flex-1">
          {post.summary ?? ""}
        </p>

        <div className="flex items-center justify-between gap-3 border-t border-(--ueg-card-border)/70 pt-3.5">
          <div className="flex items-center gap-2 min-w-0">
            {categoryName ? (
              <Link
                to="/posts"
                search={withCategoryFilter(categoryName)}
                className={cn(
                  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap transition-opacity hover:opacity-80",
                  urgency === "emergency" && isEmergencyCategory(categoryName)
                    ? "ueg-tag-emergency"
                    : urgency === "featured"
                      ? "ueg-tag-important"
                      : "ueg-tag",
                )}
              >
                {categoryName}
              </Link>
            ) : null}
            {tagNames.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 min-w-0">
                {tagNames.slice(0, 2).map((name) => (
                  <span
                    key={name}
                    className="ueg-tag rounded-md px-2 py-1 text-xs font-medium whitespace-nowrap"
                  >
                    {name}
                  </span>
                ))}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-(--ueg-text-sub) shrink-0">
            <span className="inline-flex items-center gap-1">
              <Clock size={13} />
              {m.read_time({ count: post.readTimeInMinutes })}
            </span>
            {post.viewCount !== undefined && (
              <span className="inline-flex items-center gap-1">
                <Eye size={13} />
                {m.post_views_count({ count: post.viewCount })}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
