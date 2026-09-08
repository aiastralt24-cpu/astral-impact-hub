import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";

import type { ProjectRecord } from "@/types/domain";

export function ProjectList({ projects, projectsWithUpdates = [] }: { projects: ProjectRecord[]; projectsWithUpdates?: string[] }) {
  if (projects.length === 0) return <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--gray-mid)]">No projects available yet.</div>;
  return <div className="grid gap-4 lg:grid-cols-2">
    {projects.map((project) => {
      const completed = [project.projectBrief, project.location, project.startDate && project.endDate, project.internalOwnerId, project.vendorIds.length > 0 || project.vendorName === "Managed internally", projectsWithUpdates.includes(project.id)].filter(Boolean).length;
      const progress = Math.round((completed / 6) * 100);
      return (
      <Link key={project.id} href={`/projects/${project.id}`} className="group rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-[0_12px_30px_rgba(17,24,39,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(17,24,39,0.09)]">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="font-display text-xl font-black text-[var(--foreground)]">{project.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--gray-mid)]">{project.projectBrief || "Project overview not added"}</p></div>
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-[var(--primary)] transition group-hover:translate-x-1" />
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--gray-mid)]"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{project.location || "Location not added"}</span><span>{project.vendorName || "Managed internally"}</span></div>
        <div className="mt-4 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${progress}%` }} /></div><span className="text-xs font-medium text-[var(--gray-mid)]">{progress}% complete</span></div>
      </Link>
    )})}
  </div>;
}
