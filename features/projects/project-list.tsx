"use client";
import Link from "next/link";
import { useState } from "react";
import { LayoutGrid, List, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ProjectRecord } from "@/types/domain";

function date(value: string) { if (!value) return "Not set"; const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? value : parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }); }
export function ProjectList({ projects, projectsWithUpdates = [] }: { projects: ProjectRecord[]; projectsWithUpdates?: string[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<"list" | "cards">("list");
  const filtered = projects.filter(project => `${project.name} ${project.vendorName} ${project.location}`.toLowerCase().includes(query.trim().toLowerCase()) && (status === "all" || project.status === status));
  return <section aria-label="Projects" className="space-y-4">
    <div className="flex flex-wrap items-center gap-3"><label className="relative w-full sm:w-72"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><span className="sr-only">Search projects</span><input className="h-10 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-3" type="search" placeholder="Search projects or associates" value={query} onChange={e => setQuery(e.target.value)} /></label><select aria-label="Filter by project status" className="h-10 rounded-lg border border-[var(--border)] bg-white px-3 text-sm" value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option>{[...new Set(projects.map(p => p.status))].map(value => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select><p aria-live="polite" className="text-xs text-[var(--gray-mid)]">{filtered.length} projects</p><div className="ml-auto flex rounded-lg border border-[var(--border)] bg-white p-1">{(["list", "cards"] as const).map(mode => <button key={mode} type="button" aria-label={`${mode === "list" ? "List" : "Card"} view`} aria-pressed={view === mode} onClick={() => setView(mode)} className={`flex h-8 w-9 items-center justify-center rounded-md ${view === mode ? "bg-blue-50 text-[var(--primary)]" : "text-slate-500 hover:bg-slate-50"}`}>{mode === "list" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}</button>)}</div></div>
    <div className={view === "cards" ? "grid gap-4 lg:grid-cols-2" : "overflow-hidden rounded-2xl border border-[var(--border)] bg-white divide-y divide-[var(--border)]"}>
      {filtered.map(project => { const hasUpdate = projectsWithUpdates.includes(project.id); return <article key={project.id} className={view === "cards" ? "rounded-2xl border border-[var(--border)] bg-white p-5" : "grid items-start gap-4 p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"}>
        <div><div className="flex flex-wrap items-center gap-2"><Link href={`/projects/${project.id}`} className="text-base font-semibold hover:text-[var(--primary)]">{project.name}</Link><Badge variant={project.status === "active" || project.status === "completed" ? "approved" : "neutral"} className="capitalize">{project.status.replaceAll("_", " ")}</Badge></div><p className="mt-1 text-sm text-[var(--gray-mid)]">{project.location || "Location not added"}</p>{view === "cards" && <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--gray-mid)]">{project.projectBrief || "No overview added yet."}</p>}</div>
        <div className={view === "cards" ? "mt-4" : ""}><p className="text-xs text-[var(--gray-mid)]">CSR Associate</p><p className="mt-1 text-sm">{project.vendorName || "Managed internally"}</p></div>
        <div className={view === "cards" ? "mt-3" : ""}><p className="text-xs text-[var(--gray-mid)]">Project dates</p><p className="mt-1 text-xs leading-5">{date(project.startDate)} – {date(project.endDate)}</p></div>
        <div className={`flex flex-wrap items-center gap-3 ${view === "cards" ? "mt-4 border-t border-[var(--border)] pt-4" : "lg:flex-col lg:items-end"}`}><Link href={`/projects/${project.id}`} className="inline-flex min-h-10 items-center rounded-lg border border-[var(--border)] px-3 text-sm font-medium hover:bg-slate-50">View project</Link>{!hasUpdate ? <Link href={`/updates?projectId=${project.id}`} className="text-xs font-medium text-amber-800 hover:underline">Add first update</Link> : project.healthScore < 70 ? <span className="text-xs text-amber-800">Reporting needs attention</span> : <span className="text-xs text-emerald-700">Reporting on track</span>}</div>
      </article>; })}
      {filtered.length === 0 && <div className="p-10 text-center lg:col-span-2"><p className="font-medium">No projects found</p><p className="mt-1 text-sm text-[var(--gray-mid)]">Try another search or change your filters.</p><button type="button" onClick={() => { setQuery(""); setStatus("all"); }} className="mt-3 text-sm font-medium text-[var(--primary)]">Clear filters</button></div>}
    </div>
  </section>;
}
