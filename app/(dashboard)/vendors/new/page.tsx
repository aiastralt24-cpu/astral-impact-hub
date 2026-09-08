import Link from "next/link";
import { redirect } from "next/navigation";
import { VendorManagement } from "@/features/vendors/vendor-management";
import { requireSession } from "@/lib/auth/session";

export default async function NewVendorPage() {
  const session = await requireSession();
  if (session.role === "vendor") redirect("/vendors");
  return <div className="space-y-5"><Link href="/vendors" className="text-sm font-semibold text-[var(--primary)]">← Back to CSR Associates</Link><div><h1 className="font-display text-3xl font-black">Add CSR Associate</h1><p className="mt-1 text-sm text-[var(--gray-mid)]">Add contact and coverage details. Social media and login details are optional.</p></div><VendorManagement vendors={[]} session={session} showSummary={false} /></div>;
}
