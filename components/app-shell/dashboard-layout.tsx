import type { ReactNode } from "react";

import { Sidebar } from "@/components/app-shell/sidebar";
import type { AppUser } from "@/types/domain";

export function DashboardLayout({ children, session }: { children: ReactNode; session: AppUser }) {
  return (
    <div className="min-h-screen lg:flex">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 soft-grid opacity-[0.18]" />
        <div className="absolute left-[-10%] top-[10%] h-72 w-72 rounded-full bg-[rgba(109,116,255,0.08)] blur-3xl" />
        <div className="absolute bottom-[10%] right-[-4%] h-80 w-80 rounded-full bg-[rgba(182,190,255,0.12)] blur-3xl" />
      </div>
      <Sidebar session={session} />
      <main className="flex-1">
        <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
