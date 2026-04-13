import type { DistributionLogRecord, MetricTile, ProjectRecord, UpdateRecord, VendorRecord } from "@/types/domain";

type AnalyticsOverviewProps = {
  metrics: MetricTile[];
  projects: ProjectRecord[];
  vendors: VendorRecord[];
  updates: UpdateRecord[];
  distributionLog: DistributionLogRecord[];
};

export function AnalyticsOverview({ metrics, projects, vendors, updates, distributionLog }: AnalyticsOverviewProps) {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="text-sm text-[var(--gray-mid)]">{metric.label}</p>
            <p className="font-display mt-3 text-4xl font-black">{metric.value}</p>
            <p className="mt-2 text-sm text-[var(--gray-mid)]">{metric.trend}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm xl:col-span-2">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Operational status</p>
          <div className="mt-4 space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="flex items-center justify-between rounded-3xl bg-[var(--primary-light)] p-4 text-sm">
                <div>
                  <p className="font-medium">{update.projectName}</p>
                  <p className="text-[var(--gray-mid)]">{update.vendorName}</p>
                </div>
                <div className="text-right">
                  <p>Readiness {update.readinessScore}</p>
                  <p className="text-[var(--gray-mid)]">{update.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Leadership summary</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="rounded-3xl bg-[var(--primary-light)] p-4">Active projects: {projects.filter((project) => project.status === "active").length}</div>
            <div className="rounded-3xl bg-[var(--primary-light)] p-4">Vendor avg score: {Math.round(vendors.reduce((sum, vendor) => sum + vendor.score, 0) / Math.max(vendors.length, 1))}</div>
            <div className="rounded-3xl bg-[var(--primary-light)] p-4">Channel deliveries: {distributionLog.length}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
