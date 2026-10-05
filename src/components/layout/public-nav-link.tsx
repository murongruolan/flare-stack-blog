import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import type { NavOption } from "@/components/layout/layout-props";

const STATIC_HREF = {
  "/": "/",
  "/posts": "/posts",
  "/policy": "/policy",
  "/about": "/about",
  "/organization": "/organization",
  "/navigator": "/navigator",
  "/underground": "/underground",
  "/engines": "/engines",
} as const;

/**
 * English sublabel shown under each primary navigation item, keyed by the
 * nav option id configured for the public portal.
 */
const NAV_ENGLISH: Record<string, string> = {
  home: "HOME",
  news: "NEWS",
  policy: "POLICY",
  org: "ORGANIZATION",
  navigator: "NAVIGATOR",
  underground: "UNDERGROUND",
  about: "ABOUT",
  engines: "ENGINES",
};

export function navEnglishLabel(id: string): string | undefined {
  return NAV_ENGLISH[id];
}

function postSlugFromHref(href: string): string | null {
  const [path] = href.split(/[?#]/);
  const match = /^\/post\/([^/]+)\/?$/.exec(path ?? "");
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

export function PublicNavLink({
  option,
  className,
  activeClassName,
  onClick,
}: {
  option: NavOption;
  className?: string;
  activeClassName?: string;
  onClick?: () => void;
}) {
  const en = NAV_ENGLISH[option.id];

  const label = (
    <>
      <span className="ueg-nav-cn truncate">{option.label}</span>
      {en ? <span className="ueg-nav-en">{en}</span> : null}
      {option.external ? (
        <ExternalLink
          size={14}
          strokeWidth={1.75}
          className="ml-1 shrink-0 opacity-70"
        />
      ) : null}
    </>
  );

  if (option.external) {
    return (
      <a
        href={option.href}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onClick}
      >
        {label}
      </a>
    );
  }

  const slug = postSlugFromHref(option.href);
  if (slug) {
    return (
      <Link
        to="/post/$slug"
        params={{ slug }}
        className={className}
        activeProps={
          activeClassName ? { className: activeClassName } : undefined
        }
        onClick={onClick}
      >
        {label}
      </Link>
    );
  }

  const staticTo = STATIC_HREF[option.href as keyof typeof STATIC_HREF];
  if (staticTo) {
    return (
      <Link
        to={staticTo}
        className={className}
        activeProps={
          activeClassName ? { className: activeClassName } : undefined
        }
        onClick={onClick}
      >
        {label}
      </Link>
    );
  }

  return (
    <a href={option.href} className={className} onClick={onClick}>
      {label}
    </a>
  );
}
