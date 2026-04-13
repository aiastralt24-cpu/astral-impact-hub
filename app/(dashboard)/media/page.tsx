import { getDashboardData } from "@/lib/data/demo-store";

export default async function MediaPage() {
  const data = await getDashboardData();
  const media = data.updates.flatMap((update) => update.media.map((item) => ({ ...item, update })));

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Media Library</h1>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {media.map((item) => (
          <div key={item.id} className="rounded-[28px] border border-[var(--border)] bg-white p-5 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--accent-blue)]">{item.update.projectName}</p>
            <p className="font-display mt-3 text-xl font-bold">{item.name}</p>
            <p className="mt-2 text-sm text-[var(--gray-mid)]">{item.caption || "Awaiting caption"}</p>
            <p className="mt-4 text-sm">Status: {item.update.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
