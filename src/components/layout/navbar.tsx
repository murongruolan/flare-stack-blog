import { Link, useLocation, useRouteContext } from "@tanstack/react-router";
import { Menu, UserIcon, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { NavOption, UserInfo } from "./layout-props";
import { MOTION, useMotionPresence } from "@/hooks/use-motion";
import { m } from "@/paraglide/messages";
import { UegEraClock } from "./ueg-era-clock";
import { PublicNavLink } from "./public-nav-link";
import { MobileMenu } from "./mobile-menu";
import "./navbar.css";

interface NavbarProps {
  navOptions: Array<NavOption>;
  isLoading?: boolean;
  user?: UserInfo;
  logout: () => Promise<void>;
  bannerHeightVh: number;
}

export function Navbar({
  user,
  navOptions,
  isLoading,
  logout,
  bannerHeightVh,
}: NavbarProps) {
  const { siteConfig } = useRouteContext({ from: "__root__" });
  const pathname = useLocation({ select: (location) => location.pathname });
  const [isHidden, setIsHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const present = useMotionPresence(open, MOTION.popover);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setOpen(false);
    setIsHidden(false);
  }, [pathname]);
  useEffect(() => {
    let previous = Math.max(0, window.scrollY);
    let travel = 0;
    const handleScroll = () => {
      const y = Math.max(0, window.scrollY);
      const delta = y - previous;
      previous = y;
      if (
        open ||
        (rootRef.current?.contains(document.activeElement) &&
          document.activeElement?.matches(":focus-visible")) ||
        rootRef.current?.querySelector('[aria-expanded="true"]')
      ) {
        travel = 0;
        setIsHidden(false);
        return;
      }
      const threshold = Math.max(
        72,
        (window.innerHeight * bannerHeightVh) / 100 - 144,
      );
      if (y < threshold) {
        travel = 0;
        setIsHidden(false);
        return;
      }
      if (Math.sign(delta) !== Math.sign(travel)) travel = 0;
      travel += delta;
      if (Math.abs(travel) >= 12) {
        setIsHidden(travel > 0);
        travel = 0;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [bannerHeightVh, open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector<HTMLElement>("a, button")
      ?.focus({ preventScroll: true });
    const pointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        !panelRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      )
        setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    const resize = () => setOpen(false);
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    window.addEventListener("resize", resize);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
      window.removeEventListener("resize", resize);
    };
  }, [open]);

  const toggle = (button: HTMLButtonElement, compact: boolean) => {
    triggerRef.current = button;
    setMobile(compact);
    setOpen((value) => !value);
    setIsHidden(false);
  };

  return (
    <div
      ref={rootRef}
      id="fuwari-navbar-wrapper"
      className="public-navbar-wrapper"
      data-hidden={isHidden && !open}
      onFocusCapture={() => setIsHidden(false)}
    >
      <div id="fuwari-navbar" className="public-navbar">
        <div className="public-navbar-inner">
          <Link
            to="/"
            className="ueg-brand"
            title={m.ueg_brand_full()}
            aria-label={m.ueg_brand_full()}
          >
            <span className="ueg-brand-logo">
              <img
                src={siteConfig.icons.faviconSvg || "/favicon.svg"}
                alt=""
              />
            </span>
            <span className="ueg-brand-name">
              <span className="brand-top">
                <span className="ueg">UEG</span>
                <span className="cn">联合政府</span>
              </span>
              <span className="en">UNITED EARTH GOVERNMENT</span>
            </span>
          </Link>

          <nav className="ueg-nav">
            {navOptions.map((option) => (
              <PublicNavLink
                key={option.id}
                option={option}
                className="ueg-nav-link"
                activeClassName="ueg-nav-link ueg-nav-active"
              />
            ))}
          </nav>

          <div className="ueg-tools">
            <UegEraClock className="ueg-era-clock" />
            <div className="public-desktop-tools">
              <button
                type="button"
                className="public-tool-button public-account-trigger"
                aria-label={user ? m.profile_title() : m.nav_login_register()}
                aria-expanded={open && !mobile}
                aria-controls="public-navigation-panel"
                onClick={(event) => toggle(event.currentTarget, false)}
              >
                {isLoading ? (
                  <Skeleton className="w-7 h-7 rounded-lg" />
                ) : user?.image ? (
                  <img src={user.image} alt="" />
                ) : (
                  <UserIcon size={18} strokeWidth={1.5} />
                )}
              </button>
            </div>
            <button
              type="button"
              className="public-tool-button public-mobile-trigger"
              aria-label={open && mobile ? m.common_close() : m.common_open_menu()}
              aria-expanded={open && mobile}
              aria-controls="public-navigation-panel"
              onClick={(event) => toggle(event.currentTarget, true)}
            >
              {open && mobile ? (
                <X size={20} strokeWidth={1.5} />
              ) : (
                <Menu size={20} strokeWidth={1.5} />
              )}
            </button>
          </div>

          {present && (
            <div
              ref={panelRef}
              id="public-navigation-panel"
              className="public-navigation-panel fuwari-popover-motion"
              data-state={open ? "open" : "closing"}
              inert={!open}
              aria-hidden={!open}
              onBlur={(event) => {
                if (
                  event.relatedTarget &&
                  !event.currentTarget.contains(event.relatedTarget as Node) &&
                  event.relatedTarget !== triggerRef.current
                )
                  setOpen(false);
              }}
            >
              <MobileMenu
                navOptions={navOptions}
                user={user}
                isLoading={isLoading}
                logout={logout}
                mobile={mobile}
                onClose={() => setOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
