"use server";

import { revalidatePath } from "next/cache";

import { distributeContent, getDashboardData } from "@/lib/data/demo-store";
import { requireSession } from "@/lib/auth/session";
import type { DistributionLogRecord } from "@/types/domain";

export async function distributeAction(formData: FormData) {
  const session = await requireSession();
  if (session.role !== "admin" && session.role !== "content_team") return;
  const updateId = String(formData.get("updateId") ?? "");
  const contentId = String(formData.get("contentId") ?? "");
  const scopedData = await getDashboardData(session);
  const update = scopedData.updates.find((entry) => entry.id === updateId);
  const content = scopedData.generatedContent.find((entry) => entry.id === contentId && entry.updateId === updateId);
  if (!update || !content) return;
  await distributeContent({
    updateId,
    contentId,
    channel: String(formData.get("channel") ?? "telegram") as DistributionLogRecord["channel"]
  });
  revalidatePath("/distribution");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
