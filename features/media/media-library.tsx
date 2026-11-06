"use client";

import { useMemo, useState } from "react";
import { Download, ExternalLink, FileImage, MoreHorizontal, Search, Trash2 } from "lucide-react";

import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { deleteMediaAction } from "@/features/updates/actions";

type MediaItem = { id: string; name: string; caption?: string; accessUrl: string | null; updateStatus: string; updateDate: string; vendorName: string; mimeType: string; sizeBytes: number };
type MediaProject = { project: { id: string; name: string; vendorName: string; location: string }; items: MediaItem[] };
type SortOrder = "newest" | "oldest" | "largest" | "name";

const statusStyles: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  published: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/15",
  in_review: "bg-blue-50 text-blue-700 ring-blue-600/15",
  revision_requested: "bg-orange-50 text-orange-700 ring-orange-600/15",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/15"
};

function formatFileSize(bytes: number) { return `${(bytes / 1024 / 1024).toFixed(2)} MB`; }
function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function MediaPreview({ item }: { item: MediaItem }) {
  if (!item.accessUrl) return <div className="flex aspect-[4/3] items-center justify-center bg-[#f3f6fa] text-[var(--gray-mid)]"><FileImage className="h-10 w-10" /><span className="sr-only">Preview unavailable</span></div>;
  if (item.mimeType.startsWith("video/")) return <video src={item.accessUrl} className="aspect-[4/3] w-full bg-slate-950 object-cover" muted playsInline preload="metadata" />;
  return <img src={item.accessUrl} alt={item.caption || item.name} className="aspect-[4/3] w-full bg-[#f3f6fa] object-cover transition-transform duration-300 group-hover:scale-[1.025]" loading="lazy" />;
}

