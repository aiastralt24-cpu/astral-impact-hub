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

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        {distributable.map(({ update, content }) => (
          <div key={update.id} className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-black">{update.projectName}</h3>
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
                    className={`rounded-full px-4 py-2 text-sm font-medium text-white ${channel === "telegram" ? "bg-[var(--primary)]" : channel === "whatsapp" ? "bg-[var(--teal)]" : "bg-[var(--accent-orange)]"}`}
                  >
                    Send to {channel}
                  </button>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-[28px] border border-[var(--border)] bg-white p-6 shadow-sm">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Recent delivery log</p>
        <div className="mt-4 space-y-3">
          {distributionLog.length === 0 ? <p className="text-sm text-[var(--gray-mid)]">No delivery attempts yet.</p> : null}
          {distributionLog.map((entry) => (
            <div key={entry.id} className="rounded-3xl bg-[var(--primary-light)] p-4 text-sm">
              <p className="font-medium capitalize">{entry.channel}</p>
              <p className="mt-1 text-[var(--gray-mid)]">{entry.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
