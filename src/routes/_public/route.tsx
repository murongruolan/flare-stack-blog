import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicLayout as SitePublicLayout } from "@/components/layout/public-layout";
import { Toaster } from "@/components/layout/toaster";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { authClient } from "@/lib/auth/auth.client";
import { CACHE_CONTROL } from "@/lib/constants";
import { clientEnv } from "@/lib/env/client.env";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
  headers: () => {
    return CACHE_CONTROL.public;
  },
  head: () => {
    const env = clientEnv();
    return {
      scripts: env.VITE_UMAMI_WEBSITE_ID
        ? [
            {
              src: "/stats.js",
              defer: true,
              "data-website-id": env.VITE_UMAMI_WEBSITE_ID,
            },
          ]
        : [],
    };
  },
});

function PublicLayout() {
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const { logout } = useLogout();

  const navOptions = [
    { id: "home", label: m.ueg_nav_home(), href: "/", external: false },
    { id: "news", label: m.ueg_nav_news(), href: "/posts", external: false },
    {
      id: "policy",
      label: m.ueg_nav_policy(),
      href: "/policy",
      external: false,
    },
    { id: "org", label: m.ueg_nav_org(), href: "/organization", external: false },
    {
      id: "navigator",
      label: m.ueg_nav_navigator(),
      href: "/navigator",
      external: false,
    },
    {
      id: "underground",
      label: m.ueg_nav_underground(),
      href: "/underground",
      external: false,
    },
    { id: "about", label: m.ueg_nav_about(), href: "/about", external: false },
    {
      id: "engines",
      label: m.ueg_nav_engines(),
      href: "/engines",
      external: false,
    },
  ];

  // Global shortcut: Cmd/Ctrl + K to navigate to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isToggle) {
        e.preventDefault();
        navigate({ to: "/search" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <>
      <SitePublicLayout
        navOptions={navOptions}
        user={session?.user}
        isSessionLoading={isSessionPending}
        logout={logout}
      >
        <Outlet />
      </SitePublicLayout>
      <Toaster />
    </>
  );
}
