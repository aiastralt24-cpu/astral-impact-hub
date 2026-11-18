"use server";

import { redirect } from "next/navigation";

import { signInWithCredentials } from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    redirect("/login?error=missing_fields");
  }

  let result: Awaited<ReturnType<typeof signInWithCredentials>>;
  try {
    result = await signInWithCredentials(username, password);
  } catch (error) {
    console.error("Login failed", error);
    redirect("/login?error=system_error");
  }
  if (!result.ok) redirect(`/login?error=${result.reason}`);

  redirect("/dashboard");
}
