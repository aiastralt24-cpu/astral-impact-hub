"use client";

import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Drawer({ title, trigger, children, primary = false }: { title: string; trigger: string; children: ReactNode; primary?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return <>
    <button type="button" className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-medium ${primary ? "bg-[var(--primary)] text-white hover:bg-blue-700" : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-slate-50"}`} onClick={() => dialog.current?.showModal()}>{trigger}</button>
    <dialog ref={dialog} aria-labelledby={titleId} className="drawer" onClick={(event) => { if (event.target === event.currentTarget && event.clientX < event.currentTarget.getBoundingClientRect().left) dialog.current?.close(); }}>
      <header className="flex items-center justify-between gap-4 border-b border-[var(--border)] px-6 py-4"><h2 id={titleId} className="text-lg font-semibold">{title}</h2><button type="button" aria-label="Close panel" className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-slate-100" onClick={() => dialog.current?.close()}><X className="h-5 w-5" /></button></header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">{children}</div>
    </dialog>
  </>;
}
