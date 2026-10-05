import {
  getPublicImageSrc,
  PUBLIC_IMAGE_WIDTH,
} from "@/features/media/utils/media.utils";
import type { PostItem } from "@/features/posts/schema/posts.schema";

/**
 * Portal artwork.
 *
 * Post covers always win. Bookkeeping-only local installs often have no covers
 * at all, so a stable decorative image is chosen per slug to keep the official
 * portal look instead of collapsing cards into empty panels. Clear
 * `decoration` (or upload real covers) to opt out.
 */
export const PORTAL_MEDIA = {
  hero: [
    "/images/hero-orbit-station.jpg",
    "/images/hero-engines.jpg",
    "/images/hero-jupiter.jpg",
  ],
  feature: ["/images/hero-orbit-station.jpg", "/images/hero-engines.jpg"],
  decoration: [
    "/images/hero-orbit-station.jpg",
    "/images/hero-engines.jpg",
    "/images/hero-jupiter.jpg",
    "/images/home-bg.webp",
  ],
} as const;

const EMERGENCY_KEYWORDS = ["紧急", "emergency", "urgent", "alert"];

export function isEmergencyCategory(name?: string | null): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function stableIndex(seed: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % buckets;
}

export function postImage(post: PostItem, width: number): string {
  if (post.cover) return getPublicImageSrc(post.cover.url, width);
  const key =
    PORTAL_MEDIA.decoration[
      stableIndex(post.slug, PORTAL_MEDIA.decoration.length)
    ];
  return getPublicImageSrc(key, width);
}

export function heroImage(index: number): string {
  const key = PORTAL_MEDIA.hero[index % PORTAL_MEDIA.hero.length];
  return getPublicImageSrc(key, PUBLIC_IMAGE_WIDTH.banner);
}

const CATEGORY_CODES: Array<[RegExp, string]> = [
  [/紧急|突发|预警|emergency|urgent|alert/i, "EMG"],
  [/科研|航天|空间|科技|science|research|space/i, "SPC"],
  [/社会|民生|居民|social|society/i, "SOC"],
  [/政策|法规|公告|policy|notice|regulation/i, "POL"],
  [/军事|防务|defen[cs]e|military/i, "DEF"],
  [/经济|资源|贸易|econom/i, "ECO"],
];

export function categoryCode(name?: string | null): string {
  if (!name) return "NEWS";
  for (const [pattern, code] of CATEGORY_CODES) {
    if (pattern.test(name)) return code;
  }
  return "NEWS";
}

function twoDigit(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Presentation-only document reference shown on the news list, e.g.
 * `UEG-NEWS-2089-0317-01`. Derived from the post itself, never stored.
 */
export function postDocCode(post: PostItem): string {
  const code = categoryCode(post.category?.name);
  const date = post.publishedAt ? new Date(post.publishedAt) : null;
  if (!date || Number.isNaN(date.getTime())) {
    return `UEG-${code}-0000-0000-${twoDigit(post.id % 100)}`;
  }
  const stamp = `${date.getUTCFullYear()}-${twoDigit(
    date.getUTCMonth() + 1,
  )}${twoDigit(date.getUTCDate())}`;
  return `UEG-${code}-${stamp}-${twoDigit(post.id % 100)}`;
}
