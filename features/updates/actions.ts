"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { createUpdate, deleteMediaAssetById, findMediaAsset, getDashboardData, recordApproval } from "@/lib/data/demo-store";
import { getUpdateErrorMessage, validateBeneficiaryCount } from "@/lib/domain/update-validation";
import { MAX_MEDIA_FILES_PER_UPDATE, MAX_MEDIA_FILE_BYTES, formatMediaLimit } from "@/lib/media/limits";
import { deleteMedia, prepareSignedMediaUploads, removeUploadedMedia, verifySignedMediaUploads, type MediaUploadDescriptor } from "@/lib/media/storage";
import type { ApprovalRecord, UpdateMediaRecord } from "@/types/domain";

export type CreateUpdateResult = { ok: true; message: string } | { ok: false; message: string };

export type PrepareMediaResult =
  | { ok: true; uploads: Awaited<ReturnType<typeof prepareSignedMediaUploads>> }
  | { ok: false; message: string };

async function resolveUpdateScope(projectId: string, vendorId: string) {
  const session = await requireSession();
  const scopedData = await getDashboardData(session);
  const project = scopedData.projects.find((entry) => entry.id === projectId);
  const vendor = scopedData.vendors.find((entry) => entry.id === vendorId && project?.vendorIds.includes(entry.id));
  const isInternallyManaged = Boolean(project && project.vendorIds.length === 0);
  if (!project || (!vendor && !isInternallyManaged)) throw new Error("This project or CSR Associate is no longer available to your account.");
  if (isInternallyManaged && session.role === "vendor") throw new Error("Only the Astral Foundation team can update an internally managed project.");
  return { session, project, vendor };
}

export async function prepareMediaUploadsAction(
  projectId: string,
  vendorId: string,
  files: MediaUploadDescriptor[]
): Promise<PrepareMediaResult> {
  try {
    if (files.length > MAX_MEDIA_FILES_PER_UPDATE) return { ok: false, message: `Select no more than ${MAX_MEDIA_FILES_PER_UPDATE} files per update.` };
    const invalidFile = files.find((file) => file.sizeBytes <= 0 || file.sizeBytes > MAX_MEDIA_FILE_BYTES || (!file.mimeType.startsWith("image/") && !file.mimeType.startsWith("video/")));
    if (invalidFile) return { ok: false, message: `${invalidFile.filename} must be a supported image or video no larger than ${formatMediaLimit(MAX_MEDIA_FILE_BYTES)}.` };
    const context = await resolveUpdateScope(projectId, vendorId);
    return { ok: true, uploads: await prepareSignedMediaUploads(files, { actor: context.session, project: context.project, vendor: context.vendor }) };
  } catch (error) {
    console.error("Media upload preparation failed", error);
    return { ok: false, message: getUpdateErrorMessage(error) };
  }
}

