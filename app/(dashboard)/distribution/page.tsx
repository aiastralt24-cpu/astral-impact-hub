import { DistributionManagement } from "@/features/distribution/distribution-management";
import { getDashboardData } from "@/lib/data/demo-store";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function DistributionPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/distribution")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Distribution</h1>
      <DistributionManagement
        updates={data.updates}
        generatedContent={data.generatedContent}
        distributionLog={data.distributionLog}
      />
    </div>
  );
}
