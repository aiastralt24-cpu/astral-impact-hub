import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, CheckCircle2, CircleAlert, MapPin } from "lucide-react";

import type { ProjectRecord } from "@/types/domain";

export function ProjectList({ projects, projectsWithUpdates = [] }: { projects: ProjectRecord[]; projectsWithUpdates?: string[] }) {
  if (projects.length === 0) return <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/70 p-10 text-center"><Building2 className="mx-auto h-8 w-8 text-[var(--gray-mid)]" /><p className="mt-4 font-semibold text-[var(--foreground)]">No projects available yet</p><p className="mt-1 text-sm text-[var(--gray-mid)]">Create a project to start tracking delivery and updates.</p></div>;
  return <section aria-labelledby="project-list-heading" className="space-y-4">
    <div className="flex items-center justify-between gap-4"><div><h2 id="project-list-heading" className="font-display text-2xl font-black tracking-[-0.03em]">All projects</h2><p className="mt-1 text-sm text-[var(--gray-mid)]">{projects.length} {projects.length === 1 ? "project" : "projects"} in your workspace</p></div></div>
    <div className="grid gap-4 xl:grid-cols-2">
    {projects.map((project) => {
      const hasUpdate = projectsWithUpdates.includes(project.id);
      const missingSetup = [
        !project.projectBrief && "project overview",
        !project.location && "location",
        !(project.startDate && project.endDate) && "project dates",
        !project.internalOwnerId && "project manager",
        !(project.vendorIds.length > 0 || project.vendorName === "Managed internally") && "CSR Associate",
        !hasUpdate && "first update"
      ].filter(Boolean) as string[];
      const healthTone = project.healthScore < 45 ? "rose" : project.healthScore < 70 ? "amber" : "emerald";
      const reportingLabel = !hasUpdate ? "First update needed" : project.healthScore < 45 ? "Reporting needs attention" : project.healthScore < 70 ? "Reporting follow-up" : "Reporting on track";
      const statusLabel = project.status.replaceAll("_", " ");
      return (
      <article key={project.id} className="group relative overflow-hidden rounded-[24px] border border-[var(--border)] bg-white shadow-[0_12px_32px_rgba(17,24,39,0.055)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-[0_18px_42px_rgba(17,24,39,0.09)]">
        <div className="absolute inset-y-0 left-0 w-1 bg-[linear-gradient(180deg,#0059ff,#77a7ff)]" />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--primary)]">{project.category || "Project"}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold capitalize tracking-[0.08em] text-slate-600">{statusLabel}</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${healthTone === "rose" ? "bg-rose-50 text-rose-700" : healthTone === "amber" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{healthTone === "emerald" ? <CheckCircle2 className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}{reportingLabel}</span>
          </div>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="min-w-0"><h3 className="font-display text-2xl font-black tracking-[-0.035em] text-[var(--foreground)]">{project.name}</h3><p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-[var(--gray-mid)]">{project.projectBrief || "Project overview has not been added yet."}</p></div>
            <Link href={`/projects/${project.id}`} aria-label={`Open ${project.name}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--primary)] shadow-sm transition group-hover:border-blue-200 group-hover:bg-blue-50"><ArrowUpRight className="h-4 w-4" /></Link>
          </div>
          <div className="mt-5 grid gap-2 text-sm text-[var(--gray-mid)] sm:grid-cols-3">
            <div className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><MapPin className="h-4 w-4 shrink-0" /><span className="truncate">{project.location || "Location not added"}</span></div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><Building2 className="h-4 w-4 shrink-0" /><span className="truncate">{project.vendorName || "Managed internally"}</span></div>
            <div className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5"><CalendarDays className="h-4 w-4 shrink-0" /><span className="truncate">{project.startDate && project.endDate ? `${project.startDate} – ${project.endDate}` : "Dates not added"}</span></div>
          </div>
          {missingSetup.length > 0 ? <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-4 text-xs text-amber-800"><CircleAlert className="h-4 w-4 shrink-0" /><span><span className="font-semibold">Setup incomplete:</span> Add {missingSetup[0]}{missingSetup.length > 1 ? ` and ${missingSetup.length - 1} more` : ""}.</span></div> : null}
        </div>
      </article>
    )})}
    </div>
  </section>;
}
