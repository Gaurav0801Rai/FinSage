import { SidebarWrapper } from "@/components/layout/sidebar-wrapper";
import { MobileNav }      from "@/components/layout/mobile-nav";
import { PageTransition } from "@/components/layout/page-transition";
import { cookies }        from "next/headers";
import { adminAuth }      from "@/lib/firebase/admin";
import { redirect }       from "next/navigation";
import { ROUTES }         from "@/lib/constants";

async function verifySession() {
  try {
    const cookieStore   = cookies();
    const sessionCookie = cookieStore.get("pp_session")?.value;
    if (!sessionCookie) return false;
    await adminAuth.verifySessionCookie(sessionCookie, true);
    return true;
  } catch {
    return false;
  }
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const valid = await verifySession();
  if (!valid) redirect(ROUTES.login);

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <SidebarWrapper />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden">
          <MobileNav />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
      </div>
    </div>
  );
}