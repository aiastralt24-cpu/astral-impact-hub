"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signOut } from "@/lib/auth/session";

export async function logoutAction() {
  await signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
