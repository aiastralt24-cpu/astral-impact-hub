"use server";

import { redirect } from "next/navigation";

import { signInAsRole } from "@/lib/auth/session";
import type { AppUser } from "@/types/domain";

export async function loginAction(formData: FormData) {
  const role = formData.get("role") as AppUser["role"] | null;
  if (!role) {
    return;
  }

  await signInAsRole(role);
  redirect("/dashboard");
}
