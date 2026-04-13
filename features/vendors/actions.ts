"use server";

import { revalidatePath } from "next/cache";

import { createVendor } from "@/lib/data/demo-store";

export async function createVendorAction(formData: FormData) {
  await createVendor({
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
}
