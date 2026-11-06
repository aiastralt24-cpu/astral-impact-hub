import { requireSession } from "@/lib/auth/session";
import { getApprovalComments, getDashboardData } from "@/lib/data/demo-store";
import { ApprovalQueue } from "@/features/updates/approval-queue";
import { UpdateWizard } from "@/features/updates/update-wizard";

export default async function UpdatesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const session = await requireSession();
  const { projectId } = await searchParams;
  const data = await getDashboardData(session);
  const commentsByUpdate = Object.fromEntries(
    await Promise.all(data.updates.map(async (update) => [update.id, await getApprovalComments(update.id)] as const))
  );
  const vendor = data.vendors.find((entry) => entry.assignedProjectIds.some((projectId) => data.projects.some((project) => project.id === projectId)));

  return (
    <div className="space-y-6">
      <div className="space-y-2 pl-16 lg:pl-0">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Field reporting</p>
        <h1 className="font-display text-4xl font-black tracking-[-0.04em] sm:text-5xl">Project updates</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--gray-mid)]">Record activity, outcomes, and supporting media in one clear update.</p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <UpdateWizard projects={data.projects} vendors={data.vendors} defaultVendorId={vendor?.id} initialProjectId={projectId} />
        <ApprovalQueue updates={data.updates} commentsByUpdate={commentsByUpdate} session={session} />
      </div>
    </div>
  );
}
