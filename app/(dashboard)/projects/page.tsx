import { getDashboardData } from "@/lib/data/demo-store";
import { ProjectList } from "@/features/projects/project-list";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BriefcaseBusiness, Building2, CircleAlert, Plus } from "lucide-react";

export default async function ProjectsPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/projects")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  const activeProjects = data.projects.filter((project) => project.status === "active").length;
  const needsAttention = data.projects.filter((project) => project.healthScore < 70).length;
  const partnerCount = new Set(data.projects.flatMap((project) => project.vendorIds)).size;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 pl-16 lg:pl-0">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Project workspace</p>
          <h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em] sm:text-5xl">Projects</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--gray-mid)]">Track delivery, reporting readiness, and the CSR Associate responsible for each project.</p>
        </div>
        {session.role !== "vendor" ? (
          <div className="flex flex-wrap gap-2"><Link href="/vendors/new" className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] shadow-sm transition hover:border-blue-200 hover:text-[var(--primary)]"><Building2 className="h-4 w-4" />Add CSR Associate</Link><Link href="/projects/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(0,89,255,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,89,255,0.28)]"><Plus className="h-4 w-4" />New project</Link></div>
        ) : null}
      </div>
      <section aria-label="Project summary" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[var(--primary)]"><BriefcaseBusiness className="h-5 w-5" /></span><div><p className="text-xs font-medium text-[var(--gray-mid)]">Active projects</p><p className="mt-0.5 font-display text-2xl font-black">{activeProjects}</p></div></div></div>
        <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Building2 className="h-5 w-5" /></span><div><p className="text-xs font-medium text-[var(--gray-mid)]">CSR Associates</p><p className="mt-0.5 font-display text-2xl font-black">{partnerCount}</p></div></div></div>
        <div className="rounded-[20px] border border-[var(--border)] bg-white/80 p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]"><div className="flex items-center gap-3"><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${needsAttention ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}><CircleAlert className="h-5 w-5" /></span><div><p className="text-xs font-medium text-[var(--gray-mid)]">Needs attention</p><p className="mt-0.5 font-display text-2xl font-black">{needsAttention}</p></div></div></div>
      </section>
      <ProjectList projects={data.projects} projectsWithUpdates={[...new Set(data.updates.map((update) => update.projectId))]} />
    </div>
  );
}
