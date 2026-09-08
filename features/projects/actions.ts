"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { canCreateProject, canManageProject } from "@/lib/auth/project-permissions";
import { createProject, deleteProject, getDashboardData, updateProject } from "@/lib/data/demo-store";
import type { ProjectRecord } from "@/types/domain";

export async function createProjectAction(formData: FormData) {
  const session = await requireSession();
  if (!canCreateProject(session)) {
    return;
  }

  const managementType = String(formData.get("managementType") ?? "");
  const requestedVendorIds = formData.getAll("vendorIds").map(String);
  if (managementType !== "csr" && managementType !== "internal") return;
  if (managementType === "csr" && requestedVendorIds.length === 0) return;
  const vendorIds = managementType === "internal" ? [] : requestedVendorIds;

  const project = await createProject({
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    subCategory: String(formData.get("subCategory") ?? ""),
    state: String(formData.get("state") ?? ""),
    district: String(formData.get("district") ?? ""),
    status: String(formData.get("status") ?? "draft") as ProjectRecord["status"],
    reportingFrequency: "weekly",
    vendorIds,
    strategicTags: String(formData.get("strategicTags") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    emotionalTags: String(formData.get("emotionalTags") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    budgetInr: 0,
    internalOwnerId: String(formData.get("internalOwnerId") ?? ""),
    beneficiaryTarget: Number(formData.get("beneficiaryTarget") ?? 0),
    projectBrief: String(formData.get("projectBrief") ?? ""),
    startDate: String(formData.get("startDate") ?? ""),
    endDate: String(formData.get("endDate") ?? ""),
    requireAdminApproval: formData.get("requireAdminApproval") === "on"
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  if (project) redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(formData: FormData) {
  const session = await requireSession();
  const projectId = String(formData.get("projectId") ?? "");
  const scopedData = await getDashboardData(session);
  const existingProject = scopedData.projects.find((project) => project.id === projectId);
  if (!existingProject) return;
  if (!canManageProject(session, projectId, existingProject.internalOwnerId)) return;

  const managementType = session.role === "vendor" ? "csr" : String(formData.get("managementType") ?? "");
  const requestedVendorIds = formData.getAll("vendorIds").map(String);
  if (managementType !== "csr" && managementType !== "internal") return;
  if (managementType === "csr" && requestedVendorIds.length === 0) return;
  const vendorIds = session.role === "vendor"
    ? requestedVendorIds.filter((id) => session.assignedVendorIds.includes(id))
    : managementType === "internal" ? [] : requestedVendorIds;
  if (session.role === "vendor" && vendorIds.length === 0) return;

  await updateProject({
    projectId,
    name: String(formData.get("name") ?? ""),
    category: String(formData.get("category") ?? ""),
    subCategory: String(formData.get("subCategory") ?? ""),
    state: String(formData.get("state") ?? ""),
    district: String(formData.get("district") ?? ""),
    status: String(formData.get("status") ?? "draft") as ProjectRecord["status"],
    reportingFrequency: existingProject.reportingFrequency,
    vendorIds,
    strategicTags: String(formData.get("strategicTags") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    emotionalTags: String(formData.get("emotionalTags") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    budgetInr: existingProject.budgetInr,
    internalOwnerId: String(formData.get("internalOwnerId") ?? ""),
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
  const scopedData = await getDashboardData(session);
  const existingProject = scopedData.projects.find((project) => project.id === projectId);
  if (!existingProject || !canManageProject(session, projectId, existingProject.internalOwnerId)) return;

  await deleteProject(projectId);
  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/media");
  revalidatePath("/updates");
}
