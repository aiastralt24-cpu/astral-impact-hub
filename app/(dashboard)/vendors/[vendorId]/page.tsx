import Link from "next/link";
import { notFound } from "next/navigation";
import { VendorManagement } from "@/features/vendors/vendor-management";
import { assignProjectToVendorAction } from "@/features/projects/actions";
import { requireSession } from "@/lib/auth/session";
import { getCurrentData, getDashboardData } from "@/lib/data/demo-store";

export default async function VendorDetailsPage({ params, searchParams }: { params: Promise<{ vendorId: string }>; searchParams: Promise<{ credentials?: string; error?: string; project?: string }> }) {
  const session = await requireSession();
  const { vendorId } = await params;
  const [data, allData, query] = await Promise.all([getDashboardData(session), getCurrentData(), searchParams]);
  const vendor = data.vendors.find((item) => item.id === vendorId);
  if (!vendor) notFound();
  const linkedUser = allData.users.find((user) => user.role === "vendor" && user.assignedVendorIds.includes(vendor.id));
  const canSeeCredentials = Boolean(linkedUser && (session.isSuperAdmin || session.role === "admin" || linkedUser.managedByUserId === session.id));
  const assignableProjects = data.projects.filter((project) => !project.vendorIds.includes(vendor.id));
  return <div className="space-y-5">
    <Link href="/vendors" className="text-sm font-semibold text-[var(--primary)]">← Back to CSR Associates</Link>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-3xl font-black">CSR Associate details</h1><p className="mt-1 text-sm text-[var(--gray-mid)]">View contact information, project coverage, login details, and project assignments.</p></div>{session.role !== "vendor" ? <Link href={`/projects/new?vendorId=${vendor.id}`} className="rounded-full bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white">Create project for this associate</Link> : null}</div>
    {query.credentials === "updated" ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Login details updated.</p> : null}
    {query.error === "username-exists" ? <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">That user ID already exists. Choose another one.</p> : null}
    {query.project === "assigned" ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">Project assigned successfully.</p> : null}
    <VendorManagement vendors={[vendor]} session={session} showSummary={false} showCreate={false} linkedUser={canSeeCredentials ? linkedUser : undefined} />
    {session.role !== "vendor" && assignableProjects.length > 0 ? <form action={assignProjectToVendorAction} className="glass-card max-w-2xl rounded-[28px] p-5"><h2 className="font-display text-xl font-black text-[var(--foreground)]">Assign an existing project</h2><p className="mt-1 text-sm text-[var(--gray-mid)]">Connect this CSR Associate to a project you manage.</p><input type="hidden" name="vendorId" value={vendor.id} /><div className="mt-4 flex flex-col gap-3 sm:flex-row"><select name="projectId" required className="h-12 min-w-0 flex-1 rounded-2xl px-4">{assignableProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white">Assign project</button></div></form> : null}
  </div>;
}
