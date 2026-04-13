"use server";

import { revalidatePath } from "next/cache";

import { generateContent } from "@/lib/data/demo-store";

export async function generateContentAction(formData: FormData) {
  await generateContent(String(formData.get("updateId") ?? ""));
  revalidatePath("/content");
  revalidatePath("/dashboard");
}
