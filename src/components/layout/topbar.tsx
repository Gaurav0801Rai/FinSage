"use client";

import Link            from "next/link";
import { usePathname } from "next/navigation";
import { Bell }        from "lucide-react";
import { ROUTES, APP_NAME }      from "@/lib/constants";

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.dashboard]: "Dashboard",
  [ROUTES.portfolio]: "Portfolio",
  [ROUTES.upload]:    "Upload Holdings",
  [ROUTES.news]:      "News",
  [ROUTES.alerts]:    "Alerts",
  [ROUTES.watchlist]: "Watchlist",
  [ROUTES.settings]:  "Settings",
};

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  for (const [route, title] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(route + "/")) return title;
  }
  return APP_NAME;
}

export function Topbar() {
  const pathname = usePathname();
  const title    = getTitle(pathname);

  return (
    <header
      className="h-16 flex items-center justify-between px-6
                 border-b border-glass-border bg-canvas/60
                 backdrop-blur-sm shrink-0"
    >
      <h1 className="text-base font-semibold tracking-tight">
        {title}
      </h1>

      <div className="flex items-center gap-1">
        <Link
          href={ROUTES.alerts}
          className="relative p-2 rounded-xl text-white/40
                     hover:text-white hover:bg-white/[0.04]
                     transition-all"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-2 right-2 w-1.5 h-1.5
                       bg-loss rounded-full"
          />
        </Link>
      </div>
    </header>
  );
}