"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { contentAction } from "./actions";
import { Badge } from "@/components/ui/badge";
import { isPlaceholder } from "@/lib/communications/model";
import type { GeneratedContentRecord, UpdateRecord } from "@/types/domain";

const fields = [
  ["emotionalHook","Opening message",500], ["instagramCaptionShort","Instagram · short caption",2200],
  ["instagramCaptionLong","Instagram · full caption",2200], ["telegramUpdate","Telegram message",4096],
  ["whatsappDigest","WhatsApp message",4096], ["csrSummary","CSR summary",5000],
  ["reelScript","Reel script",5000], ["carouselBreakdown","Carousel slides · one per line",10000]
] as const;
const button = "min-h-10 rounded-lg border border-[var(--border)] px-4 text-sm font-medium disabled:opacity-50";
function ContentEditor({update,content,canApprove,aiMissing}:{update:UpdateRecord;content?:GeneratedContentRecord;canApprove:boolean;aiMissing:string[]}) {
  const [result,action,pending] = useActionState(contentAction,{ok:false,message:""});
  const [dirty,setDirty] = useState(false);
  const [copied,setCopied] = useState("");
  const legacy = content && isPlaceholder(content);
  const revision = content?.workflow?.revision || 0;
  const status = legacy ? "Unavailable" : content?.workflow?.status === "approved" ? "Approved for sharing" : content?.workflow?.status === "in_review" ? "Awaiting content approval" : content ? "Draft" : "No draft";
  return <article className="rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{update.projectName}</h2><p className="mt-1 text-xs text-[var(--gray-mid)]">Update · {update.happenedAt}{revision>0 && ` · Draft version ${revision}`}</p></div><Badge variant={content?.workflow?.status === "approved" ? "approved":"neutral"}>{status}</Badge></div>
    <details className="mt-4 text-sm"><summary className="font-medium text-[var(--primary)]">View source update</summary><p className="mt-2 whitespace-pre-wrap leading-6 text-[var(--gray-mid)]">{update.description}</p></details>
    {legacy && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">The previous generation returned placeholder content. It cannot be approved or shared. Connect AI and generate a new draft.</p>}
    {result.message && <p role={result.ok?"status":"alert"} className={`mt-4 rounded-lg p-3 text-sm ${result.ok?"bg-emerald-50 text-emerald-800":"bg-rose-50 text-rose-800"}`}>{result.message}</p>}
    {content?.workflow?.reviewNote && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm">Changes requested: {content.workflow.reviewNote}</p>}
    <form action={action} className="mt-5 space-y-5">
      <input type="hidden" name="updateId" value={update.id}/><input type="hidden" name="revision" value={revision}/>
      {content && !legacy && <>
        <p className="text-sm text-[var(--gray-mid)]">Check every claim against the source. Saving edits removes approval and creates a new draft version.</p>
        <div className="grid gap-5 lg:grid-cols-2">{fields.map(([key,label,max]) => <label key={key} className="grid gap-2 text-sm font-medium"><span>{label}</span><textarea name={key} defaultValue={key === "carouselBreakdown" ? content.carouselBreakdown.join("\n") : content[key]} maxLength={max} onChange={()=>setDirty(true)} className="min-h-32 w-full resize-y rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-normal leading-6"/><button type="button" className="w-fit text-xs text-[var(--primary)]" onClick={async event => {const value=event.currentTarget.parentElement?.querySelector('textarea')?.value || "";try {await navigator.clipboard.writeText(value);setCopied(label);}catch{setCopied("Copy unavailable. Select the text and copy manually.");}}}>Copy text</button></label>)}</div>
        {copied && <p role="status" className="text-xs text-[var(--gray-mid)]">{copied.startsWith("Copy unavailable")?copied:`Copied ${copied}`}</p>}
        <label className="grid max-w-lg gap-2 text-sm font-medium">Instagram photo<select name="instagramMediaId" defaultValue={content.workflow?.instagramMediaId || ""} onChange={()=>setDirty(true)} className="h-11 border border-[var(--border)] px-3"><option value="">No photo selected</option>{update.media.filter(media=>media.mimeType === "image/jpeg").map(media=><option key={media.id} value={media.id}>{media.name}</option>)}</select><span className="text-xs font-normal text-[var(--gray-mid)]">Select a JPEG attached to this update. The selected photo is included in approval.</span></label>
      </>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" name="intent" value="generate" disabled={pending || aiMissing.length>0} onClick={event => {if(content && !legacy && !window.confirm("Replace this draft with a newly generated version? This removes its approval.")) event.preventDefault();}} className={`${button} ${!content || legacy?"bg-[var(--primary)] text-white":"bg-white"}`}>{pending ? "Working…" : content ? "Regenerate draft" : "Generate AI draft"}</button>
        {content && !legacy && <><button name="intent" value="save" disabled={pending} className={`${button} bg-[var(--primary)] text-white`}>Save draft</button>{content.workflow?.status === "draft" && <button name="intent" value="submit" disabled={pending||dirty} className={button}>Submit for approval</button>}{content.workflow?.status === "approved" && <Link href="/distribution" className={`${button} inline-flex items-center`}>Review and share</Link>}</>}
      </div>
      {dirty && <p className="text-xs text-amber-800">Unsaved edits · save before submitting or approving.</p>}
      {canApprove && content?.workflow?.status === "in_review" && !legacy && <div className="space-y-3 border-t border-[var(--border)] pt-5"><h3 className="font-semibold">Content review</h3><label className="grid gap-2 text-sm">Review note<textarea name="reviewNote" maxLength={1000} placeholder="Explain changes if returning this draft" className="min-h-20 border border-[var(--border)] p-3"/></label><div className="flex gap-3"><button name="intent" value="approve" disabled={pending||dirty} className={`${button} bg-emerald-700 text-white`}>Approve this version</button><button name="intent" value="return" disabled={pending||dirty} className={button}>Request changes</button></div></div>}
    </form>
  </article>;
}
export function ContentManagement({updates,generatedContent,canApprove=false,aiMissing=[]}:{updates:UpdateRecord[];generatedContent:GeneratedContentRecord[];canApprove?:boolean;aiMissing?:string[]}) {
  const eligible = updates.filter(update=>["approved","published"].includes(update.status));
  return <div className="space-y-5">{aiMissing.length>0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-semibold">AI generation is temporarily unavailable</p><p className="mt-1">Please contact the system administrator. Existing drafts can still be edited and reviewed.</p></div>}{!eligible.length && <p className="rounded-xl border border-[var(--border)] bg-white p-8 text-center text-sm">Approved project updates will appear here.</p>}{eligible.map(update=>{const content=generatedContent.filter(item=>item.updateId===update.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];return <ContentEditor key={`${update.id}:${content?.workflow?.revision || 0}`} update={update} content={content} canApprove={canApprove} aiMissing={aiMissing}/>;})}</div>;
}
