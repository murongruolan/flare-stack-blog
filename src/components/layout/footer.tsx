import { Link, useLoaderData, useRouteContext } from "@tanstack/react-router";
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
  const { siteConfig } = useRouteContext({ from: "__root__" });
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
            <img
              src={siteConfig.icons.favicon96 || "/favicon-96x96.png"}
              alt=""
            />
          </span>
          <span className="footer-brand-name">
            <span className="ueg">UEG</span>
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
