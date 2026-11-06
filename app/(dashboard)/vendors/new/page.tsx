import Link from "next/link";
import { redirect } from "next/navigation";
import { VendorManagement } from "@/features/vendors/vendor-management";
import { requireSession } from "@/lib/auth/session";
import { ArrowLeft } from "lucide-react";

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
  return <div className="mx-auto max-w-4xl space-y-5"><Link href="/vendors" className="ml-16 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] lg:ml-0"><ArrowLeft className="h-4 w-4" />Back to CSR Associates</Link><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Partner onboarding</p><h1 className="mt-2 font-display text-4xl font-black tracking-[-0.04em]">Add CSR Associate</h1><p className="mt-2 text-sm text-[var(--gray-mid)]">Start with the organization and primary contact. Account access can be added now or later.</p></div>{error && errorMessages[error] ? <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessages[error]}</div> : null}<VendorManagement vendors={[]} session={session} showSummary={false} /></div>;
}
