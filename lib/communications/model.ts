import type { GeneratedContentRecord, ProjectRecord, UpdateRecord } from "../../types/domain";

export class WorkflowError extends Error {
  constructor(message: string, public uncertain = false) { super(message); this.name = "WorkflowError"; }
}
export function isPlaceholder(content: Partial<GeneratedContentRecord>) {
  return [content.emotionalHook, content.instagramCaptionLong, content.telegramUpdate, content.whatsappDigest].some(value => /pending live AI generation|caption placeholder|Telegram update placeholder|WhatsApp digest placeholder/i.test(value || ""));
}
export function contentReady(content: GeneratedContentRecord) { return !isPlaceholder(content) && content.workflow?.status === "approved" && Boolean(content.workflow.approvedBy && content.workflow.approvedAt); }
export function publicError(error: unknown) { return error instanceof WorkflowError ? error.message : "The request could not be completed. Refresh and try again. If it continues, ask your administrator to check the connection and database setup."; }
