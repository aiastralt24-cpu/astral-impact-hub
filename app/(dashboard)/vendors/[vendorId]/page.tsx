import Link from "next/link";
import { notFound } from "next/navigation";
import { VendorManagement } from "@/features/vendors/vendor-management";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/demo-store";

export default async function VendorDetailsPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const session = await requireSession();
  const { vendorId } = await params;
  const data = await getDashboardData(session);
  const vendor = data.vendors.find((item) => item.id === vendorId);
  if (!vendor) notFound();
  return <div className="space-y-5"><Link href="/vendors" className="text-sm font-semibold text-[var(--primary)]">← Back to CSR Associates</Link><div><h1 className="font-display text-3xl font-black">CSR Associate details</h1><p className="mt-1 text-sm text-[var(--gray-mid)]">View contact information, project coverage, and available actions.</p></div><VendorManagement vendors={[vendor]} session={session} showSummary={false} showCreate={false} /></div>;
}
