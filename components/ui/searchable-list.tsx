"use client";
import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";

export function SearchableList({ entries, label, action }: { entries: { id: string; search: string; content: ReactNode }[]; label: string; action?: ReactNode }) {
  const [query, setQuery] = useState("");
  const filtered = entries.filter(entry => entry.search.toLowerCase().includes(query.trim().toLowerCase()));
  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><label className="relative block w-full sm:max-w-sm"><Search aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><span className="sr-only">Search {label}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${label}`} className="h-10 w-full rounded-lg border border-[var(--border)] bg-white pl-10 pr-3" /></label>{action}<p aria-live="polite" className="text-xs text-[var(--gray-mid)]">{filtered.length} {filtered.length === 1 ? label.replace(/s$/, "") : label}</p></div>
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white divide-y divide-[var(--border)]">{filtered.map(entry => <div key={entry.id}>{entry.content}</div>)}{filtered.length === 0 && <div className="p-10 text-center"><p className="font-medium">{query ? "No matches found" : `No ${label} yet`}</p><p className="mt-1 text-sm text-[var(--gray-mid)]">{query ? "Try a different name or clear your search." : "New entries will appear here."}</p>{query && <button type="button" className="mt-4 text-sm font-medium text-[var(--primary)]" onClick={() => setQuery("")}>Clear search</button>}</div>}</div>
  </section>;
}
