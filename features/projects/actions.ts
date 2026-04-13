"use server";

import { revalidatePath } from "next/cache";

import { createProject } from "@/lib/data/demo-store";
import type { ProjectRecord } from "@/types/domain";

export async function createProjectAction(formData: FormData) {
  const vendorIds = formData.getAll("vendorIds").map(String);

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
