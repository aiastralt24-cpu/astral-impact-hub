import "server-only";
import { hasSupabaseBackend } from "@/lib/env";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getLocalWorkflowDb, persistLocalWorkflowDb } from "@/lib/data/demo-store";
import type { DistributionLogRecord, GeneratedContentRecord } from "@/types/domain";
import { WorkflowError } from "./model";

function dbError(error: { message?: string; code?: string } | null) {
  if (!error) return;
  const message = error.message || "";
  if (message.includes("STALE_CONTENT")) throw new WorkflowError("This draft changed in another session. Refresh before editing or approving it.");
  if (message.includes("DELIVERY_UNRESOLVED")) throw new WorkflowError("A delivery is still in progress or needs reconciliation. Check sharing history before changing this draft.");
  if (message.includes("NOT_APPROVED")) throw new WorkflowError("This version is no longer approved. Refresh and review the latest draft.");
  if (message.includes("ALREADY_ATTEMPTED")) throw new WorkflowError("This version has already been sent or is awaiting confirmation for this destination. Check sharing history; it was not sent again.");
  if (["PGRST202","PGRST204","42703"].includes(error.code || "")) throw new WorkflowError("Communications setup is incomplete. Please contact the system administrator.");
  throw new WorkflowError("Communications could not save this change. Please try again or contact the system administrator.");
}
export async function saveContent(content: GeneratedContentRecord, expectedRevision: number) {
  if (hasSupabaseBackend) {
    const { error } = await createServiceRoleClient().rpc("save_communication", { p_update_id: content.updateId, p_expected_revision: expectedRevision, p_content: content });
    dbError(error); return;
  }
  const db = getLocalWorkflowDb();
  const current = db.generatedContent.find(item => item.updateId === content.updateId);
  if ((current?.workflow?.revision || 0) !== expectedRevision) dbError({message:"STALE_CONTENT"});
  if (db.distributionLog.some(item => item.updateId === content.updateId && ["sending","unknown"].includes(item.status))) dbError({message:"DELIVERY_UNRESOLVED"});
  db.generatedContent = [content, ...db.generatedContent.filter(item => item.updateId !== content.updateId)];
  persistLocalWorkflowDb(db);
}
export async function claimDelivery(content: GeneratedContentRecord, channel: DistributionLogRecord["channel"], key: string, destination: string) {
  if (hasSupabaseBackend) {
    const {data,error} = await createServiceRoleClient().rpc("claim_communication_delivery", {p_content_id:content.id,p_revision:content.workflow?.revision,p_key:key,p_channel:channel,p_destination:destination});
    dbError(error); return String(data);
  }
  const db = getLocalWorkflowDb();
  const current = db.generatedContent.find(item => item.id === content.id);
  if (!current || current.workflow?.status !== "approved" || current.workflow.revision !== content.workflow?.revision) dbError({message:"NOT_APPROVED"});
  const existing = db.distributionLog.find(item => item.idempotencyKey === key);
  if (existing && existing.status !== "failed") dbError({message:"ALREADY_ATTEMPTED"});
  const log: DistributionLogRecord = {id:existing?.id || crypto.randomUUID(),contentId:content.id,updateId:content.updateId,channel,status:"sending",message:"Sending to provider",destination,contentRevision:content.workflow?.revision,idempotencyKey:key,createdAt:new Date().toISOString()};
  db.distributionLog = [log,...db.distributionLog.filter(item => item.id !== log.id)];
  persistLocalWorkflowDb(db); return log.id;
}
export async function finishDelivery(id: string, status: string, message: string, providerMessageId?: string) {
  if (hasSupabaseBackend) {
    const client = createServiceRoleClient();
    const {data:row,error:readError} = await client.from("distribution_log").select("payload").eq("id",id).single(); dbError(readError);
    const {error} = await client.from("distribution_log").update({status,provider_message_id:providerMessageId,payload:{...row?.payload,message},sent_at:["sent","accepted"].includes(status)?new Date().toISOString():null}).eq("id",id); dbError(error); return;
  }
  const db = getLocalWorkflowDb(); const row = db.distributionLog.find(item => item.id === id);
  if (row) Object.assign(row,{status,message,providerMessageId}); persistLocalWorkflowDb(db);
}
export async function recordWhatsAppStatus(providerMessageId: string, status: string) {
  const rank: Record<string,number> = {accepted:0,sent:1,failed:2,delivered:3,read:4};
  if (!(status in rank)) return;
  if (hasSupabaseBackend) {
    const client = createServiceRoleClient();
    const {data,error} = await client.from("distribution_log").select("id,status,payload").eq("provider_message_id",providerMessageId).eq("channel","whatsapp"); dbError(error);
    for (const row of data || []) if ((rank[row.status] ?? -1) < rank[status]) { const {error:e} = await client.from("distribution_log").update({status,payload:{...row.payload,message:status === "failed" ? "WhatsApp could not deliver this message. Confirm recipient eligibility and the 24-hour messaging window before retrying." : `WhatsApp ${status} confirmed by Meta`}}).eq("id",row.id).eq("status",row.status); dbError(e); }
    return;
  }
  const db = getLocalWorkflowDb(); for (const row of db.distributionLog) if(row.channel === "whatsapp" && row.providerMessageId === providerMessageId && (rank[row.status] ?? -1) < rank[status]) Object.assign(row,{status,message:`WhatsApp ${status} confirmed by Meta`}); persistLocalWorkflowDb(db);
}
export async function workflowSetupError(): Promise<string | undefined> {
  if (!hasSupabaseBackend) return process.env.NODE_ENV === "production" ? "Communications are temporarily unavailable. Please contact the system administrator." : undefined;
  const {error} = await createServiceRoleClient().from("generated_content").select("workflow").limit(0);
  if(error) return "Communications setup is incomplete. Please contact the system administrator.";
  return undefined;
}
