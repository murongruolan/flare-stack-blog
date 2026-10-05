import { useLoaderData, useRouteContext } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import type { NavOption } from "@/components/layout/layout-props";
import { approvedFriendLinksQuery } from "@/features/friend-links/queries";
import { m } from "@/paraglide/messages";

export interface FooterProps {
  navOptions: Array<NavOption>;
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

        </div>

        <p className="footer-motto">{m.ueg_footer_slogan()}</p>
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
