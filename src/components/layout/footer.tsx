import { Link, useLoaderData } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { NavOption } from "@/components/layout/layout-props";
import { m } from "@/paraglide/messages";

export interface FooterProps {
  navOptions: Array<NavOption>;
}

function formatClock(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}.${p(date.getMonth() + 1)}.${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}`;
}

function UegClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <time className="footer-clock" suppressHydrationWarning>
      {now ? formatClock(now) : "····.··.·· ··:··:··"}
    </time>
  );
}

export function Footer(_props: FooterProps) {
  const { currentYear } = useLoaderData({ from: "__root__" });
  const affiliateLinks = [
    { label: m.ueg_footer_link_1(), href: "/friend-links" },
    { label: m.ueg_footer_link_2(), href: "/friend-links" },
    { label: m.ueg_footer_link_3(), href: "/friend-links" },
    { label: m.ueg_footer_link_4(), href: "/friend-links" },
  ];

  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <span className="footer-logo">
            <svg viewBox="0 0 100 100" aria-hidden="true">
              <circle
                cx="50"
                cy="50"
                r="44"
                fill="none"
                stroke="#dce5e4"
                strokeWidth="2"
              />
              <circle
                cx="50"
                cy="50"
                r="39"
                fill="none"
                stroke="#7897a4"
                strokeWidth="1"
              />
              <path
                d="M28 56c13 11 31 14 46 1M27 43c15-10 32-11 46-1M31 35c13-7 27-6 38 0M32 65c12 7 24 8 36 2"
                fill="none"
                stroke="#b6cbd0"
                strokeWidth="2"
              />
              <path d="M50 22v56M22 50h56" stroke="#7897a4" strokeWidth="1" />
              <path
                d="M38 44l12-9 12 9-4 16-8 6-8-6z"
                fill="none"
                stroke="#e2e0d6"
                strokeWidth="1.6"
              />
              <circle cx="50" cy="49" r="3" fill="#c18a55" />
            </svg>
          </span>
          <span className="footer-brand-name">
            <span className="ueg">UEG</span>
            <span className="en">UNITED EARTH GOVERNMENT</span>
            <span className="cn">联合地球政府</span>
          </span>
        </div>

        <div className="footer-links">
          {affiliateLinks.map((link) => (
            <Link key={link.label} to="/friend-links">
              {link.label}
            </Link>
          ))}
        </div>

        <p className="footer-motto">{m.ueg_footer_slogan()}</p>

        <div className="footer-status">
          {m.ueg_footer_sys()}
          <span className="ok">● {m.ueg_footer_sys_ok()}</span>
          <UegClock />
        </div>
      </div>

      <div className="footer-bottom">
        <span>
          © {currentYear} {m.ueg_footer_copyright()}
        </span>
        <div className="footer-legal">
          <a href="#">{m.ueg_footer_privacy()}</a>
          <span>|</span>
          <a href="#">{m.ueg_footer_terms()}</a>
          <span>|</span>
          <a href="#">{m.ueg_footer_contact()}</a>
        </div>
      </div>
    </footer>
  );
}
