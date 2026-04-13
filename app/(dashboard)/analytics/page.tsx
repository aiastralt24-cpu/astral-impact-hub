import { AnalyticsOverview } from "@/features/analytics/analytics-overview";
import { getDashboardData } from "@/lib/data/demo-store";

export default async function AnalyticsPage() {
  const data = await getDashboardData();
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
