import { deleteMediaAction } from "@/features/updates/actions";
import { getDashboardData } from "@/lib/data/demo-store";
import { requireSession } from "@/lib/auth/session";
import { getMediaAccessUrl } from "@/lib/media/storage";

export default async function MediaPage() {
  const session = await requireSession();
  const data = await getDashboardData(session);

  const mediaByProject = await Promise.all(
    data.projects
    .map((project) => ({
      project,
      items: data.updates
        .filter((update) => update.projectId === project.id)
        .flatMap((update) =>
          update.media.map(async (item) => ({
            ...item,
            accessUrl: await getMediaAccessUrl(item, { actor: session }),
            updateStatus: update.status,
            updateDate: update.happenedAt,
            vendorName: update.vendorName
          }))
        )
    }))
    .map(async (entry) => ({
      project: entry.project,
      items: await Promise.all(entry.items)
    }))
  );
  const visibleMediaByProject = mediaByProject.filter((entry) => entry.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent-blue)]">Media library</p>
        <h1 className="font-display text-3xl font-black">Project media</h1>
        <p className="text-sm text-[var(--gray-mid)]">
          {session.isSuperAdmin
            ? "All project media across the workspace."
            : session.role === "vendor"
              ? "Media from your assigned project work only."
              : "Media from your assigned vendors and projects only."}
        </p>
      </div>

      {visibleMediaByProject.length === 0 ? (
        <div className="glass-card rounded-[28px] p-6">
          <p className="font-medium text-[var(--foreground)]">No media available yet.</p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Uploaded images and videos will appear here once updates include media.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {visibleMediaByProject.map(({ project, items }) => (
            <section key={project.id} className="glass-card rounded-[30px] p-6">
              <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--accent-blue)]">{project.vendorName}</p>
                  <h2 className="font-display mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--foreground)]">{project.name}</h2>
                  <p className="mt-2 text-sm text-[var(--gray-mid)]">{project.location}</p>
                </div>
                <div className="rounded-[22px] bg-[#f8f9fc] px-4 py-3 ring-1 ring-[var(--border)]">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)]">Media files</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{items.length}</p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-[var(--border)] bg-white/82 p-5 shadow-[0_10px_24px_rgba(17,24,39,0.05)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--foreground)]">{item.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)]">{item.storageProvider.replaceAll("_", " ")}</p>
                      </div>
                      <span className="rounded-full bg-[#f8f9fc] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)] ring-1 ring-[var(--border)]">
                        {item.updateStatus.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--gray-mid)]">{item.caption || "Awaiting caption"}</p>
                    <div className="mt-4 flex items-center justify-between text-sm text-[var(--gray-mid)]">
                      <span>{item.vendorName}</span>
                      <span>{item.updateDate}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <a
                        href={item.accessUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--border)] bg-[#f8f9fc] px-3 py-2 text-xs font-medium text-[var(--foreground)]"
                      >
                        Open file
                      </a>
                      <span className="text-xs text-[var(--gray-mid)]">
                        {item.mimeType} · {(item.sizeBytes / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <form action={deleteMediaAction} className="mt-3">
                      <input type="hidden" name="mediaAssetId" value={item.id} />
                      <button className="rounded-full border border-rose-500/18 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-500/16">
                        Delete media
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
