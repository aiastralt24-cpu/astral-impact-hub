import { AlertTriangle, ClipboardCheck, FolderOpen, Send } from "lucide-react";
import Link from "next/link";

import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/demo-store";
import type { ProjectRecord } from "@/types/domain";

const statusLabels: Record<ProjectRecord["status"], string> = {
  active: "Active",
  at_risk: "Needs attention",
  draft: "Setup in progress",
  on_hold: "Paused",
  completed: "Completed",
  archived: "Archived"
};

function ProjectTable({ projects, emptyMessage }: { projects: ProjectRecord[]; emptyMessage: string }) {
  if (projects.length === 0) {
    return <p className="px-5 py-8 text-sm text-[var(--gray-mid)]">{emptyMessage}</p>;
  }

  return (
    <div className="divide-y divide-[var(--border)]">
      {projects.map((project) => (
        <div key={project.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto] sm:items-center">
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--foreground)]">{project.name}</p>
            <p className="mt-1 text-sm text-[var(--gray-mid)]">{project.location || "Location not added"}</p>
          </div>
          <div className="min-w-0 text-sm">
            <p className="text-xs text-[var(--gray-mid)] sm:hidden">CSR Associate</p>
            <p className="truncate text-[var(--foreground)]">{project.vendorName || "CSR Associate not assigned"}</p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <span className={`text-sm font-medium ${project.healthScore < 45 || project.status === "at_risk" ? "text-rose-700" : "text-emerald-700"}`}>
              {project.healthScore < 45 ? "Needs an update" : statusLabels[project.status]}
            </span>
            <Link href="/projects" aria-label={`View ${project.name}`} className="shrink-0 text-sm font-semibold text-[var(--primary)] hover:underline">View</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session);
  const updatesToReview = data.updates.filter((update) => ["pending", "in_review", "revision_requested"].includes(update.status)).length;
  const projectsNeedingAttention = data.projects.filter((project) => project.healthScore < 45 || project.status === "at_risk");
  const otherProjects = data.projects.filter((project) => project.healthScore >= 45 && project.status !== "at_risk");

  const summary = [
    { label: "Projects", value: data.projects.length, icon: FolderOpen, tone: "blue" },
    { label: "Updates to review", value: updatesToReview, icon: ClipboardCheck, tone: "amber" },
    { label: "Content ready to share", value: data.generatedContent.length, icon: Send, tone: "green" },
    { label: "Projects needing attention", value: projectsNeedingAttention.length, icon: AlertTriangle, tone: "rose" }
  ] as const;

  return (
    <div className="space-y-7">
      <header className="pl-16 lg:pl-0">
        <h1 className="font-display text-3xl font-black tracking-[-0.04em] text-[var(--foreground)]">Dashboard</h1>
        <p className="mt-2 text-[var(--gray-mid)]">Here&apos;s what needs your attention today.</p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Dashboard summary">
        {summary.map((item) => {
          const Icon = item.icon;
          const iconTone = {
            blue: "bg-blue-50 text-blue-700",
            amber: "bg-amber-50 text-amber-700",
            green: "bg-emerald-50 text-emerald-700",
            rose: "bg-rose-50 text-rose-700"
          }[item.tone];
          return (
            <div key={item.label} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-white px-5 py-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconTone}`}><Icon className="h-5 w-5" /></div>
              <div>
                <p className="text-sm text-[var(--gray-mid)]">{item.label}</p>
                <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{item.value}</p>
              </div>
            </div>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Projects needing attention</h2>
          <p className="mt-1 text-sm text-[var(--gray-mid)]">Projects that need a new update or team follow-up.</p>
        </div>
        <ProjectTable projects={projectsNeedingAttention} emptyMessage="No projects need attention right now." />
      </section>

      {otherProjects.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-5 py-4">
            <h2 className="font-display text-lg font-bold text-[var(--foreground)]">All other projects</h2>
          </div>
          <ProjectTable projects={otherProjects} emptyMessage="No other projects to show." />
        </section>
      ) : null}
    </div>
  );
}
