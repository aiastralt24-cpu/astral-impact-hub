"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { assignPartnerToUser, createVendor, createWorkspaceUser, deleteVendor, getCurrentData, getDashboardData, updateVendor, updateWorkspaceUser } from "@/lib/data/demo-store";

export async function createVendorAction(formData: FormData) {
  const session = await requireSession();
  if (session.role === "vendor") {
    return;
  }

  const email = String(formData.get("email") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (Boolean(username) !== Boolean(password)) {
    redirect("/vendors/new?error=login-details-required");
  }

  if (username && password) {
    const users = (await getCurrentData()).users;
    const normalizedUsername = username.toLowerCase();
    const normalizedEmail = email.toLowerCase();
    if (users.some((user) => user.username.toLowerCase() === normalizedUsername)) {
      redirect("/vendors/new?error=username-exists");
    }
    if (normalizedEmail && users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      redirect("/vendors/new?error=email-exists");
    }
  }

  const vendor = await createVendor({
    name: String(formData.get("name") ?? ""),
    primaryContactName: String(formData.get("primaryContactName") ?? ""),
    email,
    whatsappPhone: String(formData.get("whatsappPhone") ?? ""),
    instagramHandle: String(formData.get("instagramHandle") ?? "").trim(),
    facebookHandle: String(formData.get("facebookHandle") ?? "").trim(),
    organizationType: String(formData.get("organizationType") ?? ""),
    geographicalScope: String(formData.get("geographicalScope") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    contractValidUntil: "",
    rateCardInr: 0,
    notes: String(formData.get("notes") ?? "")
  });

  if (vendor && !session.isSuperAdmin && session.role !== "admin") {
    await assignPartnerToUser(session.id, vendor.id);
  }

  if (vendor && username && password) {
    const primaryContactName = String(formData.get("primaryContactName") ?? "") || vendor.name;
    try {
      await createWorkspaceUser({
        fullName: primaryContactName,
        email,
        username,
        password,
        role: "vendor",
        assignedProjectIds: [],
        assignedVendorIds: [vendor.id],
        managedByUserId: session.id
      });
    } catch (error) {
      await deleteVendor(vendor.id);
      const message = error instanceof Error ? error.message : String(error);
      redirect(`/vendors/new?error=${message.includes("users_email_key") ? "email-exists" : message.includes("users_username_key") ? "username-exists" : "creation-failed"}`);
    }
  }

  revalidatePath("/vendors");
  revalidatePath("/projects");
  revalidatePath("/settings");
  if (vendor) redirect(`/vendors/${vendor.id}`);
}

export async function updateVendorAction(formData: FormData) {
  const session = await requireSession();
  if (session.role === "vendor") {
    return;
  }

  const vendorId = String(formData.get("vendorId") ?? "");
  const scopedData = await getDashboardData(session);
  const existingVendor = scopedData.vendors.find((vendor) => vendor.id === vendorId);
  if (!existingVendor) {
    return;
  }

  await updateVendor({
    vendorId,
    name: String(formData.get("name") ?? ""),
    primaryContactName: String(formData.get("primaryContactName") ?? ""),
    email: String(formData.get("email") ?? ""),
    whatsappPhone: String(formData.get("whatsappPhone") ?? ""),
    instagramHandle: String(formData.get("instagramHandle") ?? "").trim(),
    facebookHandle: String(formData.get("facebookHandle") ?? "").trim(),
    organizationType: String(formData.get("organizationType") ?? ""),
    geographicalScope: String(formData.get("geographicalScope") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    contractValidUntil: existingVendor.contractValidUntil,
    rateCardInr: existingVendor.rateCardInr,
    notes: String(formData.get("notes") ?? "")
  });

  revalidatePath("/vendors");
  revalidatePath("/projects");
  revalidatePath("/settings");
}

export async function deleteVendorAction(formData: FormData) {
  const session = await requireSession();
  if (!session.isSuperAdmin && session.role !== "admin") {
    return;
  }

  await deleteVendor(String(formData.get("vendorId") ?? ""));
  revalidatePath("/vendors");
  revalidatePath("/projects");
  revalidatePath("/settings");
}

export async function updateVendorCredentialsAction(formData: FormData) {
  const session = await requireSession();
  const userId = String(formData.get("userId") ?? "");
  const vendorId = String(formData.get("vendorId") ?? "");
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();
  if (!userId || !vendorId || !username || !password) return;

  const data = await getCurrentData();
  const target = data.users.find((user) => user.id === userId && user.role === "vendor" && user.assignedVendorIds.includes(vendorId));
  const canManage = Boolean(session.isSuperAdmin || session.role === "admin" || target?.managedByUserId === session.id);
  if (!target || !canManage) return;
  if (data.users.some((user) => user.id !== userId && user.username.toLowerCase() === username.toLowerCase())) {
    redirect(`/vendors/${vendorId}?error=username-exists`);
  }

  await updateWorkspaceUser({
    userId,
    fullName: target.fullName,
    email: target.email,
    username,
    password,
    role: "vendor",
    assignedProjectIds: target.assignedProjectIds,
    assignedVendorIds: target.assignedVendorIds
  });
  revalidatePath(`/vendors/${vendorId}`);
  redirect(`/vendors/${vendorId}?credentials=updated`);
}
