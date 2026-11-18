import { workflowSetupError } from "@/lib/communications/repository";
import { connectionStatus } from "@/lib/communications/config";
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
  const [data, setupError] = await Promise.all([getDashboardData(session), workflowSetupError()]);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-[28px] font-semibold">Share content</h1>
      {setupError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{setupError}</p>}
      <DistributionManagement
        connections={connectionStatus()}
        destinations={{telegram:process.env.TELEGRAM_CHANNEL_ID || "",instagram:process.env.INSTAGRAM_ACCOUNT_ID || ""}}
        updates={data.updates}
        generatedContent={data.generatedContent}
        distributionLog={data.distributionLog}
      />
    </div>
  );
}
