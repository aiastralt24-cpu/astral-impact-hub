"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { createUpdate, deleteMediaAssetById, findMediaAsset, getDashboardData, recordApproval } from "@/lib/data/demo-store";
import { deleteMedia, uploadMedia } from "@/lib/media/storage";
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
  mediaFiles: Array<{
    name: string;
    mimeType?: string;
    sizeBytes?: number;
  }>;
}) {
  const session = await requireSession();
  const scopedData = await getDashboardData(session);
  const project = scopedData.projects.find((entry) => entry.id === payload.projectId);
  const vendor = scopedData.vendors.find((entry) => entry.id === payload.vendorId);
  if (!project || !vendor) {
    return;
  }

  const media = await uploadMedia(
    payload.mediaFiles.map((file) => ({
      filename: file.name,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes
    })),
    {
      actor: session,
      project,
      vendor
    }
  );

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
    media
  });

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/media");
}

export async function approvalAction(formData: FormData) {
  const session = await requireSession();
  if (session.role === "vendor") {
    return;
  }
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

export async function deleteMediaAction(formData: FormData) {
  const session = await requireSession();
  const mediaAssetId = String(formData.get("mediaAssetId") ?? "");
  if (!mediaAssetId) {
    return;
  }

  const mediaEntry = await findMediaAsset(mediaAssetId);
  if (!mediaEntry) {
    return;
  }

  const scopedData = await getDashboardData(session);
  const canAccessProject = scopedData.projects.some((project) => project.id === mediaEntry.update.projectId);
  const canAccessVendor = scopedData.vendors.some((vendor) => vendor.id === mediaEntry.update.vendorId);
  const canDelete =
    session.isSuperAdmin ||
    session.role === "admin" ||
    ((session.role === "vendor" || session.role === "project_manager" || session.role === "content_team" || session.role === "leadership") &&
      canAccessProject &&
      canAccessVendor);

  if (!canDelete) {
    return;
  }

  await deleteMedia(mediaEntry.media, { actor: session });
  await deleteMediaAssetById(mediaAssetId);

  revalidatePath("/media");
  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
