import { distributeAction } from "@/features/distribution/actions";
import { Badge } from "@/components/ui/badge";
import type { DistributionLogRecord, GeneratedContentRecord, UpdateRecord } from "@/types/domain";

type DistributionManagementProps = {
  updates: UpdateRecord[];
  generatedContent: GeneratedContentRecord[];
  distributionLog: DistributionLogRecord[];
};

export function DistributionManagement({ updates, generatedContent, distributionLog }: DistributionManagementProps) {
  const distributable = updates
    .map((update) => ({
      update,
      content: generatedContent.find((item) => item.updateId === update.id)
    }))
    .filter((item) => item.content);

  const sentThisWeek = distributionLog.filter(
    (entry) => new Date(entry.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Ready packages</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">{distributable.length}</p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Approved content waiting for channel delivery</p>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Delivered this week</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">{sentThisWeek.length}</p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Completed sends across all active channels</p>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Latest channel</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)] capitalize">{distributionLog[0]?.channel ?? "None"}</p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">
            {distributionLog[0] ? distributionLog[0].message : "No delivery attempts have been made yet"}
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
        {distributable.map(({ update, content }) => (
          <div key={update.id} className="glass-card rounded-[28px] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-black text-[var(--foreground)]">{update.projectName}</h3>
                <p className="mt-2 text-sm text-[var(--gray-mid)]">{content?.emotionalHook}</p>
              </div>
              <Badge variant={update.status === "published" ? "published" : "review"}>{update.status}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {["telegram", "whatsapp", "instagram"].map((channel) => (
                <form action={distributeAction} key={channel}>
                  <input type="hidden" name="updateId" value={update.id} />
                  <input type="hidden" name="contentId" value={content?.id} />
                  <button
                    name="channel"
                    value={channel}
                    className={`rounded-full px-4 py-2 text-sm font-medium ring-1 ${
                      channel === "telegram"
                        ? "bg-[var(--primary)] text-white ring-[var(--primary)]/20"
                        : channel === "whatsapp"
                          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                          : "bg-amber-50 text-amber-700 ring-amber-200"
                    }`}
                  >
                    Send to {channel}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
        </div>
        <div className="glass-card rounded-[28px] p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Recent delivery log</p>
        <div className="mt-4 space-y-3">
          {distributionLog.length === 0 ? <p className="text-sm text-[var(--gray-mid)]">No delivery attempts yet.</p> : null}
          {distributionLog.map((entry) => (
            <div key={entry.id} className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
              <p className="font-medium capitalize text-[var(--foreground)]">{entry.channel}</p>
              <p className="mt-1 text-[var(--gray-mid)]">{entry.message}</p>
            </div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
