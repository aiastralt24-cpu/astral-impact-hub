"use client";
import { useId, useState, type ReactNode } from "react";
export function ViewTabs({ firstLabel, secondLabel, first, second, thirdLabel, third, initialTab = 0 }: { firstLabel: string; secondLabel: string; first: ReactNode; second: ReactNode; thirdLabel?: string; third?: ReactNode; initialTab?: number }) {
  const [selected, setSelected] = useState(initialTab);
  const id = useId();
  const labels = thirdLabel ? [firstLabel, secondLabel, thirdLabel] : [firstLabel, secondLabel];
  const panels = thirdLabel ? [first, second, third] : [first, second];
  return <div className="space-y-5"><div role="tablist" aria-label="Update views" className="flex flex-wrap gap-4 border-b border-[var(--border)]">{labels.map((label, index) => <button key={label} type="button" role="tab" id={`${id}-tab-${index}`} aria-controls={`${id}-panel-${index}`} aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => { if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) { event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? labels.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + labels.length) % labels.length; setSelected(next); document.getElementById(`${id}-tab-${next}`)?.focus(); } }} className={`border-b-2 px-1 py-3 text-sm font-medium ${selected === index ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--gray-mid)]"}`}>{label}</button>)}</div>{panels.map((panel,index) => <div key={index} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index}>{panel}</div>)}</div>;
}
