"use client";

import { useMemo, useState } from "react";

import { deleteMediaAction } from "@/features/updates/actions";

type MediaItem = {
  id: string;
  name: string;
  caption?: string;
  accessUrl: string | null;
  updateStatus: string;
  updateDate: string;
  vendorName: string;
  mimeType: string;
  sizeBytes: number;
};

type MediaProject = {
  project: { id: string; name: string; vendorName: string; location: string };
  items: MediaItem[];
};

export function MediaLibrary({ entries }: { entries: MediaProject[] }) {
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState("all");
  const [vendorName, setVendorName] = useState("all");
  const vendors = useMemo(() => [...new Set(entries.flatMap((entry) => entry.items.map((item) => item.vendorName)))].sort(), [entries]);
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => entries
    .filter((entry) => projectId === "all" || entry.project.id === projectId)
    .map((entry) => ({
      ...entry,
      items: entry.items.filter((item) =>
        (vendorName === "all" || item.vendorName === vendorName) &&
        (!normalizedQuery || [item.name, item.caption ?? "", entry.project.name, item.vendorName].some((value) => value.toLowerCase().includes(normalizedQuery)))
      )
    }))
    .filter((entry) => entry.items.length > 0), [entries, normalizedQuery, projectId, vendorName]);

  return <>
    <div className="glass-card grid gap-3 rounded-[24px] p-4 md:grid-cols-[minmax(0,1.4fr)_minmax(180px,0.8fr)_minmax(180px,0.8fr)]">
      <label className="grid gap-1.5 text-sm font-medium text-[var(--foreground)]">Search media<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="File name, caption, project, or NGO" className="h-11 rounded-2xl px-4" /></label>
      <label className="grid gap-1.5 text-sm font-medium text-[var(--foreground)]">Project<select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="h-11 rounded-2xl px-4"><option value="all">All projects</option>{entries.map((entry) => <option key={entry.project.id} value={entry.project.id}>{entry.project.name}</option>)}</select></label>
      <label className="grid gap-1.5 text-sm font-medium text-[var(--foreground)]">CSR Associate / NGO<select value={vendorName} onChange={(event) => setVendorName(event.target.value)} className="h-11 rounded-2xl px-4"><option value="all">All CSR Associates</option>{vendors.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
    </div>

    {filtered.length === 0 ? <div className="glass-card rounded-[28px] p-6"><p className="font-medium text-[var(--foreground)]">No matching media found.</p><p className="mt-2 text-sm text-[var(--gray-mid)]">Try another search or clear the project and CSR Associate filters.</p></div> : <div className="space-y-5">{filtered.map(({ project, items }) => <section key={project.id} className="glass-card rounded-[30px] p-6">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm uppercase tracking-[0.22em] text-[var(--accent-blue)]">{project.vendorName}</p><h2 className="font-display mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--foreground)]">{project.name}</h2><p className="mt-2 text-sm text-[var(--gray-mid)]">{project.location}</p></div><div className="rounded-[22px] bg-[#f8f9fc] px-4 py-3 ring-1 ring-[var(--border)]"><p className="text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)]">Media files</p><p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{items.length}</p></div></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <div key={item.id} className="rounded-[24px] border border-[var(--border)] bg-white/82 p-5 shadow-[0_10px_24px_rgba(17,24,39,0.05)]"><div className="flex items-start justify-between gap-3"><div><p className="font-medium text-[var(--foreground)]">{item.name}</p><p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)]">Stored securely</p></div><span className="rounded-full bg-[#f8f9fc] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--gray-mid)] ring-1 ring-[var(--border)]">{item.updateStatus.replaceAll("_", " ")}</span></div><p className="mt-3 text-sm leading-6 text-[var(--gray-mid)]">{item.caption || "Awaiting caption"}</p><div className="mt-4 flex items-center justify-between text-sm text-[var(--gray-mid)]"><span>{item.vendorName === "Unknown CSR Associate" || item.vendorName === "Managed internally" ? "Foundation team" : item.vendorName}</span><span>{item.updateDate}</span></div><div className="mt-4 flex flex-wrap items-center gap-3">{item.accessUrl ? <a href={item.accessUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[var(--border)] bg-[#f8f9fc] px-3 py-2 text-xs font-medium text-[var(--foreground)]">Open file</a> : <span className="rounded-full bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">File unavailable</span>}<span className="text-xs text-[var(--gray-mid)]">{item.mimeType} · {(item.sizeBytes / 1024 / 1024).toFixed(2)} MB</span></div><form action={deleteMediaAction} className="mt-3"><input type="hidden" name="mediaAssetId" value={item.id} /><button className="rounded-full border border-rose-500/18 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-500/16">Delete media</button></form></div>)}</div>
    </section>)}</div>}
  </>;
}
