"use client";

import { useState }      from "react";
import Link              from "next/link";
import { usePathname, useRouter }  from "next/navigation";
import {
  Menu, X, LayoutDashboard, Wallet,
  Bell, Star, Newspaper, MessageSquare, Settings, LogOut,
} from "lucide-react";
import { Logo }          from "@/components/brand/logo";
import { useAuth }       from "@/contexts/auth-context";
import { signOut }       from "@/lib/firebase/auth";
import { clearSession }  from "@/app/actions/auth";
import { ROUTES }        from "@/lib/constants";
import { cn }            from "@/lib/utils";

const NAV_ITEMS = [
  { href: ROUTES.dashboard, label: "Dashboard",  icon: LayoutDashboard },
  { href: ROUTES.portfolio, label: "Portfolio",  icon: Wallet },
  { href: ROUTES.alerts,    label: "Alerts",     icon: Bell },
  { href: ROUTES.watchlist, label: "Watchlist",  icon: Star },
  { href: ROUTES.news,      label: "News",       icon: Newspaper },
  { href: ROUTES.chatbot,   label: "AI Chatbot", icon: MessageSquare },
  { href: ROUTES.settings,  label: "Settings",   icon: Settings },
];

export function MobileNav() {
  const [open, setOpen]   = useState(false);
  const pathname          = usePathname();
  const router            = useRouter();
  const { user }          = useAuth();

  async function handleSignOut() {
    await signOut();
    await clearSession();
    router.push(ROUTES.login);
  }

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between h-14 px-4
                      border-b border-glass-border bg-canvas-elevated">
        <Logo size="sm" />
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg glass-card text-white/60
                     hover:text-white transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          {/* Drawer */}
          <div
            className="absolute left-0 top-0 bottom-0 w-72
                       bg-canvas-elevated border-r border-glass-border
                       flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4
                            border-b border-glass-border">
              <Logo size="sm" />
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-white/50
                           hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-3 py-4 space-y-0.5">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href ||
                               pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "text-sm font-medium transition-all",
                      active
                        ? "bg-accent-500/10 text-accent-400 border border-accent-500/20"
                        : "text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
                    )}
                  >
                    <Icon className={cn(
                      "w-4 h-4 shrink-0",
                      active ? "text-accent-400" : "text-current"
                    )} />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* User row */}
            <div className="px-3 py-4 border-t border-glass-border">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-accent-500/20
                                border border-accent-500/30
                                flex items-center justify-center
                                text-xs font-semibold text-accent-400">
                  {user?.email?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">
                    {user?.displayName ?? "User"}
                  </p>
                  <p className="text-xs text-white/35 truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="text-white/30 hover:text-loss
                             transition-colors p-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}