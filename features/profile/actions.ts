"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSession } from "@/lib/auth/session";
import { getDashboardData, updateVendor } from "@/lib/data/demo-store";

export async function updateOwnProfileAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "vendor") redirect("/dashboard");

  const data = await getDashboardData(session);
  const vendor = data.vendors.find((item) => session.assignedVendorIds.includes(item.id));
  if (!vendor) redirect("/profile?error=profile-not-found");

  const name = String(formData.get("name") ?? "").trim();
  const primaryContactName = String(formData.get("primaryContactName") ?? "").trim();
  if (!name || !primaryContactName) redirect("/profile?error=required-fields");

  await updateVendor({
    vendorId: vendor.id,
    name,
    primaryContactName,
    email: String(formData.get("email") ?? "").trim(),
    whatsappPhone: String(formData.get("whatsappPhone") ?? "").trim(),
    instagramHandle: String(formData.get("instagramHandle") ?? "").trim(),
    facebookHandle: String(formData.get("facebookHandle") ?? "").trim(),
    organizationType: String(formData.get("organizationType") ?? "").trim(),
    geographicalScope: String(formData.get("geographicalScope") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
    contractValidUntil: vendor.contractValidUntil,
    rateCardInr: vendor.rateCardInr,
    notes: String(formData.get("notes") ?? "").trim()
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/vendors");
  redirect("/profile?saved=1");
}
