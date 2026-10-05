import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import type { PostItem } from "@/features/posts/schema/posts.schema";
import { formatUegPostDate } from "@/features/posts/utils/format-ueg-post-date";
import { cn } from "@/lib/utils";
import { m } from "@/paraglide/messages";
import "./hero-carousel.css";

const AUTOPLAY_MS = 8000;

type Slide = {
  theme: string;
  kicker: () => string;
  title: () => string;
  sub: () => string;
  en: () => string;
  desc: () => string;
  cta: () => string;
};

const SLIDES: Array<Slide> = [
  {
    theme: "earth",
    kicker: () => m.ueg_slide_1_kicker(),
    title: () => m.ueg_slide_1_title(),
    sub: () => m.ueg_slide_1_sub(),
    en: () => m.ueg_slide_1_en(),
    desc: () => m.ueg_slide_1_desc(),
    cta: () => m.ueg_slide_1_cta(),
  },
  {
    theme: "engines",
    kicker: () => m.ueg_slide_2_kicker(),
    title: () => m.ueg_slide_2_title(),
    sub: () => m.ueg_slide_2_sub(),
    en: () => m.ueg_slide_2_en(),
    desc: () => m.ueg_slide_2_desc(),
    cta: () => m.ueg_slide_2_cta(),
  },
  {
    theme: "jupiter",
    kicker: () => m.ueg_slide_3_kicker(),
    title: () => m.ueg_slide_3_title(),
    sub: () => m.ueg_slide_3_sub(),
    en: () => m.ueg_slide_3_en(),
    desc: () => m.ueg_slide_3_desc(),
    cta: () => m.ueg_slide_3_cta(),
  },
];

const EMERGENCY_KEYWORDS = ["紧急", "emergency", "urgent", "alert"];

function isEmergencyCategory(name?: string | null): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => n.includes(keyword));
}

/**
 * UEG portal hero: a rotating backdrop with the official statement on the
 * left and the notice rail on the right.
 *
 * `images` supplies one background per slide; callers pass real media URLs
 * and fall back to the configured banner when a post has no cover.
 */
export function UegHero({
  notices,
  images,
  fallbackImage,
}: {
  notices: Array<PostItem>;
  images: Array<string | undefined>;
  fallbackImage: string;
}) {
  const [active, setActive] = useState(0);
  const total = SLIDES.length;

  const go = useCallback(
    (delta: number) => setActive((value) => (value + delta + total) % total),
    [total],
  );

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [go]);

  const slide = SLIDES[active];

  return (
    <section className="hero tech-cut">
      <div className="hero-media" aria-hidden="true">
        {SLIDES.map((item, index) => (
          <div
            key={item.theme}
            className="hero-slide"
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
        <div className="hero-veil" />
        <div className="hero-grid" />
      </div>

      <div className="hero-copy">
        <p className="eyebrow">
          UNITED EARTH GOVERNMENT · CENTRAL INFORMATION PORTAL
        </p>
        <h1 className="hero-title">
          {slide.title()}
          <span>{slide.sub()}</span>
        </h1>
        <p className="hero-sub">{slide.kicker()}</p>
        <p className="hero-tagline">{slide.en()}</p>
        <p className="hero-desc">{slide.desc()}</p>
        <Link to="/posts" className="hero-cta">
          {slide.cta()} <span className="arr">→</span>
        </Link>

        <div className="hero-indicator">
          <button
            type="button"
            className="hero-arrow"
            aria-label="Previous slide"
            onClick={() => go(-1)}
          >
            ←
          </button>
          <span className="hero-counter">
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="hero-arrow"
            aria-label="Next slide"
            onClick={() => go(1)}
          >
            →
          </button>
        </div>
      </div>

      <aside className="announce" aria-label={m.ueg_section_notices()}>
        <div className="section-head">
          <h2>{m.ueg_section_notices()}</h2>
          <Link to="/posts" className="more">
            {m.ueg_more()}
          </Link>
        </div>
        <div className="announce-list">
          {notices.map((post) => (
            <Link
              key={post.slug}
              to="/post/$slug"
              params={{ slug: post.slug }}
              className="notice"
            >
              <span
                className={cn(
                  "badge",
                  (isEmergencyCategory(post.category?.name) || post.pinnedAt) &&
                    "important",
                )}
              >
                {post.category?.name ?? m.ueg_nav_news()}
              </span>
              <span className="notice-title">{post.title}</span>
              <span className="notice-date">
                {formatUegPostDate(post.publishedAt)}
              </span>
            </Link>
          ))}
        </div>
      </aside>
    </section>
  );
}
