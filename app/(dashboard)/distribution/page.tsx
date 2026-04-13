import { DistributionManagement } from "@/features/distribution/distribution-management";
import { getDashboardData } from "@/lib/data/demo-store";

export default async function DistributionPage() {
  const data = await getDashboardData();
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
