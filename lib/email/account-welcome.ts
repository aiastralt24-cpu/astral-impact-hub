import "server-only";

import { Resend } from "resend";

import { AccountWelcomeEmail } from "@/emails/account-welcome";

type WelcomeEmailInput = {
  email: string;
  fullName: string;
  username: string;
  temporaryPassword: string;
  accountLabel: string;
  organizationName?: string;
};

export type WelcomeEmailResult =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "invalid-email" | "delivery-failed" };

export async function sendAccountWelcomeEmail(input: WelcomeEmailInput): Promise<WelcomeEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");
  if (!apiKey || !from || !appUrl) return { ok: false, reason: "not-configured" };
  if (!input.email.trim() || !input.email.includes("@")) return { ok: false, reason: "invalid-email" };

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: input.email,
      subject: "Your Astral Foundation portal account is ready",
      react: AccountWelcomeEmail({
        fullName: input.fullName,
        username: input.username,
        temporaryPassword: input.temporaryPassword,
        accountLabel: input.accountLabel,
        organizationName: input.organizationName,
        loginUrl: `${appUrl}/login`
      })
    });
    return error ? { ok: false, reason: "delivery-failed" } : { ok: true };
  } catch (error) {
    console.error("Welcome email delivery failed", error);
    return { ok: false, reason: "delivery-failed" };
  }
}
