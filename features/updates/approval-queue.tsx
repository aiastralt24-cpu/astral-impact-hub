import { approvalAction } from "@/features/updates/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import type { AppUser, ApprovalComment, UpdateRecord } from "@/types/domain";
import { CalendarDays, Check, ExternalLink, ImageIcon, RotateCcw, X } from "lucide-react";

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

function ReviewMedia({ update }: { update: UpdateRecord }) {
  if (!update.media.length) return null;
  return <section className="mt-5" aria-label={`Media for ${update.projectName}`}>
    <div className="mb-3 flex items-center justify-between gap-3"><h4 className="text-sm font-semibold text-[var(--foreground)]">Photos and videos</h4><span className="text-xs text-[var(--gray-mid)]">Click a file to open it</span></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{update.media.map(media => {
      const source = `/api/media/${media.id}`;
      return <a key={media.id} href={source} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-[var(--border)] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]" aria-label={`Open ${media.name}`}>
        {media.mimeType.startsWith("video/") ? <video src={source} muted playsInline preload="metadata" className="aspect-video w-full bg-slate-950 object-cover" /> : <img src={source} alt={media.caption || media.name} loading="lazy" className="aspect-video w-full bg-slate-100 object-cover transition-transform group-hover:scale-[1.02]" />}
        <span className="flex items-center justify-between gap-2 px-3 py-2 text-xs"><span className="truncate font-medium text-[var(--foreground)]">{media.caption || media.name}</span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--gray-mid)]" /></span>
      </a>;
    })}</div>
  </section>;
}

function UpdateDetails({ update }: { update: UpdateRecord }) {
  const details = [
    ["People or outcomes reached", update.beneficiariesCount !== undefined ? `${update.beneficiariesCount} ${update.beneficiaryType || ""}`.trim() : "Not provided"],
    ["Work duration", update.workDuration || "Not provided"],
    ["Why it matters", update.whyItMatters || "Not provided"],
    ["Highlight moment", update.highlightMoment || "Not provided"],
    ["Quote", update.quote || "Not provided"],
    ["Challenges", update.challenges || "Not provided"],
    ["Next steps", update.nextSteps || "Not provided"]
  ];
  const flags = [update.socialMediaWorthy && "Suitable for social media", update.urgent && "Urgent", update.documentationOnly && "Documentation only", update.sensitiveContent && "Sensitive content"].filter((flag): flag is string => Boolean(flag));
  return <section className="mt-5 rounded-xl border border-[var(--border)] bg-[#f8f9fc] p-4 sm:p-5" aria-label="Submitted update details">
    <h4 className="text-sm font-semibold text-[var(--foreground)]">Submitted details</h4>
    <dl className="mt-4 grid gap-4 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className={String(value).length > 80 ? "sm:col-span-2" : ""}><dt className="text-xs font-medium text-[var(--gray-mid)]">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]">{value}</dd></div>)}</dl>
    {flags.length ? <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">{flags.map(flag => <span key={flag} className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[var(--foreground)] ring-1 ring-[var(--border)]">{flag}</span>)}</div> : null}
  </section>;
}

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
      rejected: "Rejected",
      published: "Shared"
    };

    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
        <div className="border-b border-[var(--border)] px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-[var(--foreground)]">Previous updates</h2>
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
    <section className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--foreground)]">Review queue</h2>
          <p className="mt-1 text-sm text-[var(--gray-mid)]">Approve submissions or return them with a clear note.</p>
        </div>
        <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-[var(--primary)] px-3 text-sm font-semibold text-white">{actionable.length}</span>
      </div>

      <div className="divide-y divide-[var(--border)]">
        {actionable.length ? (
          actionable.map((update) => (
            <article key={update.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Badge variant={badgeMap[update.status]}>{update.status === "revision_requested" ? "Changes requested" : "Needs review"}</Badge>
                  <h3 className="mt-3 font-display text-xl font-semibold text-[var(--foreground)]">{update.projectName}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--foreground)]">{update.description || "No description was provided."}</p>
                </div>
                <div className="text-xs text-[var(--gray-mid)] sm:text-right">
                  <p className="font-semibold text-[var(--foreground)]">{update.vendorName}</p>
                  <p className="mt-1 inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{update.happenedAt}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-lg bg-slate-100 px-3 py-2"><span className="text-[var(--gray-mid)]">Progress</span> <strong className="ml-1">{update.progressPercent}%</strong></span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2"><ImageIcon className="h-3.5 w-3.5 text-[var(--gray-mid)]" /><strong>{update.media.length}</strong> files</span>
              </div>

              <ReviewMedia update={update} />
              <UpdateDetails update={update} />

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

              <form action={approvalAction} className="mt-5 space-y-3">
                  <input type="hidden" name="updateId" value={update.id} />
                  <input type="hidden" name="stage" value={session.role === "admin" ? "admin" : "manager"} />
                  <label className="block text-sm font-semibold text-[var(--foreground)]">Review note <span className="font-normal text-[var(--gray-mid)]">— required for changes or rejection</span><input
                    type="text"
                    name="comment"
                    placeholder="Explain clearly what needs to change"
                    className="mt-2 h-11 w-full rounded-xl px-4 text-sm"
                  /></label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                    <ConfirmSubmitButton
                      name="action"
                      value="approve"
                      confirmMessage={`Approve the update for ${update.projectName}?`}
                      pendingLabel="Approving..."
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" />Approve
                    </ConfirmSubmitButton>
                    <ConfirmSubmitButton
                      name="action"
                      value="request_revision"
                      confirmMessage={`Request a revision for ${update.projectName}?`}
                      pendingLabel="Sending..."
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-800 transition-colors hover:bg-amber-100"
                    >
                      <RotateCcw className="h-4 w-4" />Ask for changes
                    </ConfirmSubmitButton>
                    <ConfirmSubmitButton
                      name="action"
                      value="reject"
                      confirmMessage={`Reject the update for ${update.projectName}?`}
                      pendingLabel="Rejecting..."
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />Reject
                    </ConfirmSubmitButton>
                  </div>
              </form>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-[var(--border)] bg-[#f8f9fc] p-6">
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
