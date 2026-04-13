import { approvalAction } from "@/features/updates/actions";
import { Badge } from "@/components/ui/badge";
import type { AppUser, ApprovalComment, UpdateRecord } from "@/types/domain";

type ApprovalQueueProps = {
  updates: UpdateRecord[];
  commentsByUpdate: Record<string, ApprovalComment[]>;
  session: AppUser;
};

const badgeMap = {
  pending: "pending",
  in_review: "review",
  revision_requested: "revision",
  approved: "approved",
  rejected: "rejected",
  published: "published",
  draft: "neutral"
} as const;

export function ApprovalQueue({ updates, commentsByUpdate, session }: ApprovalQueueProps) {
  const actionable = updates.filter((update) =>
    session.role === "vendor" ? update.submittedByUserId === session.id : true
  );

  return (
    <div className="space-y-4">
      {actionable.map((update) => (
        <div key={update.id} className="glass-card rounded-[30px] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={badgeMap[update.status]}>{update.status.replaceAll("_", " ")}</Badge>
                <Badge variant={update.readinessScore >= 75 ? "approved" : "pending"}>Readiness {update.readinessScore}</Badge>
              </div>
              <h3 className="font-display text-xl font-bold text-[var(--foreground)]">{update.projectName}</h3>
              <p className="mt-2 max-w-3xl text-sm text-[var(--gray-mid)]">{update.description}</p>
            </div>
            <div className="text-sm text-[var(--gray-mid)]">
              <p>{update.vendorName}</p>
              <p>{update.happenedAt}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-[var(--border)] bg-[#f8f9fc] p-4 text-sm text-[var(--foreground)]">Progress {update.progressPercent}%</div>
            <div className="rounded-3xl border border-[var(--border)] bg-[#f8f9fc] p-4 text-sm text-[var(--foreground)]">Media {update.media.length}</div>
            <div className="rounded-3xl border border-[var(--border)] bg-[#f8f9fc] p-4 text-sm text-[var(--foreground)]">Revisions {update.revisionCount}</div>
          </div>

          {commentsByUpdate[update.id]?.length ? (
            <div className="mt-4 rounded-3xl border border-[var(--border)] bg-[#f8f9fc] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-blue)]">Audit trail</p>
              <div className="space-y-2 text-sm text-[var(--gray-mid)]">
                {commentsByUpdate[update.id].map((comment) => (
                  <div key={comment.id}>
                    <strong className="text-[var(--foreground)]">{comment.author}</strong>: {comment.message}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {session.role === "vendor" ? null : (
            <form action={approvalAction} className="mt-4 flex flex-wrap items-center gap-3">
              <input type="hidden" name="updateId" value={update.id} />
              <input type="hidden" name="stage" value={session.role === "admin" ? "admin" : "manager"} />
              <input
                type="text"
                name="comment"
                placeholder="Add a review note"
                className="h-11 min-w-56 flex-1 rounded-2xl px-4 text-sm"
              />
              <button
                name="action"
                value="approve"
                className="rounded-full border border-emerald-500/16 bg-emerald-500/8 px-4 py-2 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/12"
              >
                Approve
              </button>
              <button
                name="action"
                value="request_revision"
                className="rounded-full border border-amber-500/16 bg-amber-500/8 px-4 py-2 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-500/12"
              >
                Request revision
              </button>
              <button
                name="action"
                value="reject"
                className="rounded-full border border-rose-500/16 bg-rose-500/8 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/12"
              >
                Reject
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
