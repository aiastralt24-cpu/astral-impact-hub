"use server";

import { redirect } from "next/navigation";

import { signInWithCredentials } from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return;
  }

  const session = await signInWithCredentials(username, password);
  if (!session) {
    redirect("/login?error=invalid_credentials");
  }

  redirect("/dashboard");
}
