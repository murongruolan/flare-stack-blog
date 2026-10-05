import { Link } from "@tanstack/react-router";
import { ArrowRight, Rocket, ShieldCheck } from "lucide-react";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { withCategoryFilter } from "@/features/posts/utils/post-public-search";
import { formatUegPostDate } from "@/features/posts/utils/format-ueg-post-date";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

/* ---------- urgency helpers (kept local to avoid touching PostCard) ---------- */

type UrgencyLevel = "normal" | "featured" | "emergency";

const EMERGENCY_KEYWORDS = ["紧急", "emergency", "urgent", "alert"];

function isEmergencyCategory(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => n.includes(keyword));
}

function resolveUrgency(post: PostItem): UrgencyLevel {
  if (isEmergencyCategory(post.category?.name)) return "emergency";
  if (post.pinnedAt) return "featured";
  return "normal";
}

function TagPill({ post }: { post: PostItem }) {
  const name = post.category?.name;
  if (!name) return null;
  const urgency = resolveUrgency(post);
  return (
    <Link
      to="/posts"
      search={withCategoryFilter(name)}
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-bold whitespace-nowrap transition-opacity hover:opacity-80",
        urgency === "emergency" && isEmergencyCategory(name)
          ? "ueg-tag-emergency"
          : urgency === "featured"
            ? "ueg-tag-important"
            : "ueg-tag",
      )}
    >
      {name}
    </Link>
  );
}

/* ---------- shared section heading ---------- */

function SectionHeading({
  title,
  moreHref,
}: {
  title: string;
  moreHref: string;
}) {
  return (
    <div className="ueg-panel-heading">
      <h2 className="ueg-section-title">{title}</h2>
      <Link to={moreHref} className="ueg-more-link">
        {m.ueg_more()}
        <ArrowRight size={14} strokeWidth={2} />
      </Link>
    </div>
  );
}

/* ---------- feature business cards ---------- */

interface FeatureCardProps {
  kicker: string;
  title: string;
  sub: string;
  desc: string;
  cta: string;
  icon: "rocket" | "shield";
}

export function UegFeatureCard({
  kicker,
  title,
  sub,
  desc,
  cta,
  icon,
}: FeatureCardProps) {
  const Icon = icon === "rocket" ? Rocket : ShieldCheck;
  return (
    <article className="ueg-feature-card">
      <div className="ueg-feature-head">
        <span className="ueg-feature-kicker">{kicker}</span>
        <Icon size={30} strokeWidth={1.4} className="ueg-feature-icon" />
      </div>
      <h3 className="ueg-feature-title">{title}</h3>
      <p className="ueg-feature-sub">{sub}</p>
      <p className="ueg-feature-desc">{desc}</p>
      <Link to="/posts" className="ueg-feature-cta">
        {cta}
        <ArrowRight size={15} strokeWidth={2} />
      </Link>
    </article>
  );
}

/* ---------- latest notices (right rail list) ---------- */

export function UegNoticePanel({ posts }: { posts: Array<PostItem> }) {
  if (posts.length === 0) return null;
  return (
    <section className="ueg-panel">
      <SectionHeading title={m.ueg_section_notices()} moreHref="/posts" />
      <ul className="ueg-row-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              to="/post/$slug"
              params={{ slug: post.slug }}
              className="ueg-row ueg-row-notice"
            >
              <TagPill post={post} />
              <span className="ueg-row-title">{post.title}</span>
              <time
                dateTime={post.publishedAt?.toISOString()}
                className="ueg-row-date"
              >
                {formatUegPostDate(post.publishedAt)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- trending (right rail list with summary) ---------- */

export function UegPopularPanel({ posts }: { posts: Array<PostItem> }) {
  if (posts.length === 0) return null;
  return (
    <section className="ueg-panel">
      <SectionHeading title={m.ueg_section_popular()} moreHref="/posts" />
      <ul className="ueg-row-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              to="/post/$slug"
              params={{ slug: post.slug }}
              className="ueg-row ueg-row-popular"
            >
              <div className="ueg-row-line">
                <TagPill post={post} />
                <span className="ueg-row-title">{post.title}</span>
              </div>
              <div className="ueg-row-line">
                <span className="ueg-row-summary">
                  {post.summary ?? ""}
                </span>
                <time
                  dateTime={post.publishedAt?.toISOString()}
                  className="ueg-row-date"
                >
                  {formatUegPostDate(post.publishedAt)}
                </time>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- latest dynamics (4-column cards) ---------- */

export function UegDynamicsSection({ posts }: { posts: Array<PostItem> }) {
  if (posts.length === 0) return null;
  return (
    <section>
      <SectionHeading title={m.ueg_section_dynamics()} moreHref="/posts" />
      <div className="ueg-dynamics-grid">
        {posts.map((post) => (
          <article key={post.slug} className="ueg-dynamic-card">
            <Link
              to="/post/$slug"
              params={{ slug: post.slug }}
              className="ueg-dynamic-title"
            >
              {post.title}
            </Link>
            <p className="ueg-dynamic-summary">{post.summary ?? ""}</p>
            <div className="ueg-dynamic-foot">
              <TagPill post={post} />
              <time
                dateTime={post.publishedAt?.toISOString()}
                className="ueg-row-date"
              >
                {formatUegPostDate(post.publishedAt)}
              </time>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
