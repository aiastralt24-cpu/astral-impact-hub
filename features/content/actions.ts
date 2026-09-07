"use server";

import { revalidatePath } from "next/cache";

import { generateContent, getDashboardData } from "@/lib/data/demo-store";
import { requireSession } from "@/lib/auth/session";

export async function generateContentAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "content_team") return;
  const updateId = String(formData.get("updateId") ?? "");
  const scopedData = await getDashboardData(session);
  const update = scopedData.updates.find((entry) => entry.id === updateId);
  if (!update || (update.status !== "approved" && update.status !== "published")) return;
  await generateContent(updateId);
  revalidatePath("/content");
  revalidatePath("/dashboard");
}