export async function createUpdateAction(formData: FormData): Promise<CreateUpdateResult> {
  let uploadedMedia: UpdateMediaRecord[] = [];
  try {
    const projectId = String(formData.get("projectId") ?? "");
    const vendorId = String(formData.get("vendorId") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const progressPercent = Number(formData.get("progressPercent") ?? 0);
    const beneficiariesCountValue = String(formData.get("beneficiariesCount") ?? "");
    if (!projectId) return { ok: false, message: "Select a valid project." };
    if (!description) return { ok: false, message: "Please describe what happened during the activity." };
    if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      return { ok: false, message: "Progress must be between 0 and 100." };
    }
    const beneficiaryCountError = validateBeneficiaryCount(beneficiariesCountValue);
    if (beneficiaryCountError) return { ok: false, message: beneficiaryCountError };

    const { session, project, vendor } = await resolveUpdateScope(projectId, vendorId);
    const rawMedia = String(formData.get("uploadedMedia") ?? "[]");
    const parsedMedia = JSON.parse(rawMedia) as UpdateMediaRecord[];
    if (!Array.isArray(parsedMedia) || parsedMedia.length > MAX_MEDIA_FILES_PER_UPDATE) throw new Error("Invalid media selection.");
    uploadedMedia = await verifySignedMediaUploads(parsedMedia, { actor: session, project, vendor });

    await createUpdate({
    projectId,
    projectName: project.name,
    vendorId,
    vendorName: vendor?.name ?? "Managed internally",
    submittedByUserId: session.id,
    happenedAt: String(formData.get("happenedAt") ?? new Date().toISOString().slice(0, 10)),
    description,
    beneficiariesCount: beneficiariesCountValue ? Number(beneficiariesCountValue) : undefined,
    beneficiaryType: String(formData.get("beneficiaryType") ?? ""),
    progressPercent,
    workDuration: String(formData.get("workDuration") ?? ""),
    whyItMatters: String(formData.get("whyItMatters") ?? ""),
    highlightMoment: String(formData.get("highlightMoment") ?? ""),
    quote: String(formData.get("quote") ?? ""),
    challenges: String(formData.get("challenges") ?? ""),
    nextSteps: String(formData.get("nextSteps") ?? ""),
    socialMediaWorthy: formData.get("socialMediaWorthy") === "true",
    urgent: formData.get("urgent") === "true",
    documentationOnly: formData.get("documentationOnly") === "true",
    sensitiveContent: formData.get("sensitiveContent") === "true",
    media: uploadedMedia
  });

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/media");
    return { ok: true, message: "Update submitted successfully." };
  } catch (error) {
    console.error("Update submission failed", error);
    await removeUploadedMedia(uploadedMedia);
    return { ok: false, message: getUpdateErrorMessage(error) };
  }
}

export async function approvalAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "project_manager" && session.role !== "content_team") {
    return;
  }
  const updateId = String(formData.get("updateId") ?? "");
  const scopedData = await getDashboardData(session);
  if (!scopedData.updates.some((update) => update.id === updateId)) return;
  await recordApproval({
    updateId,
    reviewerId: session.id,
    action: String(formData.get("action") ?? "approve") as ApprovalRecord["action"],
    stage: String(formData.get("stage") ?? "manager") as ApprovalRecord["stage"],
    comment: String(formData.get("comment") ?? "")
  });

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}

export type DeleteMediaResult = { ok: true; message: string } | { ok: false; message: string };

export async function deleteMediaAction(formData: FormData): Promise<DeleteMediaResult> {
  try {
    const session = await requireSession();
    const mediaAssetId = String(formData.get("mediaAssetId") ?? "");
    if (!mediaAssetId) return { ok: false, message: "The media file could not be identified." };

    const mediaEntry = await findMediaAsset(mediaAssetId);
    if (!mediaEntry) return { ok: false, message: "This media file no longer exists. Refresh the page and try again." };

    const scopedData = await getDashboardData(session);
    const canAccessProject = scopedData.projects.some((project) => project.id === mediaEntry.update.projectId);
    const canAccessVendor = !mediaEntry.update.vendorId || scopedData.vendors.some((vendor) => vendor.id === mediaEntry.update.vendorId);
    const canDelete =
      session.isSuperAdmin ||
      session.role === "admin" ||
      ((session.role === "vendor" || session.role === "project_manager" || session.role === "content_team" || session.role === "leadership") &&
        canAccessProject &&
        canAccessVendor);

    if (!canDelete) return { ok: false, message: "You do not have permission to delete this media file." };

    await deleteMedia(mediaEntry.media, { actor: session });
    await deleteMediaAssetById(mediaAssetId);

    revalidatePath("/media");
    revalidatePath("/updates");
    revalidatePath("/dashboard");
    revalidatePath("/analytics");
    return { ok: true, message: "Media deleted successfully." };
  } catch (error) {
    console.error("Media deletion failed", error);
    return { ok: false, message: "The media file could not be deleted. Please try again." };
  }
}
