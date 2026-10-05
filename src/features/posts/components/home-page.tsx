import { Link, useRouteContext } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import {
  getPublicImageSrc,
  PUBLIC_IMAGE_WIDTH,
} from "@/features/media/utils/media.utils";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import {
  heroImage,
  isEmergencyCategory,
  PORTAL_MEDIA,
  postImage,
} from "@/features/posts/utils/portal-media";
import { withCategoryFilter } from "@/features/posts/utils/post-public-search";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";

/**
 * 首页 V2（对比版）——按外部锐评重排：
 * - 16px 网格：所有间距 / 内边距取 16 的倍数（细步进用 8）
 * - Hero 与通告栏严格等高；文案压缩；轮播页码右下角加深色衬底
 * - 两张 Feature 卡完全同构：统一蒙版、统一行高、按钮固定右下
 * - 新闻区采用锐评方案 A：去掉热门推荐侧栏，四卡通栏，底部文字块定高对齐
 * - 日期改用世界观纪元（数据年份 +49 → 2075-xx-xx 横杠格式，仅显示层）
 * 对比结论出来后，保留赢家、删除输家即可，本文件不做长期维护。
 */

const ERA_YEAR_OFFSET = 49;

function formatEraDate(value: Date | string | number | null | undefined) {
  if (value == null) return "----/--/--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "----/--/--";
  const y = String(date.getUTCFullYear() + ERA_YEAR_OFFSET).padStart(4, "0");
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/* ---------- 通用小组件 ---------- */

function TagV2({ post }: { post: PostItem }) {
  const name = post.category?.name;
  if (!name) return null;
  const emergency = isEmergencyCategory(name);
  return (
    <Link
      to="/posts"
      search={withCategoryFilter(name)}
      className={cn("v2-tag", emergency && "v2-tag-emergency")}
    >
      {name}
    </Link>
  );
}

/* ---------- Hero V2：文案压缩 + 页码右下衬底 ---------- */

const V2_SLIDES = [
  {
    theme: "earth",
    title: () => m.ueg_slide_1_title(),
    sub: () => m.ueg_slide_1_sub(),
    en: () => m.ueg_slide_1_en(),
    desc: "一个星球，一个命运共同体。",
    cta: () => m.ueg_slide_1_cta(),
  },
  {
    theme: "engines",
    title: () => m.ueg_slide_2_title(),
    sub: () => m.ueg_slide_2_sub(),
    en: () => m.ueg_slide_2_en(),
    desc: "面向全球招募空间站建设与星际探索人才。",
    cta: () => m.ueg_slide_2_cta(),
  },
  {
    theme: "jupiter",
    title: () => m.ueg_slide_3_title(),
    sub: () => m.ueg_slide_3_sub(),
    en: () => m.ueg_slide_3_en(),
    desc: "提交信息，完成审核，获取居民认证。",
    cta: () => m.ueg_slide_3_cta(),
  },
];

const AUTOPLAY_MS = 8000;

function HeroV2({ images, fallbackImage }: {
  images: Array<string | undefined>;
  fallbackImage: string;
}) {
  const [active, setActive] = useState(0);
  const total = V2_SLIDES.length;

  const go = useCallback(
    (delta: number) => setActive((value) => (value + delta + total) % total),
    [total],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [go]);

  const slide = V2_SLIDES[active];

  return (
    <section className="v2-hero">
      <div className="v2-hero-media" aria-hidden="true">
        {V2_SLIDES.map((item, index) => (
          <div
            key={item.theme}
            className="v2-hero-slide"
            data-active={active === index}
          >
            <img
              src={images[index] ?? fallbackImage}
              alt=""
              loading={index === 0 ? "eager" : "lazy"}
              fetchPriority={index === 0 ? "high" : "auto"}
            />
          </div>
        ))}
        <div className="v2-hero-veil" />
      </div>

      <div className="v2-hero-copy">
        <p className="v2-hero-eyebrow">
          UNITED EARTH GOVERNMENT · CENTRAL INFORMATION PORTAL
        </p>
        <h1 className="v2-hero-title">
          {slide.title()}
          <span>{slide.sub()}</span>
        </h1>
        <p className="v2-hero-en">{slide.en()}</p>
        <p className="v2-hero-desc">{slide.desc}</p>
        <Link to="/posts" className="v2-hero-cta">
          {slide.cta()} <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="v2-hero-indicator">
        <button
          type="button"
          className="v2-hero-arrow"
          aria-label="上一张"
          onClick={() => go(-1)}
        >
          ←
        </button>
        <span className="v2-hero-counter">
          {String(active + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
        <button
          type="button"
          className="v2-hero-arrow"
          aria-label="下一张"
          onClick={() => go(1)}
        >
          →
        </button>
      </div>
    </section>
  );
}

/* ---------- 通告栏 V2：与 Hero 等高、行基线统一 ---------- */

function NoticePanelV2({ notices }: { notices: Array<PostItem> }) {
  return (
    <aside className="v2-announce" aria-label={m.ueg_section_notices()}>
      <div className="v2-panel-head">
        <h2>{m.ueg_section_notices()}</h2>
        <Link to="/posts" className="v2-more">
          {m.ueg_more()} <span aria-hidden="true">›</span>
        </Link>
      </div>
      <ul className="v2-notice-list">
        {notices.map((post) => (
          <li key={post.slug}>
            <Link
              to="/post/$slug"
              params={{ slug: post.slug }}
              className="v2-notice"
            >
              <span className="v2-notice-meta">
                <TagV2 post={post} />
                <time
                  className="v2-notice-date"
                  dateTime={post.publishedAt?.toISOString()}
                >
                  {formatEraDate(post.publishedAt)}
                </time>
              </span>
              <span className="v2-notice-title" title={post.title}>
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ---------- Feature 卡 V2：同构、按钮右下、蒙版统一 ---------- */

function FeatureCardV2({
  title,
  sub,
  desc,
  cta,
  image,
}: {
  title: string;
  sub: string;
  desc: string;
  cta: string;
  image: string;
}) {
  return (
    <article
      className="v2-feature"
      style={{ "--image": `url('${image}')` } as CSSProperties}
    >
      <div className="v2-feature-copy">
        <h2 className="v2-feature-title">{title}</h2>
        <p className="v2-feature-sub">{sub}</p>
        <p className="v2-feature-desc">{desc}</p>
      </div>
      <Link to="/posts" className="v2-feature-cta">
        {cta} <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

/* ---------- 新闻区 V2（方案 A）：四卡通栏、底部定高 ---------- */

function NewsCardV2({ post }: { post: PostItem }) {
  return (
    <article className="v2-news-card">
      <Link
        to="/post/$slug"
        params={{ slug: post.slug }}
        className="v2-news-image"
        style={
          {
            "--news-image": `url('${postImage(post, PUBLIC_IMAGE_WIDTH.cover)}')`,
          } as CSSProperties
        }
        aria-label={post.title}
      />
      <div className="v2-news-body">
        <h3 className="v2-news-title" title={post.title}>
          <Link to="/post/$slug" params={{ slug: post.slug }}>
            {post.title}
          </Link>
        </h3>
        <p className="v2-news-desc">{post.summary ?? ""}</p>
        <div className="v2-news-meta">
          <TagV2 post={post} />
          <time
            className="v2-news-date"
            dateTime={post.publishedAt?.toISOString()}
          >
            {formatEraDate(post.publishedAt)}
          </time>
        </div>
      </div>
    </article>
  );
}

/* ---------- 页面组装 ---------- */

export function HomePage({ posts }: { posts: Array<PostItem> }) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const fallbackImage = getPublicImageSrc(
    siteConfig.theme.fuwari.homeBg,
    PUBLIC_IMAGE_WIDTH.banner,
  );

  // 通告：置顶优先取 5 条；新闻：其余取前 4 条
  const noticePosts = [...posts]
    .sort((a, b) => Number(Boolean(b.pinnedAt)) - Number(Boolean(a.pinnedAt)))
    .slice(0, 5);
  const noticeSlugs = new Set(noticePosts.map((post) => post.slug));
  const dynamics = posts.filter((post) => !noticeSlugs.has(post.slug)).slice(0, 4);

  const heroImages = PORTAL_MEDIA.hero.map((_, index) => heroImage(index));
  const featureImages = PORTAL_MEDIA.feature.map((key) =>
    getPublicImageSrc(key, PUBLIC_IMAGE_WIDTH.cover),
  );

  return (
    <div className="ueg-homev2-page">
      <div className="v2-hero-row">
        <HeroV2 images={heroImages} fallbackImage={fallbackImage} />
        <NoticePanelV2 notices={noticePosts} />
      </div>

      <section className="v2-features">
        <FeatureCardV2
          title={m.ueg_feature_navigator_title()}
          sub={m.ueg_feature_navigator_sub()}
          desc={m.ueg_feature_navigator_desc()}
          cta={m.ueg_feature_navigator_cta()}
          image={featureImages[0]}
        />
        <FeatureCardV2
          title={m.ueg_feature_underground_title()}
          sub={m.ueg_feature_underground_sub()}
          desc={m.ueg_feature_underground_desc()}
          cta={m.ueg_feature_underground_cta()}
          image={featureImages[1]}
        />
      </section>

      <section className="v2-news">
        <div className="v2-section-head">
          <h2>
            <span aria-hidden="true">▦ </span>
            {m.ueg_section_dynamics()}
          </h2>
          <Link to="/posts" className="v2-more">
            {m.ueg_more()} <span aria-hidden="true">›</span>
          </Link>
        </div>
        <div className="v2-news-grid">
          {dynamics.map((post) => (
            <NewsCardV2 key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}

