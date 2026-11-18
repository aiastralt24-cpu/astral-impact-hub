import "server-only";
import { createHash } from "node:crypto";
import { getDashboardData } from "@/lib/data/demo-store";
import { hasSupabaseBackend } from "@/lib/env";
import { AnthropicContentProvider } from "@/lib/ai/provider";
import { generatedContentSchema } from "@/types/contracts";
import type { AppUser, DistributionChannel, GeneratedContentRecord } from "@/types/domain";
import { getMediaAccessUrl } from "@/lib/media/storage";
import { contentReady, isPlaceholder, WorkflowError } from "./model";
import { sourceHash } from "./source";
import { claimDelivery, finishDelivery, saveContent } from "./repository";
import { deliveryDestination, sendToChannel } from "./transport";

async function context(user: AppUser, updateId: string) {
  if (!["admin","content_team"].includes(user.role)) throw new WorkflowError("You do not have permission to manage communications.");
  if (!hasSupabaseBackend && process.env.NODE_ENV === "production") throw new WorkflowError("Connect a durable Supabase database before generating or sharing content in production.");
  const data = await getDashboardData(user);
  const update = data.updates.find(item => item.id === updateId);
  const project = data.projects.find(item => item.id === update?.projectId);
  if (!update || !project) throw new WorkflowError("This update is unavailable or outside your assigned access.");
  if (!["approved","published"].includes(update.status)) throw new WorkflowError("The project update must be approved before preparing or sharing communications.");
  if (update.sensitiveContent) throw new WorkflowError("This update is marked sensitive. Resolve its sensitivity through the project review process before generating or publishing communications.");
  const content = data.generatedContent.filter(item => item.updateId === updateId).sort((a,b)=>b.createdAt.localeCompare(a.createdAt))[0];
  return {data,update,project,content};
}
export async function generateDraft(user: AppUser, updateId: string, expectedRevision: number) {
  const {project,update,content} = await context(user,updateId);
  if ((content?.workflow?.revision || 0) !== expectedRevision) throw new WorkflowError("The draft changed. Refresh before generating again.");
  const fingerprint = sourceHash(project,update);
  const generated = await new AnthropicContentProvider().generateContent({projectContext:project.projectBrief || project.name,updateData:JSON.stringify({projectName:project.name,date:update.happenedAt,description:update.description,peopleReached:update.beneficiariesCount,outcomeType:update.beneficiaryType,progress:update.progressPercent,whyItMatters:update.whyItMatters,highlight:update.highlightMoment,quote:update.quote,challenges:update.challenges,nextSteps:update.nextSteps}),campaignContext:project.emotionalTags.join(", "),requestedOutputs:Object.keys(generatedContentSchema.shape)});
  const latest = await context(user,updateId);
  if (fingerprint !== sourceHash(latest.project,latest.update)) throw new WorkflowError("The source update changed during generation. Generate again using the latest facts.");
  await saveContent({id:content?.id || crypto.randomUUID(),updateId,projectName:project.name,vendorName:update.vendorName,createdAt:content?.createdAt || new Date().toISOString(),...generated,workflow:{revision:expectedRevision+1,status:"draft",sourceHash:fingerprint,sourceUpdatedAt:update.updatedAt,model:process.env.ANTHROPIC_MODEL,editedBy:user.id,updatedAt:new Date().toISOString()}},expectedRevision);
}
export async function editDraft(user: AppUser, updateId: string, expectedRevision: number, fields: unknown, instagramMediaId: string) {
  const {project,update,content} = await context(user,updateId);
  if (!content) throw new WorkflowError("Generate a draft first.");
  const result = generatedContentSchema.safeParse(fields);
  if (!result.success) throw new WorkflowError(`Check ${result.error.issues[0]?.path.join(".")}: ${result.error.issues[0]?.message}`);
  if (isPlaceholder(result.data)) throw new WorkflowError("Placeholder content cannot be saved or approved. Generate a real draft first.");
  if (instagramMediaId && !update.media.some(item => item.id === instagramMediaId && item.mimeType === "image/jpeg")) throw new WorkflowError("Choose a JPEG photo attached to this update.");
  await saveContent({...content,...result.data,workflow:{revision:expectedRevision+1,status:"draft",sourceHash:sourceHash(project,update),sourceUpdatedAt:update.updatedAt,model:content.workflow?.model,instagramMediaId:instagramMediaId || undefined,editedBy:user.id,updatedAt:new Date().toISOString()}},expectedRevision);
}
export async function reviewDraft(user: AppUser, updateId: string, expectedRevision: number, decision: "submit"|"approve"|"return", note: string) {
  const {project,update,content} = await context(user,updateId);
  if (!content || isPlaceholder(content) || !content.workflow) throw new WorkflowError("Generate and save a real draft before review.");
  if (content.workflow.sourceHash !== sourceHash(project,update)) throw new WorkflowError("The project update has changed. Regenerate or edit and save the draft before review.");
  if (!generatedContentSchema.safeParse(content).success) throw new WorkflowError("This content is incomplete. Edit and save all required drafts first.");
  if (decision !== "submit" && user.role !== "admin") throw new WorkflowError("Only an administrator can approve content or request changes.");
  if (decision === "submit" && content.workflow.status !== "draft") throw new WorkflowError("Only a draft can be submitted for review.");
  if (decision !== "submit" && content.workflow.status !== "in_review") throw new WorkflowError("Submit this draft for review first.");
  if (decision === "return" && !note.trim()) throw new WorkflowError("Add a note explaining the requested changes.");
  const approved = decision === "approve";
  await saveContent({...content,workflow:{...content.workflow,revision:expectedRevision+1,status:approved?"approved":decision === "submit"?"in_review":"draft",updatedAt:new Date().toISOString(),approvedBy:approved?user.id:undefined,approvedAt:approved?new Date().toISOString():undefined,reviewNote:decision === "return"?note.trim().slice(0,1000):undefined}},expectedRevision);
}
export async function shareDraft(user: AppUser, updateId: string, contentId: string, revision: number, channel: DistributionChannel, recipient?: string) {
  const {project,update,content} = await context(user,updateId);
  if (!content || content.id !== contentId || !contentReady(content) || content.workflow?.revision !== revision) throw new WorkflowError("Only the latest approved content version can be shared. Refresh and check approval.");
  if (sourceHash(project,update) !== content.workflow.sourceHash) throw new WorkflowError("The source update changed after approval. Edit or regenerate the draft and approve it again.");
  const destination = deliveryDestination(channel,recipient);
  let imageUrl: string | undefined;
  if (channel === "instagram") {
    const media = update.media.find(item => item.id === content.workflow?.instagramMediaId && item.mimeType === "image/jpeg");
    if (!media) throw new WorkflowError("No Instagram photo was approved. Select a JPEG in the draft, save it, and approve the new version.");
    imageUrl = await getMediaAccessUrl(media,{actor:user});
    if (!imageUrl) throw new WorkflowError("The approved Instagram photo is unavailable. Check media storage before sharing.");
  }
  const key = createHash("sha256").update(`${content.id}:${revision}:${channel}:${destination}`).digest("hex");
  const logId = await claimDelivery(content,channel,key,destination);
  let receipt;
  try { receipt = await sendToChannel(channel,content,destination,imageUrl); }
  catch(error) {
    const uncertain = !(error instanceof WorkflowError) || error.uncertain;
    await finishDelivery(logId,uncertain?"unknown":"failed",error instanceof WorkflowError?error.message:"Delivery needs verification. Check the destination before retrying.");
    throw error;
  }
  try { await finishDelivery(logId,receipt.status,receipt.message,receipt.id); }
  catch { throw new WorkflowError(`The provider confirmed receipt ${receipt.id}, but saving its status failed. Do not resend; ask an administrator to reconcile sharing history.`,true); }
  return receipt.message;
}
