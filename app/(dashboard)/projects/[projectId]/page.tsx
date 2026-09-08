import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectManagement } from "@/features/projects/project-management";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/demo-store";
import { CheckCircle2, Circle, FileText, ImageIcon } from "lucide-react";
import { OpenProjectEditor } from "@/features/projects/open-project-editor";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await requireSession();
  const { projectId } = await params;
  const data = await getDashboardData(session);
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) notFound();
  const updates = data.updates.filter((item) => item.projectId === projectId);
  const checklist = [
    { label: "Project overview", done: Boolean(project.projectBrief) },
    { label: "Location", done: Boolean(project.location) },
    { label: "Project dates", done: Boolean(project.startDate && project.endDate) },
    { label: "Project manager", done: Boolean(project.internalOwnerId) },
    { label: "CSR Associate or managed internally", done: Boolean(project.vendorIds.length > 0 || project.vendorName === "Managed internally") },
    { label: "First project update", done: updates.length > 0 }
  ];
  const complete = checklist.filter((item) => item.done).length;
  return <div className="space-y-5">
    <Link href="/projects" className="text-sm font-semibold text-[var(--primary)]">← Back to projects</Link>
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-3xl font-black">Project details</h1><p className="mt-1 text-sm text-[var(--gray-mid)]">See what is complete and what the team should do next.</p></div><div className="flex gap-2"><Link href={`/updates?projectId=${project.id}`} className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"><FileText className="h-4 w-4" />Add update</Link><Link href="/media" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold"><ImageIcon className="h-4 w-4" />Add media</Link></div></div>
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5"><div className="flex items-center justify-between gap-4"><div><h2 className="font-display text-lg font-bold">Project setup</h2><p className="mt-1 text-sm text-[var(--gray-mid)]">{complete} of {checklist.length} essentials complete</p></div><OpenProjectEditor /></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{checklist.map((item) => <div key={item.label} className="flex items-center gap-2 text-sm">{item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}<span className={item.done ? "text-[var(--foreground)]" : "text-[var(--gray-mid)]"}>{item.label}</span></div>)}</div></section>
    <ProjectManagement projects={[project]} vendors={data.vendors} managers={data.users.filter((user) => user.role === "admin" || user.role === "project_manager")} session={session} showCreate={false} />
    <section className="rounded-2xl border border-[var(--border)] bg-white p-5"><h2 className="font-display text-xl font-bold">Recent updates</h2>{updates.length ? <div className="mt-3 space-y-3">{updates.slice(0,5).map((update)=><div key={update.id} className="rounded-xl bg-[#f8f9fc] p-4"><p className="text-sm font-medium">{update.description}</p><p className="mt-1 text-xs text-[var(--gray-mid)]">{update.happenedAt} · {update.media.length} media files</p></div>)}</div>:<div className="mt-3 rounded-xl bg-[#f8f9fc] p-4"><p className="text-sm text-[var(--gray-mid)]">No updates yet. Add the first update so the team can track progress.</p></div>}</section>
  </div>;
}
