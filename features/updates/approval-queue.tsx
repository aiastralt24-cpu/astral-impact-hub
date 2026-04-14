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
    <section className="glass-card rounded-[32px] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Review queue</p>
          <h2 className="mt-2 font-display text-[26px] font-black tracking-[-0.04em] text-[var(--foreground)]">
            {session.role === "vendor" ? "Your submitted updates" : "Waiting for attention"}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-[var(--gray-mid)]">
            {session.role === "vendor"
              ? "Track what is pending, what came back for revision, and what is ready to move forward."
              : "Review one item at a time, leave a note only when it adds clarity, and keep approvals moving."}
          </p>
        </div>
        <div className="rounded-[22px] border border-[var(--border)] bg-[#f8f9fc] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)]">Items</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{actionable.length}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {actionable.length ? (
          actionable.map((update) => (
            <article key={update.id} className="rounded-[28px] border border-[var(--border)] bg-[#f8f9fc] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant={badgeMap[update.status]}>{update.status.replaceAll("_", " ")}</Badge>
                    <Badge variant={update.readinessScore >= 75 ? "approved" : "pending"}>Readiness {update.readinessScore}</Badge>
                  </div>
                  <h3 className="font-display text-[24px] font-bold tracking-[-0.03em] text-[var(--foreground)]">{update.projectName}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--gray-mid)]">{update.description}</p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--gray-mid)]">
                  <p>{update.vendorName}</p>
                  <p className="mt-1">{update.happenedAt}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--gray-mid)]">Progress</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{update.progressPercent}%</p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--gray-mid)]">Media</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{update.media.length}</p>
                </div>
                <div className="rounded-[20px] border border-[var(--border)] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--gray-mid)]">Revisions</p>
                  <p className="mt-2 text-lg font-semibold text-[var(--foreground)]">{update.revisionCount}</p>
                </div>
              </div>

              {commentsByUpdate[update.id]?.length ? (
                <div className="mt-4 rounded-[22px] border border-[var(--border)] bg-white p-4">
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
                <form action={approvalAction} className="mt-4 space-y-3">
                  <input type="hidden" name="updateId" value={update.id} />
                  <input type="hidden" name="stage" value={session.role === "admin" ? "admin" : "manager"} />
                  <input
                    type="text"
                    name="comment"
                    placeholder="Add a review note"
                    className="h-11 w-full rounded-2xl px-4 text-sm"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <button
                      name="action"
                      value="approve"
                      className="rounded-full border border-emerald-500/16 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/16"
                    >
                      Approve
                    </button>
                    <button
                      name="action"
                      value="request_revision"
                      className="rounded-full border border-amber-500/16 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-500/16"
                    >
                      Request revision
                    </button>
                    <button
                      name="action"
                      value="reject"
                      className="rounded-full border border-rose-500/16 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/16"
                    >
                      Reject
                    </button>
                  </div>
                </form>
              )}
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-[var(--border)] bg-[#f8f9fc] p-6">
            <p className="text-base font-medium text-[var(--foreground)]">Nothing is waiting right now.</p>
            <p className="mt-2 text-sm leading-6 text-[var(--gray-mid)]">
              New submissions, review requests, and revision loops will appear here as the workflow moves.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
