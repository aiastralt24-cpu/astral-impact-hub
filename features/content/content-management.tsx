import { generateContentAction } from "@/features/content/actions";
import { Badge } from "@/components/ui/badge";
import type { GeneratedContentRecord, UpdateRecord } from "@/types/domain";

type ContentManagementProps = {
  updates: UpdateRecord[];
  generatedContent: GeneratedContentRecord[];
};

export function ContentManagement({ updates, generatedContent }: ContentManagementProps) {
  const contentByUpdate = new Map(generatedContent.map((item) => [item.updateId, item]));
  const eligibleUpdates = updates.filter((update) => update.status === "approved" || update.status === "published");

  return (
    <div className="space-y-4">
      {eligibleUpdates.map((update) => {
        const content = contentByUpdate.get(update.id);
        return (
          <div key={update.id} className="glass-card rounded-[30px] p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="approved">{update.status}</Badge>
                  <Badge variant={content ? "review" : "pending"}>{content ? "Generated" : "Pending generation"}</Badge>
                </div>
                <h3 className="font-display text-2xl font-black text-[var(--foreground)]">{update.projectName}</h3>
                <p className="mt-2 text-sm text-[var(--gray-mid)]">{update.description}</p>
              </div>
              {!content ? (
                <form action={generateContentAction}>
                  <input type="hidden" name="updateId" value={update.id} />
                  <button className="rounded-full border border-[var(--primary)]/35 bg-[var(--primary)]/18 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary)]/24">
                    Generate package
                  </button>
                </form>
              ) : null}
            </div>
            {content ? (
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-[var(--border)] bg-[#f8f9fc] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-blue)]">Emotional hook</p>
                  <p className="mt-3 text-lg text-[var(--foreground)]">{content.emotionalHook}</p>
                  <p className="mt-4 text-sm text-[var(--gray-mid)]">{content.instagramCaptionLong}</p>
                </div>
                <div className="rounded-3xl border border-[var(--border)] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent-blue)]">Telegram and WhatsApp</p>
                  <p className="mt-3 text-sm text-[var(--foreground)]">{content.telegramUpdate}</p>
                  <p className="mt-4 text-sm text-[var(--gray-mid)]">{content.whatsappDigest}</p>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
