import { UpdateHistory } from "@/features/updates/update-history";
import { ViewTabs } from "@/components/ui/view-tabs";
import { requireSession } from "@/lib/auth/session";
import { getApprovalComments, getDashboardData } from "@/lib/data/demo-store";
import { ApprovalQueue } from "@/features/updates/approval-queue";
import { UpdateWizard } from "@/features/updates/update-wizard";

export default async function UpdatesPage({ searchParams }: { searchParams: Promise<{ projectId?: string; view?: string }> }) {
  const session = await requireSession();
  const { projectId, view } = await searchParams;
  const data = await getDashboardData(session);
  const commentsByUpdate = Object.fromEntries(
    await Promise.all(data.updates.map(async (update) => [update.id, await getApprovalComments(update.id)] as const))
  );
  const vendor = data.vendors.find((entry) => entry.assignedProjectIds.some((projectId) => data.projects.some((project) => project.id === projectId)));

  return (
    <div className="space-y-6">
      <div className="space-y-2 ">
        <p className="text-xs font-semibold tracking-normal text-[var(--primary)]">Field reporting</p>
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.025em] ">Project updates</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--gray-mid)]">Record activity, outcomes, and supporting media in one clear update.</p>
      </div>

      <ViewTabs initialTab={view === "review" ? 1 : view === "history" && session.role !== "vendor" ? 2 : 0} firstLabel="New update" secondLabel={session.role === "vendor" ? "Previous updates" : `Review queue (${data.updates.filter(update => ["pending", "in_review", "revision_requested"].includes(update.status)).length})`}
        first={<div className="max-w-3xl"><UpdateWizard projects={data.projects} vendors={data.vendors} defaultVendorId={vendor?.id} initialProjectId={projectId} /></div>}
        second={session.role === "vendor" ? <UpdateHistory updates={data.updates} commentsByUpdate={commentsByUpdate} /> : <ApprovalQueue updates={data.updates} commentsByUpdate={commentsByUpdate} session={session} />}
        thirdLabel={session.role === "vendor" ? undefined : "Update history"}
        third={session.role === "vendor" ? undefined : <UpdateHistory updates={data.updates} commentsByUpdate={commentsByUpdate} />}
      />
    </div>
  );
}
