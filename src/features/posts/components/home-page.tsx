import { Link, useRouteContext } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { UegHero } from "@/components/layout/hero-carousel";
import {
  getPublicImageSrc,
  PUBLIC_IMAGE_WIDTH,
} from "@/features/media/utils/media.utils";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { formatUegPostDate } from "@/features/posts/utils/format-ueg-post-date";
import {
  heroImage,
  isEmergencyCategory,
  PORTAL_MEDIA,
  postImage,
} from "@/features/posts/utils/portal-media";
import { withCategoryFilter } from "@/features/posts/utils/post-public-search";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

export const POPULAR_POSTS_LIMIT = 3;

interface HomePageProps {
  posts: Array<PostItem>;
  popularPosts?: Array<PostItem>;
  page: number;
  totalPages: number;
}

type UrgencyLevel = "normal" | "featured" | "emergency";

function resolveUrgency(post: PostItem): UrgencyLevel {
  if (isEmergencyCategory(post.category?.name)) return "emergency";
  if (post.pinnedAt) return "featured";
  return "normal";
}

/* ---------- shared section heading ---------- */

function SectionHead({
  title,
  moreHref,
  icon,
}: {
  title: string;
  moreHref: string;
  icon?: string;
}) {
  return (
    <div className="section-head">
      <h2>
        {icon ? <span aria-hidden="true">{icon}</span> : null}
        {title}
      </h2>
      <Link to={moreHref} className="more">
        {m.ueg_more()}
      </Link>
    </div>
  );
}

/* ---------- feature cards ---------- */

function FeatureCard({
  kicker,
  title,
  sub,
  desc,
  cta,
  image,
}: {
  kicker: string;
  title: string;
  sub: string;
  desc: string;
  cta: string;
  image: string;
}) {
  return (
    <article
      className="feature-card"
      style={{ "--image": `url('${image}')` } as CSSProperties}
    >
      <div className="feature-content">
        <div className="feature-kicker">{kicker}</div>
        <h2 className="feature-title">{title}</h2>
        <div className="feature-sub">{sub}</div>
        <div className="feature-desc">{desc}</div>
      </div>
      <Link to="/posts" className="outline-btn">
        {cta} <span className="arrow">→</span>
      </Link>
    </article>
  );
}

/* ---------- trending rail ---------- */

function RecommendPanel({ posts }: { posts: Array<PostItem> }) {
  return (
    <aside className="recommend">
      <SectionHead title={m.ueg_section_popular()} moreHref="/posts" />
      <div className="recommend-list">
        {posts.map((post) => (
          <Link
            key={post.slug}
            to="/post/$slug"
            params={{ slug: post.slug }}
            className="rec"
          >
            <span
              className="rec-img"
              style={
                {
                  "--rec-image": `url('${postImage(post, PUBLIC_IMAGE_WIDTH.avatar)}')`,
                } as CSSProperties
              }
            />
            <span className="rec-body">
              <span className="rec-title">{post.title}</span>
              <span className="rec-meta-text">{post.summary ?? ""}</span>
            </span>
            <span className="rec-side">
              <span className="rec-tag">
                {post.category?.name ?? m.ueg_nav_news()}
              </span>
              <time
                className="rec-date"
                dateTime={post.publishedAt?.toISOString()}
              >
                {formatUegPostDate(post.publishedAt)}
              </time>
            </span>
          </Link>
        ))}
      </div>
    </aside>
  );
}

/* ---------- latest updates ---------- */

function NewsGrid({ posts }: { posts: Array<PostItem> }) {
  return (
    <section className="news">
      <SectionHead title={m.ueg_section_dynamics()} moreHref="/posts" icon="▦" />
      <div className="news-grid">
        {posts.map((post) => {
          const urgency = resolveUrgency(post);
          const category = post.category?.name;
          return (
            <article key={post.slug} className="news-card">
              <Link
                to="/post/$slug"
                params={{ slug: post.slug }}
                aria-label={post.title}
              >
                <span
                  className="news-image"
                  style={
                    {
                      "--news-image": `url('${postImage(post, PUBLIC_IMAGE_WIDTH.cover)}')`,
                    } as CSSProperties
                  }
                />
              </Link>
              <div className="news-body">
                <h3 className="news-title">
                  <Link to="/post/$slug" params={{ slug: post.slug }}>
                    {post.title}
                  </Link>
                </h3>
                <p className="news-desc">{post.summary ?? ""}</p>
                <div className="news-meta">
                  <span className="news-meta-cat">
                    <Link
                      to="/posts"
                      search={category ? withCategoryFilter(category) : undefined}
                    >
                      <span
                        className={cn(
                          "news-cat",
                          urgency === "emergency" && "alert",
                        )}
                      >
                        {category ?? m.ueg_nav_news()}
                      </span>
                    </Link>
                  </span>
                  <time
                    className="news-date"
                    dateTime={post.publishedAt?.toISOString()}
                  >
                    {formatUegPostDate(post.publishedAt)}
                  </time>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- page ---------- */

export function HomePage({ posts, popularPosts }: HomePageProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const fallbackImage = getPublicImageSrc(
    siteConfig.theme.fuwari.homeBg,
    PUBLIC_IMAGE_WIDTH.banner,
  );

  // Notices: pinned first, then newest.
  const noticePosts = [...posts]
    .sort((a, b) => Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt)))
    .slice(0, 5);
  const noticeSlugs = new Set(noticePosts.map((post) => post.slug));
  const pool = posts.filter((post) => !noticeSlugs.has(post.slug));
  const popular =
    popularPosts && popularPosts.length > 0
      ? popularPosts.slice(0, 4)
      : pool.slice(0, 4);
  const dynamics = pool.slice(0, 4);

  const heroImages = PORTAL_MEDIA.hero.map((_, index) => heroImage(index));
  const featureImages = PORTAL_MEDIA.feature.map((key) =>
    getPublicImageSrc(key, PUBLIC_IMAGE_WIDTH.cover),
  );

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <UegHero
        notices={noticePosts}
        images={heroImages}
        fallbackImage={fallbackImage}
      />

      <div className="feature-grid">
        <FeatureCard
          kicker={m.ueg_feature_kicker()}
          title={m.ueg_feature_navigator_title()}
          sub={m.ueg_feature_navigator_sub()}
          desc={m.ueg_feature_navigator_desc()}
          cta={m.ueg_feature_navigator_cta()}
          image={featureImages[0]}
        />
        <FeatureCard
          kicker={m.ueg_feature_kicker()}
          title={m.ueg_feature_underground_title()}
          sub={m.ueg_feature_underground_sub()}
          desc={m.ueg_feature_underground_desc()}
          cta={m.ueg_feature_underground_cta()}
          image={featureImages[1]}
        />
        <RecommendPanel posts={popular} />
      </div>

      <NewsGrid posts={dynamics} />
    </div>
  );
}
