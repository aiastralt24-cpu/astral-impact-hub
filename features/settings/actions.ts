"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { createWorkspaceUser, deleteWorkspaceUser, updateWorkspaceUser } from "@/lib/data/demo-store";
import type { AppUser } from "@/types/domain";

export async function createWorkspaceUserAction(formData: FormData) {
  const session = await requireSession();
  if (!session.isSuperAdmin && session.role !== "admin") {
    return;
  }

  const accountType = String(formData.get("accountType") ?? "employee");
  const vendorId = String(formData.get("vendorId") ?? "").trim();
  const role = (accountType === "vendor" ? "vendor" : String(formData.get("role") ?? "project_manager")) as AppUser["role"];
  const assignedProjectIds = formData.getAll("assignedProjectIds").map(String).filter(Boolean);
  const assignedVendorIds = [
    ...new Set(
      [
        ...formData.getAll("assignedVendorIds").map(String).filter(Boolean),
        ...(vendorId ? [vendorId] : [])
      ]
    )
  ];

  await createWorkspaceUser({
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    role,
    assignedProjectIds,
    assignedVendorIds,
    managedByUserId: session.id
  });

  revalidatePath("/settings");
}

export async function updateWorkspaceUserAction(formData: FormData) {
  const session = await requireSession();
  if (!session.isSuperAdmin && session.role !== "admin") {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "project_manager") as AppUser["role"];

  await updateWorkspaceUser({
    userId,
    fullName: String(formData.get("fullName") ?? ""),
    email: String(formData.get("email") ?? ""),
    username: String(formData.get("username") ?? ""),
    password: String(formData.get("password") ?? ""),
    role,
    assignedProjectIds: formData.getAll("assignedProjectIds").map(String).filter(Boolean),
    assignedVendorIds: formData.getAll("assignedVendorIds").map(String).filter(Boolean)
  });

  revalidatePath("/settings");
}

export async function deleteWorkspaceUserAction(formData: FormData) {
  const session = await requireSession();
  if (!session.isSuperAdmin && session.role !== "admin") {
    return;
  }

  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === session.id) {
    return;
  }

  await deleteWorkspaceUser(userId);
  revalidatePath("/settings");
}
