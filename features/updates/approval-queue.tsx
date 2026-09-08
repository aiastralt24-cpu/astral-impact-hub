import { approvalAction } from "@/features/updates/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
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
  const visibleUpdates = updates.filter((update) =>
    session.role === "vendor" ? update.submittedByUserId === session.id : true
  );

  if (session.role === "vendor") {
    const statusLabels: Record<UpdateRecord["status"], string> = {
      draft: "Not submitted",
      pending: "Sent for review",
      in_review: "Being reviewed",
      revision_requested: "Changes needed",
      approved: "Approved",
      rejected: "Speak with your manager",
      published: "Shared"
    };

    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-lg font-bold text-[var(--foreground)]">Previous updates</h2>
          <p className="mt-1 text-sm text-[var(--gray-mid)]">Check what you submitted and whether changes are needed.</p>
        </div>
        {visibleUpdates.length > 0 ? (
          <div className="divide-y divide-[var(--border)]">
            {visibleUpdates.map((update) => (
              <div key={update.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">{update.projectName}</p>
                    <p className="mt-1 text-sm text-[var(--gray-mid)]">{update.happenedAt}</p>
                  </div>
                  <Badge variant={badgeMap[update.status]}>{statusLabels[update.status]}</Badge>
                </div>
                {update.status === "revision_requested" && commentsByUpdate[update.id]?.at(-1) ? (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Please update: {commentsByUpdate[update.id].at(-1)?.message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="px-5 py-8 text-sm text-[var(--gray-mid)]">You have not submitted an update yet.</p>
        )}
      </section>
    );
  }

  const actionable = visibleUpdates.filter((update) => ["pending", "in_review", "revision_requested"].includes(update.status));

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="px-5 py-4 sm:px-6">
          <h2 className="font-display text-xl font-bold text-[var(--foreground)]">Updates to review</h2>
          <p className="mt-1 text-sm text-[var(--gray-mid)]">Check each update and choose what should happen next.</p>
        </div>
        <div className="m-4 rounded-xl bg-[var(--primary-light)] px-4 py-2 text-center">
          <p className="text-2xl font-bold text-[var(--primary)]">{actionable.length}</p>
          <p className="text-xs text-[var(--gray-mid)]">to review</p>
        </div>
      </div>

      <div className="border-t border-[var(--border)]">
        {actionable.length ? (
          actionable.map((update) => (
            <article key={update.id} className="border-b border-[var(--border)] p-5 last:border-b-0 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Badge variant={badgeMap[update.status]}>{update.status === "revision_requested" ? "Changes requested" : "Needs review"}</Badge>
                  <h3 className="mt-3 font-display text-xl font-bold text-[var(--foreground)]">{update.projectName}</h3>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--gray-mid)]">What happened</p>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--foreground)]">{update.description || "No description was provided."}</p>
                </div>
                <div className="text-sm text-[var(--gray-mid)] sm:text-right">
                  <p>Submitted by <strong className="text-[var(--foreground)]">{update.vendorName === "Unknown CSR Associate" ? "Foundation team" : update.vendorName}</strong></p>
                  <p className="mt-1">Activity date: {update.happenedAt}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 rounded-xl bg-[#f8f9fc] px-4 py-3 text-sm">
                <span><span className="text-[var(--gray-mid)]">Project progress:</span> <strong>{update.progressPercent}%</strong></span>
                <span><span className="text-[var(--gray-mid)]">Photos/videos:</span> <strong>{update.media.length}</strong></span>
              </div>

              {commentsByUpdate[update.id]?.length ? (
                <div className="mt-4 rounded-xl bg-amber-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-amber-900">Previous review notes</p>
                  <div className="space-y-2 text-sm text-[var(--gray-mid)]">
                    {commentsByUpdate[update.id].map((comment) => (
                      <div key={comment.id}>
                        <strong className="text-[var(--foreground)]">{comment.author}</strong>: {comment.message.replace("approve at manager stage", "Approved by the project manager").replace("approve at admin stage", "Approved by the admin")}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <form action={approvalAction} className="mt-4 space-y-3">
                  <input type="hidden" name="updateId" value={update.id} />
                  <input type="hidden" name="stage" value={session.role === "admin" ? "admin" : "manager"} />
                  <label className="block text-sm font-medium text-[var(--foreground)]">Note for the team <span className="font-normal text-[var(--gray-mid)]">(required when asking for changes or rejecting)</span><input
                    type="text"
                    name="comment"
                    placeholder="Explain clearly what needs to change"
                    className="mt-2 h-11 w-full rounded-xl px-4 text-sm"
                  /></label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ConfirmSubmitButton
                      name="action"
                      value="approve"
                      confirmMessage={`Approve the update for ${update.projectName}?`}
                      pendingLabel="Approving..."
                      className="rounded-full border border-emerald-500/16 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/16"
                    >
                      Approve
                    </ConfirmSubmitButton>
                    <ConfirmSubmitButton
                      name="action"
                      value="request_revision"
                      confirmMessage={`Request a revision for ${update.projectName}?`}
                      pendingLabel="Sending..."
                      className="rounded-full border border-amber-500/16 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-500/16"
                    >
                      Ask for changes
                    </ConfirmSubmitButton>
                    <ConfirmSubmitButton
                      name="action"
                      value="reject"
                      confirmMessage={`Reject the update for ${update.projectName}?`}
                      pendingLabel="Rejecting..."
                      className="rounded-full border border-rose-500/16 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/16"
                    >
                      Reject
                    </ConfirmSubmitButton>
                  </div>
              </form>
            </article>
          ))
        ) : (
          <div className="rounded-[28px] border border-[var(--border)] bg-[#f8f9fc] p-6">
            <p className="text-base font-medium text-[var(--foreground)]">Nothing is waiting right now.</p>
            <p className="mt-2 text-sm leading-6 text-[var(--gray-mid)]">
              New updates will appear here when they need approval.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
