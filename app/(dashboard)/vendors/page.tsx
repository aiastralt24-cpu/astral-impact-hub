import { getDashboardData } from "@/lib/data/demo-store";
import { VendorManagement } from "@/features/vendors/vendor-management";

export default async function VendorsPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Vendor Intelligence</h1>
      <VendorManagement vendors={data.vendors} />
    </div>
  );
}
