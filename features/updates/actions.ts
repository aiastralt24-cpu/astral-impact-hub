"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { createUpdate, deleteMediaAssetById, findMediaAsset, getDashboardData, recordApproval } from "@/lib/data/demo-store";
import { deleteMedia, uploadMedia } from "@/lib/media/storage";
import type { ApprovalRecord } from "@/types/domain";

export type CreateUpdateResult = { ok: true; message: string } | { ok: false; message: string };

export async function createUpdateAction(formData: FormData): Promise<CreateUpdateResult> {
  try {
    const session = await requireSession();
    const projectId = String(formData.get("projectId") ?? "");
    const vendorId = String(formData.get("vendorId") ?? "");
    const description = String(formData.get("description") ?? "").trim();
    const progressPercent = Number(formData.get("progressPercent") ?? 0);
    if (!projectId || !vendorId) return { ok: false, message: "Select a valid project and partner." };
    if (description.length < 21) return { ok: false, message: "Describe the activity in at least 21 characters." };
    if (!Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100) {
      return { ok: false, message: "Progress must be between 0 and 100." };
    }

    const scopedData = await getDashboardData(session);
    const project = scopedData.projects.find((entry) => entry.id === projectId);
    const vendor = scopedData.vendors.find((entry) => entry.id === vendorId && entry.assignedProjectIds.includes(projectId));
    if (!project || !vendor) return { ok: false, message: "This project or partner is no longer available to your account." };
    const files = formData.getAll("mediaFiles").filter((entry): entry is File => entry instanceof File && entry.size > 0);
    const invalidFile = files.find((file) => !file.type.startsWith("image/") && !file.type.startsWith("video/"));
    if (invalidFile) return { ok: false, message: `${invalidFile.name} is not a supported image or video.` };
    const oversizedFile = files.find((file) => file.size > 25 * 1024 * 1024);
    if (oversizedFile) return { ok: false, message: `${oversizedFile.name} is larger than the 25 MB limit.` };

    const media = await uploadMedia(
      await Promise.all(files.map(async (file) => ({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      data: await file.arrayBuffer()
    }))),
    {
      actor: session,
      project,
      vendor
    }
  );

    await createUpdate({
    projectId,
    projectName: project.name,
    vendorId,
    vendorName: vendor.name,
    submittedByUserId: session.id,
    happenedAt: String(formData.get("happenedAt") ?? new Date().toISOString().slice(0, 10)),
    description,
    beneficiariesCount: formData.get("beneficiariesCount") ? Number(formData.get("beneficiariesCount")) : undefined,
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
    media
  });

  revalidatePath("/updates");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/media");
    return { ok: true, message: "Update submitted successfully." };
  } catch (error) {
    console.error("Update submission failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "The update could not be submitted. Please try again." };
  }
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
