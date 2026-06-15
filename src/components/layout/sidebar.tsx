"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Wallet,
  Bell,
  Star,
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
  { href: ROUTES.portfolio, label: "Portfolio",  icon: Wallet },
  { href: ROUTES.alerts,    label: "Alerts",     icon: Bell },
  { href: ROUTES.watchlist, label: "Watchlist",  icon: Star },
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
      className="flex flex-col w-64 h-full
                 bg-[#0E131A] border-r border-[#64748B]/10 shrink-0"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-5">
        <Logo size="sm" />
      </div>

      {/* Navigation (aligned spacing to fit layout exactly) */}
      <nav className="flex-1 pl-3 pr-0 py-4 space-y-4 overflow-y-auto min-h-0">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active      = isActive(href);
          const showBadge   = label === "Alerts" && unreadAlertCount > 0;

          if (active) {
            return (
              <div 
                key={href}
                className="relative mr-0 pl-[1.5px] py-[1.5px] bg-gradient-to-r from-[#00E5FF] to-[#FFC837] rounded-l-full rounded-r-none shadow-[0_0_15px_rgba(0,229,255,0.15)] flex items-center"
              >
                <Link
                  href={href}
                  className="flex-1 flex items-center gap-3 pl-4 pr-3 py-2.5 bg-[#0E131A] text-white rounded-l-full rounded-r-none text-[13.5px] font-medium"
                >
                  <div className="relative flex items-center justify-center">
                    <Icon
                      className={cn(
                        "w-4.5 h-4.5 shrink-0",
                        label === "Watchlist"
                          ? "stroke-[#FFC837] fill-[#1A365D]"
                          : "text-[#FFC837]"
                      )}
                    />
                    {label === "Alerts" && (
                      <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] blur-[0.5px]" />
                    )}
                    {label === "AI Chatbot" && (
                      <span className="absolute inset-0 rounded-full bg-[#00E5FF]/20 blur-[3px] scale-150 animate-pulse" />
                    )}
                  </div>
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
              </div>
            );
          }

          // Inactive item
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl border border-transparent text-[#FFFFFF] hover:bg-white/[0.04] text-[13.5px] font-normal transition-all mr-3"
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "w-4.5 h-4.5 shrink-0",
                    label === "Watchlist"
                      ? "stroke-[#FFC837] fill-[#1A365D]"
                      : "text-[#FFC837]"
                  )}
                />
                {label === "Alerts" && (
                  <span className="absolute -top-0.5 -left-0.5 w-2.5 h-2.5 rounded-full bg-[#00E5FF] shadow-[0_0_8px_#00E5FF] blur-[0.5px]" />
                )}
              </div>
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

      {/* Bottom section matching the same styling rules */}
      <div className="pl-3 pr-0 py-4 space-y-2 border-t border-[#64748B]/10">
        <Link
          href={ROUTES.settings}
          className={cn(
            "flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl border border-transparent transition-all mr-3",
            isActive(ROUTES.settings)
              ? "text-white font-medium bg-white/[0.04]"
              : "text-[#FFFFFF] font-normal hover:bg-white/[0.04]"
          )}
        >
          <Settings className="w-4.5 h-4.5 shrink-0 text-[#FFC837]" />
          Settings
        </Link>

        {/* User profile row */}
        <div className="flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl mr-3">
          {user?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt=""
              className="w-7 h-7 rounded-full shrink-0 object-cover"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-full bg-[#1A365D]
                         border border-[#1F4E79]/50
                         flex items-center justify-center
                         text-xs font-semibold text-white shrink-0"
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
            className="text-white/30 hover:text-loss transition-colors p-0.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}