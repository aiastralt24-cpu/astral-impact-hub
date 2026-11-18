import { getDashboardData } from "@/lib/data/demo-store";
import { VendorDirectory } from "@/features/vendors/vendor-directory";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";

export default async function VendorsPage() {
  const session = await requireSession();
  if (session.role === "vendor") {
    redirect("/profile");
  }
  if (!canAccessRoute(session.role, "/vendors")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 "><div><p className="text-xs font-semibold tracking-normal text-[var(--primary)]">Partner network</p><h1 className="mt-2 font-display text-[28px] font-semibold tracking-[-0.025em] ">CSR Associates</h1><p className="mt-2 text-sm text-[var(--gray-mid)]">Manage partner contacts, coverage, access, and project assignments.</p></div><Link href="/vendors/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm"><Plus className="h-4 w-4" />Add CSR Associate</Link></div>
      <VendorDirectory vendors={data.vendors} />
    </div>
  );
}
