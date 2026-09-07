"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { assignPartnerToUser, createVendor, createWorkspaceUser, deleteVendor, getDashboardData, updateVendor } from "@/lib/data/demo-store";

export async function createVendorAction(formData: FormData) {
  const session = await requireSession();
  if (session.role === "vendor") {
    return;
  }

  const vendor = await createVendor({
    name: String(formData.get("name") ?? ""),
    primaryContactName: String(formData.get("primaryContactName") ?? ""),
    email: String(formData.get("email") ?? ""),
    whatsappPhone: String(formData.get("whatsappPhone") ?? ""),
    organizationType: String(formData.get("organizationType") ?? ""),
    geographicalScope: String(formData.get("geographicalScope") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    contractValidUntil: String(formData.get("contractValidUntil") ?? ""),
    rateCardInr: Number(formData.get("rateCardInr") ?? 0),
    notes: String(formData.get("notes") ?? "")
  });

  if (vendor && !session.isSuperAdmin && session.role !== "admin") {
    await assignPartnerToUser(session.id, vendor.id);
  }

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "").trim();

  if (vendor && username && password) {
    const primaryContactName = String(formData.get("primaryContactName") ?? "") || vendor.name;
    await createWorkspaceUser({
      fullName: primaryContactName,
      email: String(formData.get("email") ?? ""),
      username,
      password,
      role: "vendor",
      assignedProjectIds: [],
      assignedVendorIds: [vendor.id],
      managedByUserId: session.id
    });
  }

  revalidatePath("/vendors");
  revalidatePath("/projects");
  revalidatePath("/settings");
}

export async function updateVendorAction(formData: FormData) {
  const session = await requireSession();
  if (session.role === "vendor") {
    return;
  }

  const vendorId = String(formData.get("vendorId") ?? "");
  const scopedData = await getDashboardData(session);
  if (!scopedData.vendors.some((vendor) => vendor.id === vendorId)) {
    return;
  }

  await updateVendor({
    vendorId,
    name: String(formData.get("name") ?? ""),
    primaryContactName: String(formData.get("primaryContactName") ?? ""),
    email: String(formData.get("email") ?? ""),
    whatsappPhone: String(formData.get("whatsappPhone") ?? ""),
    organizationType: String(formData.get("organizationType") ?? ""),
    geographicalScope: String(formData.get("geographicalScope") ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    contractValidUntil: String(formData.get("contractValidUntil") ?? ""),
    rateCardInr: Number(formData.get("rateCardInr") ?? 0),
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
