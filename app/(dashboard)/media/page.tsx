import { MediaLibrary } from "@/features/media/media-library";
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
      <div className="space-y-1 pl-16 lg:pl-0">
        <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent-blue)]">Media library</p>
        <h1 className="font-display text-3xl font-black">Project media</h1>
        <p className="text-sm text-[var(--gray-mid)]">
          {session.isSuperAdmin
            ? "All project media across the workspace."
            : session.role === "vendor"
              ? "Media from your assigned project work only."
              : "Media from your assigned CSR Associates and projects only."}
        </p>
      </div>

      {visibleMediaByProject.length === 0 ? (
        <div className="glass-card rounded-[28px] p-6">
          <p className="font-medium text-[var(--foreground)]">No media available yet.</p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Uploaded images and videos will appear here once updates include media.</p>
        </div>
      ) : <MediaLibrary entries={visibleMediaByProject} />}
    </div>
  );
}
