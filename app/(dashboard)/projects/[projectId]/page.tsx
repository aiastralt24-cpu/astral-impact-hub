import { UpdateHistory } from "@/features/updates/update-history";
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
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="font-display text-[28px] font-semibold">{project.name}</h1><p className="mt-1 text-sm text-[var(--gray-mid)]">{project.location} · {project.status.replaceAll("_", " ")}</p></div><div className="flex gap-2"><Link href={`/updates?projectId=${project.id}`} className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"><FileText className="h-4 w-4" />Add update</Link><Link href={`/updates?projectId=${project.id}#photos-videos`} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold"><ImageIcon className="h-4 w-4" />Add media update</Link></div></div>
    <details className="rounded-xl border border-[var(--border)] bg-white px-5 py-3"><summary className="cursor-pointer text-sm font-medium">Project setup <span className="ml-2 font-normal text-[var(--gray-mid)]">{complete} of {checklist.length} complete</span></summary><div className="mt-4 grid gap-2 sm:grid-cols-2">{checklist.map((item) => <div key={item.label} className="flex items-center gap-2 text-sm">{item.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-400" />}<span>{item.label}</span></div>)}</div><div className="mt-4"><OpenProjectEditor /></div></details>
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,1fr)]">
    <div className="min-w-0 space-y-5">
    <ProjectManagement projects={[project]} vendors={data.vendors} managers={data.users.filter((user) => user.role === "admin" || user.role === "project_manager")} session={session} showCreate={false} />
    <UpdateHistory updates={updates} title="Project updates" showProject={false} />
    </div>
    <aside className="rounded-2xl border border-[var(--border)] bg-white p-5"><h2 className="text-base font-semibold">Project details</h2><dl className="mt-4 space-y-4 text-sm">{[
      ["Status", project.status.replaceAll("_", " ")],
      ["Managed by", project.vendorName || "Foundation team"],
      ["Project manager", data.users.find(user => user.id === project.internalOwnerId)?.fullName || "Not assigned"],
      ["Start date", project.startDate || "Not set"],
      ["End date", project.endDate || "Not set"],
      ["Updates", String(updates.length)]
    ].map(([label, value]) => <div key={label}><dt className="text-xs text-[var(--gray-mid)]">{label}</dt><dd className="mt-1 capitalize">{value}</dd></div>)}</dl></aside>
    </div>
  </div>;
}
