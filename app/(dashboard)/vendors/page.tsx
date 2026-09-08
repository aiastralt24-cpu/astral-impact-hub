import { getDashboardData } from "@/lib/data/demo-store";
import { VendorManagement } from "@/features/vendors/vendor-management";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function VendorsPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/vendors")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3"><h1 className="font-display text-3xl font-black">CSR Associates</h1>{session.role !== "vendor" ? <Link href="/vendors/new" className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">Add CSR Associate</Link> : null}</div>
      <VendorManagement vendors={data.vendors} session={session} showCreate={false} />
    </div>
  );
}
