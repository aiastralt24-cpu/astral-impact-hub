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
  const pendingCount = data.updates.filter((update) => ["pending", "in_review", "revision_requested"].includes(update.status)).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-end">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent-blue)]">Field updates</p>
          <h1 className="font-display text-3xl font-black tracking-[-0.04em]">Capture and review</h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--gray-mid)]">
            Submit one clean field update, keep the project context in view, and move ready items through review without losing the story.
          </p>
        </div>

        <div className="glass-card rounded-[28px] px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--gray-mid)]">Queue right now</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{pendingCount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--gray-mid)]">Submission flow</p>
              <p className="mt-2 text-sm text-[var(--foreground)]">7 guided steps</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.3fr)_420px]">
        <UpdateWizard projects={data.projects} vendors={data.vendors} defaultVendorId={vendor?.id} />
        <ApprovalQueue updates={data.updates} commentsByUpdate={commentsByUpdate} session={session} />
      </div>
    </div>
  );
}