export function MediaLibrary({ entries }: { entries: MediaProject[] }) {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [vendorName, setVendorName] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const vendors = useMemo(() => [...new Set(entries.flatMap((entry) => entry.items.map((item) => item.vendorName)))].sort(), [entries]);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => entries.filter((entry) => projectId === "all" || entry.project.id === projectId).map((entry) => {
    const items = [...entry.items.filter((item) => (vendorName === "all" || item.vendorName === vendorName) && (!normalizedQuery || [item.name, item.caption ?? "", entry.project.name, item.vendorName].some((value) => value.toLowerCase().includes(normalizedQuery))))].sort((a, b) => {
      if (sortOrder === "oldest") return a.updateDate.localeCompare(b.updateDate);
      if (sortOrder === "largest") return b.sizeBytes - a.sizeBytes;
      if (sortOrder === "name") return a.name.localeCompare(b.name);
      return b.updateDate.localeCompare(a.updateDate);
    });
    return { ...entry, items };
  }).filter((entry) => entry.items.length > 0), [entries, normalizedQuery, projectId, sortOrder, vendorName]);
  const visibleFileCount = filtered.reduce((total, entry) => total + entry.items.length, 0);

  return <>
    <div className="sticky top-3 z-20 rounded-[22px] border border-white/80 bg-white/90 p-3 shadow-[0_12px_34px_rgba(17,24,39,0.08)] backdrop-blur-xl">
      <div className="grid gap-2 md:grid-cols-[minmax(240px,1.4fr)_minmax(160px,0.8fr)_minmax(170px,0.8fr)_minmax(135px,0.55fr)]">
        <label className="relative block"><span className="sr-only">Search media</span><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gray-mid)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files, projects or captions" className="h-11 w-full rounded-xl pl-10 pr-4 text-sm" /></label>
        <label><span className="sr-only">Project</span><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-11 w-full rounded-xl px-3 text-sm"><option value="all">All projects</option>{entries.map((entry) => <option key={entry.project.id} value={entry.project.id}>{entry.project.name}</option>)}</select></label>
        <label><span className="sr-only">CSR Associate</span><select value={vendorName} onChange={(event) => setVendorName(event.target.value)} className="h-11 w-full rounded-xl px-3 text-sm"><option value="all">All CSR Associates</option>{vendors.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
        <label><span className="sr-only">Sort media</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="h-11 w-full rounded-xl px-3 text-sm"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="largest">Largest first</option><option value="name">File name</option></select></label>
      </div>
      <p className="mt-2 px-1 text-xs text-[var(--gray-mid)]">Showing {visibleFileCount} {visibleFileCount === 1 ? "file" : "files"}</p>
    </div>

    {filtered.length === 0 ? <div className="rounded-[24px] border border-dashed border-[var(--border)] bg-white/70 p-10 text-center"><FileImage className="mx-auto h-8 w-8 text-[var(--gray-mid)]" /><p className="mt-4 font-semibold text-[var(--foreground)]">No matching media found</p><p className="mt-1 text-sm text-[var(--gray-mid)]">Try another search or clear the active filters.</p></div> : <div className="space-y-10">{filtered.map(({ project, items }) => <section key={project.id} aria-labelledby={`media-project-${project.id}`}>
      <div className="mb-4 flex flex-col gap-2 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 id={`media-project-${project.id}`} className="font-display text-2xl font-black tracking-[-0.035em] text-[var(--foreground)]">{project.name}</h2><p className="mt-1 text-sm text-[var(--gray-mid)]">{project.vendorName} <span aria-hidden="true">·</span> {project.location}</p></div><p className="text-sm font-medium text-[var(--gray-mid)]">{items.length} {items.length === 1 ? "file" : "files"}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{items.map((item) => <article key={item.id} className="group overflow-hidden rounded-[20px] border border-[var(--border)] bg-white shadow-[0_10px_26px_rgba(17,24,39,0.06)] transition-shadow hover:shadow-[0_16px_34px_rgba(17,24,39,0.11)]">
        <a href={item.accessUrl ?? undefined} target="_blank" rel="noreferrer" className={`relative block overflow-hidden ${item.accessUrl ? "cursor-zoom-in" : "cursor-default"}`} aria-label={item.accessUrl ? `Open ${item.name}` : `${item.name}, preview unavailable`}><MediaPreview item={item} /><span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ring-1 ${statusStyles[item.updateStatus] ?? "bg-white/90 text-slate-700 ring-slate-900/10"}`}>{item.updateStatus.replaceAll("_", " ")}</span></a>
        <div className="p-4"><p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-[var(--foreground)]" title={item.name}>{item.name}</p><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[var(--gray-mid)]">{item.caption || "No caption added"}</p><div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--gray-mid)]"><span>{formatFileSize(item.sizeBytes)}</span><span>{formatDate(item.updateDate)}</span></div>
          <div className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3">{item.accessUrl ? <><a href={item.accessUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 text-xs font-semibold text-white"><ExternalLink className="h-3.5 w-3.5" />View</a><a href={item.accessUrl} download={item.name} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 text-xs font-semibold text-[var(--foreground)]"><Download className="h-3.5 w-3.5" />Download</a></> : <span className="text-xs font-medium text-amber-700">File unavailable</span>}
            <details className="relative ml-auto"><summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-[var(--border)] text-[var(--gray-mid)] transition-colors hover:bg-[#f4f6fa] hover:text-[var(--foreground)]" aria-label={`More actions for ${item.name}`}><MoreHorizontal className="h-4 w-4" /></summary><div className="absolute bottom-11 right-0 z-10 w-44 rounded-xl border border-[var(--border)] bg-white p-1.5 shadow-[0_16px_40px_rgba(17,24,39,0.16)]"><form action={deleteMediaAction}><input type="hidden" name="mediaAssetId" value={item.id} /><ConfirmSubmitButton confirmMessage={`Delete ${item.name}? This cannot be undone.`} pendingLabel="Deleting..." className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Delete media</ConfirmSubmitButton></form></div></details>
          </div>
        </div>
      </article>)}</div>
    </section>)}</div>}
  </>;
}
