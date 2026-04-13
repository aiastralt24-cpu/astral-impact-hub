import { getSession, requireSession } from "@/lib/auth/session";
import { getApprovalComments, getDashboardData } from "@/lib/data/demo-store";
import { ApprovalQueue } from "@/features/updates/approval-queue";
import { UpdateWizard } from "@/features/updates/update-wizard";

export default async function UpdatesPage() {
  const [data, session] = await Promise.all([getDashboardData(), requireSession()]);
  const commentsByUpdate = Object.fromEntries(data.updates.map((update) => [update.id, getApprovalComments(update.id)]));
  const vendor = data.vendors.find((entry) => entry.assignedProjectIds.some((projectId) => data.projects.some((project) => project.id === projectId)));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent-blue)]">Field updates</p>
        <h1 className="font-display text-3xl font-black">Capture and review</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <UpdateWizard projects={data.projects} vendors={data.vendors} defaultVendorId={vendor?.id} />
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Review queue</p>
          <ApprovalQueue updates={data.updates} commentsByUpdate={commentsByUpdate} session={session} />
        </div>
      </div>
    </div>
  );
}
