import { AlertTriangle, CheckCircle2, Clock3, Package2 } from "lucide-react";

import { ContentManagement } from "@/features/content/content-management";
import { getDashboardData } from "@/lib/data/demo-store";
import { requireSession } from "@/lib/auth/session";
import { ProjectGrid } from "@/features/projects/project-grid";

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session);
  const highlightedContentUpdates = data.updates.filter((update) => update.status === "approved" || update.status === "published");
  const pendingReviews = data.updates.filter((update) => update.status === "pending" || update.status === "in_review");
  const revisionRequests = data.updates.filter((update) => update.status === "revision_requested");
  const readyToPublish = data.generatedContent.length;
  const blockedProjects = data.projects.filter((project) => project.healthScore < 45);
  const atRiskProjects = data.projects.filter((project) => project.healthScore >= 45 && project.healthScore < 70);
  const publishedThisWeek = data.distributionLog.filter(
    (entry) => new Date(entry.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  const actionModules = [
    {
      title: "Needs review",
      value: `${pendingReviews.length}`,
      detail:
        pendingReviews.length > 0
          ? `${pendingReviews.length} update${pendingReviews.length === 1 ? "" : "s"} waiting for approval`
          : "Nothing waiting in the approval queue",
      tone: "warning" as const,
      icon: Clock3
    },
    {
      title: "Needs revision",
      value: `${revisionRequests.length}`,
      detail:
        revisionRequests.length > 0
          ? `${revisionRequests.length} vendor response${revisionRequests.length === 1 ? "" : "s"} needed`
          : "No revision loops open right now",
      tone: "neutral" as const,
      icon: AlertTriangle
    },
    {
      title: "Ready to publish",
      value: `${readyToPublish}`,
      detail:
        readyToPublish > 0
          ? `${readyToPublish} content package${readyToPublish === 1 ? "" : "s"} available`
          : "No approved content package yet",
      tone: "positive" as const,
      icon: Package2
    },
    {
      title: "Project health",
      value: blockedProjects.length > 0 ? `${blockedProjects.length} blocked` : atRiskProjects.length > 0 ? `${atRiskProjects.length} at risk` : "On track",
      detail:
        blockedProjects.length > 0
          ? "Immediate attention needed on low-health work"
          : atRiskProjects.length > 0
            ? "Watch the projects slipping behind"
            : publishedThisWeek.length > 0
              ? `${publishedThisWeek.length} delivery${publishedThisWeek.length === 1 ? "" : "ies"} completed this week`
              : "No critical risk visible across active projects",
      tone: blockedProjects.length > 0 ? "danger" as const : atRiskProjects.length > 0 ? "warning" as const : "positive" as const,
      icon: blockedProjects.length > 0 || atRiskProjects.length > 0 ? AlertTriangle : CheckCircle2
    }
  ];

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
              Track what needs action, what is blocked, and what is ready to move forward.
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actionModules.map((module) => {
          const Icon = module.icon;
          const toneClasses =
            module.tone === "danger"
              ? "bg-rose-50 text-rose-700 ring-rose-200"
              : module.tone === "warning"
                ? "bg-amber-50 text-amber-700 ring-amber-200"
                : "bg-emerald-50 text-emerald-700 ring-emerald-200";

          return (
            <div key={module.title} className="glass-card rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{module.title}</p>
                  <p className="font-display text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">{module.value}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${toneClasses}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-[var(--gray-mid)]">{module.detail}</p>
            </div>
          );
        })}
      </section>

      <ProjectGrid projects={data.projects} />
      <ContentManagement updates={highlightedContentUpdates} generatedContent={data.generatedContent} />
    </div>
  );
}
