import type { ReactNode } from "react";

import { DashboardLayout } from "@/components/app-shell/dashboard-layout";
import { requireSession } from "@/lib/auth/session";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await requireSession();
  return <DashboardLayout session={session}>{children}</DashboardLayout>;
}
