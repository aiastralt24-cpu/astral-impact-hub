import { requireSession } from "@/lib/auth/session";
import { getApprovalComments, getDashboardData } from "@/lib/data/demo-store";
import { ApprovalQueue } from "@/features/updates/approval-queue";
import { UpdateWizard } from "@/features/updates/update-wizard";

export default async function UpdatesPage() {
  const session = await requireSession();
  const data = await getDashboardData(session);
  const commentsByUpdate = Object.fromEntries(
    await Promise.all(data.updates.map(async (update) => [update.id, await getApprovalComments(update.id)] as const))
  );
  const vendor = data.vendors.find((entry) => entry.assignedProjectIds.some((projectId) => data.projects.some((project) => project.id === projectId)));

  return (
    <div className="space-y-5">
      <div className="space-y-2 pl-16 lg:pl-0">
        <h1 className="font-display text-3xl font-black tracking-[-0.04em]">Project updates</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--gray-mid)]">Share what happened, add progress and photos, then submit.</p>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_420px]">
        <UpdateWizard projects={data.projects} vendors={data.vendors} defaultVendorId={vendor?.id} />
        <ApprovalQueue updates={data.updates} commentsByUpdate={commentsByUpdate} session={session} />
      </div>
    </div>
  );
}
