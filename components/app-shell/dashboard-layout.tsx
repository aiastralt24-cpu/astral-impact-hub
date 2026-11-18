import type { ReactNode } from "react";

import { Sidebar } from "@/components/app-shell/sidebar";
import type { AppUser } from "@/types/domain";

export function DashboardLayout({ children, session }: { children: ReactNode; session: AppUser }) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar session={session} />
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1480px] px-4 pt-20 pb-8 sm:px-6 lg:px-8 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
