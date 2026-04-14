import type { DistributionLogRecord, MetricTile, ProjectRecord, UpdateRecord, VendorRecord } from "@/types/domain";

type AnalyticsOverviewProps = {
  metrics: MetricTile[];
  projects: ProjectRecord[];
  vendors: VendorRecord[];
  updates: UpdateRecord[];
  distributionLog: DistributionLogRecord[];
};

export function AnalyticsOverview({ metrics, projects, vendors, updates, distributionLog }: AnalyticsOverviewProps) {
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const averageVendorScore = Math.round(vendors.reduce((sum, vendor) => sum + vendor.score, 0) / Math.max(vendors.length, 1));
  const averageReadiness = Math.round(updates.reduce((sum, update) => sum + update.readinessScore, 0) / Math.max(updates.length, 1));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="glass-card rounded-[28px] p-5">
            <p className="text-sm text-[var(--gray-mid)]">{metric.label}</p>
            <p className="font-display mt-3 text-4xl font-black text-[var(--foreground)]">{metric.value}</p>
            <p className="mt-2 text-sm text-[var(--gray-mid)]">{metric.trend}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="glass-card rounded-[28px] p-6 xl:col-span-2">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Operational status</p>
          <div className="mt-4 space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="flex items-center justify-between rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <div>
                  <p className="font-medium text-[var(--foreground)]">{update.projectName}</p>
                  <p className="text-[var(--gray-mid)]">{update.vendorName}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-[var(--foreground)]">Readiness {update.readinessScore}</p>
                  <p className="text-[var(--gray-mid)]">{update.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-[28px] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Leadership summary</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-3xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)] text-[var(--foreground)]">Active projects: {activeProjects}</div>
            <div className="rounded-3xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)] text-[var(--foreground)]">Vendor avg score: {averageVendorScore}</div>
            <div className="rounded-3xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)] text-[var(--foreground)]">Average readiness: {averageReadiness}</div>
            <div className="rounded-3xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)] text-[var(--foreground)]">Channel deliveries: {distributionLog.length}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
