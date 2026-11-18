"use server";

import { scheduleProjectEmails } from "@/lib/notifications/schedule";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { createWorkspaceUser, deleteWorkspaceUser, updateWorkspaceUser } from "@/lib/data/demo-store";
import { sendAccountWelcomeEmail } from "@/lib/email/account-welcome";
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

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!fullName || !email || !username || !password) redirect("/settings?error=required-fields");

  await createWorkspaceUser({
    fullName,
    email,
    username,
    password,
    role,
    assignedProjectIds,
    assignedVendorIds,
    managedByUserId: session.id
  });

  const delivery = await sendAccountWelcomeEmail({
    email,
    fullName,
    username,
    temporaryPassword: password,
    accountLabel: role === "vendor" ? "CSR Associate" : role.replaceAll("_", " "),
    organizationName: role === "vendor" ? undefined : "Astral Foundation"
  });

  scheduleProjectEmails();
  revalidatePath("/settings");
  redirect(`/settings?welcome=${delivery.ok ? "sent" : delivery.reason}`);
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

  scheduleProjectEmails();
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
  scheduleProjectEmails();
  revalidatePath("/settings");
}
