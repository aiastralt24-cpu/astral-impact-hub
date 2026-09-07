"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { canCreateProject, canManageProject } from "@/lib/auth/project-permissions";
import { createProject, deleteProject, updateProject } from "@/lib/data/demo-store";
import type { ProjectRecord } from "@/types/domain";

export async function createProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!canCreateProject(session)) {
    return;
  }

  const requestedVendorIds = formData.getAll("vendorIds").map(String);
  const vendorIds = requestedVendorIds;

  await createProject({
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    subCategory: String(formData.get("subCategory") ?? ""),
    state: String(formData.get("state") ?? ""),
    district: String(formData.get("district") ?? ""),
    status: String(formData.get("status") ?? "draft") as ProjectRecord["status"],
    reportingFrequency: String(formData.get("reportingFrequency") ?? "weekly"),
    vendorIds,
    strategicTags: String(formData.get("strategicTags") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    emotionalTags: String(formData.get("emotionalTags") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    budgetInr: Number(formData.get("budgetInr") ?? 0),
    internalOwnerId: String(formData.get("internalOwnerId") ?? ""),
    beneficiaryTarget: Number(formData.get("beneficiaryTarget") ?? 0),
    projectBrief: String(formData.get("projectBrief") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    requireAdminApproval: formData.get("requireAdminApproval") === "on"
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
}

export async function updateProjectAction(formData: FormData) {
  const session = await requireSession();
  const projectId = String(formData.get("projectId") ?? "");
  if (!canManageProject(session, projectId)) {
    return;
  }

  const requestedVendorIds = formData.getAll("vendorIds").map(String);
  const vendorIds = session.role === "vendor"
    ? requestedVendorIds.filter((id) => session.assignedVendorIds.includes(id))
    : requestedVendorIds;
  if (session.role === "vendor" && vendorIds.length === 0) return;

  await updateProject({
    projectId,
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    subCategory: String(formData.get("subCategory") ?? ""),
    state: String(formData.get("state") ?? ""),
    district: String(formData.get("district") ?? ""),
    status: String(formData.get("status") ?? "draft") as ProjectRecord["status"],
    reportingFrequency: String(formData.get("reportingFrequency") ?? "weekly"),
    vendorIds,
    strategicTags: String(formData.get("strategicTags") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    emotionalTags: String(formData.get("emotionalTags") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    budgetInr: Number(formData.get("budgetInr") ?? 0),
    internalOwnerId: session.role === "vendor" ? session.id : String(formData.get("internalOwnerId") ?? ""),
    beneficiaryTarget: Number(formData.get("beneficiaryTarget") ?? 0),
    projectBrief: String(formData.get("projectBrief") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    requireAdminApproval: formData.get("requireAdminApproval") === "on"
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/media");
  revalidatePath("/updates");
}

export async function deleteProjectAction(formData: FormData) {
  const session = await requireSession();
  const projectId = String(formData.get("projectId") ?? "");
  if (!canManageProject(session, projectId)) {
    return;
  }

  await deleteProject(projectId);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/media");
  revalidatePath("/updates");
}
