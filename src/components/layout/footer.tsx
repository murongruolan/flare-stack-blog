import { Link, useLoaderData, useRouteContext } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useState } from "react";
import type { NavOption } from "@/components/layout/layout-props";
import { approvedFriendLinksQuery } from "@/features/friend-links/queries";
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

/** 页脚友链：管理端友链数据，sortOrder 越小越靠左 */
function FooterFriendLinks() {
  const { data: links } = useSuspenseQuery(approvedFriendLinksQuery());
  return (
    <>
      {links.map((link) => (
        <a
          key={link.id}
          href={link.siteUrl}
          target="_blank"
          rel="noreferrer"
          title={link.siteName}
        >
          {link.siteName}
        </a>
      ))}
    </>
  );
}

export function Footer(_props: FooterProps) {
  const { currentYear } = useLoaderData({ from: "__root__" });
  const { siteConfig } = useRouteContext({ from: "__root__" });

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
          <Suspense fallback={null}>
            <FooterFriendLinks />
          </Suspense>
          <Link to="/friend-links" className="footer-links-more">
            {m.ueg_more()}
          </Link>
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
