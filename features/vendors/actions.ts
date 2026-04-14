"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/auth/session";
import { createVendor, createWorkspaceUser, deleteVendor, updateVendor } from "@/lib/data/demo-store";

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

  await updateVendor({
    vendorId: String(formData.get("vendorId") ?? ""),
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
