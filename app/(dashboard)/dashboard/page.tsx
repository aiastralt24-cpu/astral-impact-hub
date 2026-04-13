import { ContentManagement } from "@/features/content/content-management";
import { MetricGrid } from "@/features/dashboard/metric-grid";
import { getDashboardData } from "@/lib/data/demo-store";
import { ProjectGrid } from "@/features/projects/project-grid";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const highlightedContentUpdates = data.updates.filter((update) => update.status === "approved" || update.status === "published");

  return (
    <div className="space-y-8">
      <section className="section-shell glass-panel rounded-[36px] p-6 sm:p-8">
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Overview</p>
            <h1 className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl">
              Today&apos;s working view.
            </h1>
            <p className="mt-4 max-w-xl text-[var(--gray-mid)]">
              Track updates, review what needs attention, and move publishing forward.
            </p>
          </div>
          <div className="grid min-w-full gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            {data.metrics.slice(0, 3).map((metric) => (
              <div key={metric.label} className="rounded-[28px] bg-white/76 p-4 ring-1 ring-[var(--border)] backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)]">{metric.label}</p>
                <p className="font-display mt-3 text-3xl font-black tracking-[-0.05em] text-[var(--foreground)]">{metric.value}</p>
                <p className="mt-2 text-sm text-[var(--gray-mid)]">{metric.trend}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <MetricGrid metrics={data.metrics} />
      <ProjectGrid projects={data.projects} />
      <ContentManagement updates={highlightedContentUpdates} generatedContent={data.generatedContent} />
    </div>
  );
}
