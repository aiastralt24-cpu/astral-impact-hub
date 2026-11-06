"use client";

import { Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";

import { deleteMediaAction } from "@/features/updates/actions";

export function DeleteMediaButton({ mediaAssetId, fileName }: { mediaAssetId: string; fileName: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, pending]);

  function confirmDelete() {
    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("mediaAssetId", mediaAssetId);
      const result = await deleteMediaAction(formData);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const dialog = open ? (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-4 backdrop-blur-sm sm:items-center" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) setOpen(false); }}>
      <div role="dialog" aria-modal="true" aria-labelledby={`delete-media-${mediaAssetId}`} className="w-full max-w-md rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_30px_80px_rgba(15,23,42,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-700"><Trash2 className="h-5 w-5" /></div>
          <button type="button" onClick={() => setOpen(false)} disabled={pending} aria-label="Close confirmation" className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--gray-mid)] hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>
        <h2 id={`delete-media-${mediaAssetId}`} className="mt-5 font-display text-2xl font-black tracking-[-0.03em] text-[var(--foreground)]">Delete this media file?</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--gray-mid)]">This permanently removes <span className="font-semibold text-[var(--foreground)]">{fileName}</span> from the update and media library. This action cannot be undone.</p>
        {error ? <p role="alert" className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setOpen(false)} disabled={pending} className="h-11 rounded-xl border border-[var(--border)] px-5 text-sm font-semibold text-[var(--foreground)] hover:bg-slate-50">Keep file</button>
          <button type="button" onClick={confirmDelete} disabled={pending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-70">{pending ? <><Loader2 className="h-4 w-4 animate-spin" />Deleting...</> : <><Trash2 className="h-4 w-4" />Delete permanently</>}</button>
        </div>
      </div>
    </div>
  ) : null;

  return <>
    <button type="button" onClick={() => { setError(""); setOpen(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" />Delete media</button>
    {mounted && dialog ? createPortal(dialog, document.body) : null}
  </>;
}
