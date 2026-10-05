import { useLocation, useRouterState } from "@tanstack/react-router";
import type { PublicLayoutProps } from "@/components/layout/layout-props";
import { cn } from "@/lib/utils";
import { BackToTop } from "./back-to-top";
import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { PageFade } from "./page-fade";

export function PublicLayout({
  children,
  navOptions,
  user,
  isSessionLoading,
  logout,
}: PublicLayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isAuthPage = useRouterState({
    select: (state) =>
      state.matches.some((match) => match.routeId.includes("/_auth")),
  });
  const hasRouteError = useRouterState({
    select: (state) =>
      state.matches.some(
        (match) => match.status === "error" || match.status === "notFound",
      ),
  });
  const isFocusedPage =
    hasRouteError ||
    isAuthPage ||
    location.pathname === "/profile";
  // UEG 门户页的页头自带与导航栏的间距（移植自示例稿），
  // 布局层不再叠加 margin；其余博客风页面保留原有间距。
  const isUegPage = [
    "/posts",
    "/policy",
    "/organization",
    "/navigator",
    "/underground",
    "/about",
    "/post",
  ].some((prefix) => location.pathname.startsWith(prefix));

  return (
    <div className="ueg-home-page flex flex-col min-h-screen transition-colors">
      {/* Top bar: full-bleed background, content-width row inside */}
      <div className="sticky top-0 z-50">
        <Navbar
          navOptions={navOptions}
          logout={logout}
          user={user}
          isLoading={isSessionLoading}
          bannerHeightVh={0}
        />
      </div>

      {/* Main content */}
      <div
        className={cn(
          "relative flex-1 mx-auto pb-8 min-w-0",
          isHomePage || isFocusedPage || isUegPage ? "" : "mt-6 md:mt-10",
        )}
        style={{ width: "min(var(--fuwari-page-width), calc(100% - 48px))" }}
      >
        <main className="flex flex-col gap-4 min-w-0">
          <PageFade includeSearch={location.pathname !== "/search"}>
            {children}
          </PageFade>
        </main>

        <Footer navOptions={navOptions} />

        <BackToTop />
      </div>
    </div>
  );
}
