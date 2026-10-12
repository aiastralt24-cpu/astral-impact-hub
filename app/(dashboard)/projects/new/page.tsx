import Link from "next/link";
import { redirect } from "next/navigation";
import { ProjectManagement } from "@/features/projects/project-management";
import { canCreateProject } from "@/lib/auth/project-permissions";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/demo-store";

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<{ error?: string; vendorId?: string }> }) {
  const session = await requireSession();
  if (!canCreateProject(session)) redirect("/projects");
  const data = await getDashboardData(session);
  const { error, vendorId } = await searchParams;
  const defaultVendorIds = vendorId && data.vendors.some((vendor) => vendor.id === vendorId) ? [vendorId] : undefined;
  return <div className="space-y-5"><Link href="/projects" className="text-sm font-semibold text-[var(--primary)]">← Back to projects</Link><div><h1 className="font-display text-3xl font-black">Create new project</h1><p className="mt-1 text-sm text-[var(--gray-mid)]">Add the essential details now. You can complete optional information later.</p></div>{error === "missing_dates" ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Please add both the start date and end date.</p> : null}<ProjectManagement projects={[]} vendors={data.vendors} managers={data.users.filter((user) => user.role === "admin" || user.role === "project_manager")} session={session} defaultVendorIds={defaultVendorIds} /></div>;
}
