"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  Bell,
  Eye,
  Newspaper,
  Settings,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/contexts/auth-context";
import { signOut } from "@/lib/firebase/auth";
import { clearSession } from "@/app/actions/auth";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SidebarProps {
  unreadAlertCount?: number;
}

const NAV_ITEMS = [
  { href: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { href: ROUTES.portfolio, label: "Portfolio",  icon: Briefcase },
  { href: ROUTES.alerts,    label: "Alerts",     icon: Bell },
  { href: ROUTES.watchlist, label: "Watchlist",  icon: Eye },
  { href: ROUTES.news,      label: "News",       icon: Newspaper },
  { href: ROUTES.chatbot,   label: "AI Chatbot",  icon: MessageSquare },
];


export function Sidebar({ unreadAlertCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuth();

  async function handleSignOut() {
    await signOut();
    await clearSession();
    router.push(ROUTES.login);
    router.refresh();
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const initials =
    user?.displayName?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "?";

  return (
    <aside
      className="flex flex-col w-64 min-h-screen
                 bg-canvas-elevated border-r border-glass-border shrink-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-glass-border">
        <Logo size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active      = isActive(href);
          const showBadge   = label === "Alerts" && unreadAlertCount > 0;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                "text-sm font-medium transition-all",
                active
                  ? "bg-accent-500/10 text-accent-400 border border-accent-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0",
                  active ? "text-accent-400" : "text-current"
                )}
              />
              <span className="flex-1">{label}</span>

              {showBadge && (
                <span
                  className="inline-flex items-center justify-center
                             min-w-[20px] h-5 px-1.5 rounded-full
                             text-xs font-semibold font-mono
                             bg-loss text-white"
                >
                  {unreadAlertCount > 99 ? "99+" : unreadAlertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-glass-border space-y-0.5">
        <Link
          href={ROUTES.settings}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl",
            "text-sm font-medium transition-all",
            isActive(ROUTES.settings)
              ? "bg-accent-500/10 text-accent-400 border border-accent-500/20"
              : "text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
          )}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>

        {/* User row */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt=""
              className="w-7 h-7 rounded-full shrink-0 object-cover"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full bg-accent-500/20
                         border border-accent-500/30
                         flex items-center justify-center
                         text-xs font-semibold text-accent-400 shrink-0"
            >
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate
                          leading-none mb-0.5">
              {user?.displayName ?? "User"}
            </p>
            <p className="text-xs text-white/35 truncate leading-none">
              {user?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="text-white/30 hover:text-loss transition-colors p-0.5"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}