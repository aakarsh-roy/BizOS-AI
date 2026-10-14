"use client";

import { useAuth } from "@/hooks/use-auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { CommandPalette, useCommandPaletteShortcut } from "@/components/command-palette";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, company } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [navPath, setNavPath] = useState(pathname);
  useCommandPaletteShortcut(() => setPaletteOpen(true));

  // Close the mobile drawer on route change (state adjustment during render)
  if (navPath !== pathname) {
    setNavPath(pathname);
    setMobileNavOpen(false);
  }

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (!company && pathname !== "/onboarding") {
        router.push("/onboarding");
      }
    }
  }, [isAuthenticated, isLoading, company, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue to-primary animate-pulse" />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !company) {
    return null;
  }

  const isChatPage = pathname === "/chat" || pathname.startsWith("/chat/");

  return (
    <div className="flex h-screen overflow-hidden bg-background relative">
      <div className="bg-ambient" />
      <Sidebar />
      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden relative z-10">
        <TopNav
          onMenuClick={() => setMobileNavOpen(true)}
          onSearchClick={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className={isChatPage ? "h-full" : "p-8 max-w-[1600px] mx-auto min-h-full"}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
