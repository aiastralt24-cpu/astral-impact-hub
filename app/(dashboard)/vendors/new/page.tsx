import Link from "next/link";
import { redirect } from "next/navigation";
import { VendorManagement } from "@/features/vendors/vendor-management";
import { requireSession } from "@/lib/auth/session";

const errorMessages: Record<string, string> = {
  "email-exists": "This email address already belongs to a portal user. Use a different email or update the existing account.",
  "username-exists": "This user ID already exists. Choose a different user ID.",
  "login-details-required": "Enter both a user ID and password to create a login, or leave both fields blank.",
  "creation-failed": "The CSR Associate could not be created. Please review the details and try again."
};

export default async function NewVendorPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const session = await requireSession();
  if (session.role === "vendor") redirect("/vendors");
  const { error } = await searchParams;
  return <div className="space-y-5"><Link href="/vendors" className="text-sm font-semibold text-[var(--primary)]">← Back to CSR Associates</Link><div><h1 className="font-display text-3xl font-black">Add CSR Associate</h1><p className="mt-1 text-sm text-[var(--gray-mid)]">Add contact and coverage details. Social media and login details are optional.</p></div>{error && errorMessages[error] ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessages[error]}</div> : null}<VendorManagement vendors={[]} session={session} showSummary={false} /></div>;
}
