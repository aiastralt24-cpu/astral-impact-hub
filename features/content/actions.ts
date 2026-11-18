"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { editDraft, generateDraft, reviewDraft } from "@/lib/communications/service";
import { publicError, WorkflowError } from "@/lib/communications/model";

export type ContentActionResult = {ok:boolean;message:string};
export async function contentAction(_previous: ContentActionResult, form: FormData): Promise<ContentActionResult> {
  const session = await requireSession();
  try {
    const updateId = String(form.get("updateId") || "");
    const revision = Number(form.get("revision") || 0);
    if (!Number.isSafeInteger(revision) || revision < 0) throw new WorkflowError("Invalid draft version. Refresh this page.");
    const intent = String(form.get("intent"));
    if (intent === "generate") await generateDraft(session,updateId,revision);
    else if (intent === "save") {
      const fields = Object.fromEntries(["emotionalHook","instagramCaptionShort","instagramCaptionLong","reelScript","telegramUpdate","whatsappDigest","csrSummary"].map(key => [key,String(form.get(key)||"")]));
      await editDraft(session,updateId,revision,{...fields,carouselBreakdown:String(form.get("carouselBreakdown")||"").split("\n").map(line=>line.trim()).filter(Boolean)},String(form.get("instagramMediaId")||""));
    } else if (["submit","approve","return"].includes(intent)) await reviewDraft(session,updateId,revision,intent as "submit"|"approve"|"return",String(form.get("reviewNote")||""));
    else throw new WorkflowError("Unknown content action.");
    for (const path of ["/content","/distribution","/dashboard","/analytics"]) revalidatePath(path);
    return {ok:true,message:intent === "generate" ? "AI draft generated. Review all facts before approval." : intent === "save" ? "Draft saved. Approval is required for this version." : intent === "approve" ? "This version is approved for sharing." : intent === "return" ? "Changes requested. The draft is open for editing." : "Submitted for administrator review."};
  } catch(error) {return {ok:false,message:publicError(error)};}
}
