"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { createUpdate, recordApproval } from "@/lib/data/demo-store";
import type { ApprovalRecord } from "@/types/domain";

export async function createUpdateAction(payload: {
  projectId: string;
  projectName: string;
  vendorId: string;
  vendorName: string;
  happenedAt: string;
  description: string;
  beneficiariesCount?: number;
  beneficiaryType?: string;
  progressPercent: number;
  workDuration?: string;
  whyItMatters?: string;
  highlightMoment?: string;
  quote?: string;
  challenges?: string;
  nextSteps?: string;
  socialMediaWorthy: boolean;
  urgent: boolean;
  documentationOnly: boolean;
  sensitiveContent: boolean;
  mediaNames: string[];
}) {
  const session = await requireSession();

  await createUpdate({
    projectId: payload.projectId,
    projectName: payload.projectName,
    vendorId: payload.vendorId,
    vendorName: payload.vendorName,
    submittedByUserId: session.id,
    happenedAt: payload.happenedAt,
    description: payload.description,
    beneficiariesCount: payload.beneficiariesCount,
    beneficiaryType: payload.beneficiaryType,
    progressPercent: payload.progressPercent,
    workDuration: payload.workDuration,
    whyItMatters: payload.whyItMatters,
    highlightMoment: payload.highlightMoment,
    quote: payload.quote,
    challenges: payload.challenges,
    nextSteps: payload.nextSteps,
    socialMediaWorthy: payload.socialMediaWorthy,
    urgent: payload.urgent,
    documentationOnly: payload.documentationOnly,
    sensitiveContent: payload.sensitiveContent,
    media: payload.mediaNames.map((name) => ({ id: crypto.randomUUID(), name }))
  });

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export async function approvalAction(formData: FormData) {
  const session = await requireSession();
  await recordApproval({
    updateId: String(formData.get("updateId") ?? ""),
    reviewerId: session.id,
    action: String(formData.get("action") ?? "approve") as ApprovalRecord["action"],
    stage: String(formData.get("stage") ?? "manager") as ApprovalRecord["stage"],
    comment: String(formData.get("comment") ?? "")
  });

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
