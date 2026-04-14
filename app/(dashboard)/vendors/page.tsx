import { getDashboardData } from "@/lib/data/demo-store";
import { VendorManagement } from "@/features/vendors/vendor-management";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function VendorsPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/vendors")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Vendor Intelligence</h1>
      <VendorManagement vendors={data.vendors} session={session} />
    </div>
  );
}
