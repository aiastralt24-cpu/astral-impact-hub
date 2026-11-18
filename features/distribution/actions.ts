"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { shareDraft } from "@/lib/communications/service";
import { publicError, WorkflowError } from "@/lib/communications/model";
import type { DistributionChannel } from "@/types/domain";
export async function distributeAction(_previous: {ok:boolean;message:string}, form: FormData) {
  const user = await requireSession();
  try {
    const channel = String(form.get("channel"));
    if (!["telegram","whatsapp","instagram"].includes(channel)) throw new WorkflowError("Choose a supported channel.");
    if (form.get("confirmed") !== "on") throw new WorkflowError("Confirm the destination and approved content before sending.");
    if (channel === "whatsapp" && form.get("whatsappWindow") !== "on") throw new WorkflowError("Confirm recipient opt-in and an active 24-hour customer-service window. Outside it, use an approved WhatsApp template.");
    const message = await shareDraft(user,String(form.get("updateId")),String(form.get("contentId")),Number(form.get("revision")),channel as DistributionChannel,String(form.get("recipient")||""));
    revalidatePath("/distribution");revalidatePath("/analytics");revalidatePath("/dashboard");
    return {ok:true,message};
  } catch(error) { revalidatePath("/distribution");return {ok:false,message:publicError(error)}; }
}
