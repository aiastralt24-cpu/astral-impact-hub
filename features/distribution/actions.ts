"use server";

import { revalidatePath } from "next/cache";

import { distributeContent } from "@/lib/data/demo-store";
import type { DistributionLogRecord } from "@/types/domain";

export async function distributeAction(formData: FormData) {
  await distributeContent({
    updateId: String(formData.get("updateId") ?? ""),
    contentId: String(formData.get("contentId") ?? ""),
    channel: String(formData.get("channel") ?? "telegram") as DistributionLogRecord["channel"]
  });
  revalidatePath("/distribution");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
}
