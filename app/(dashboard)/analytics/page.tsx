import { AnalyticsOverview } from "@/features/analytics/analytics-overview";
import { getDashboardData } from "@/lib/data/demo-store";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function AnalyticsPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/analytics")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Analytics</h1>
      <AnalyticsOverview
        metrics={data.metrics}
        projects={data.projects}
        vendors={data.vendors}
        updates={data.updates}
        distributionLog={data.distributionLog}
      />
    </div>
  );
}
