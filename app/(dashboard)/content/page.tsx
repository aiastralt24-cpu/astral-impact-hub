import { ContentManagement } from "@/features/content/content-management";
import { getDashboardData } from "@/lib/data/demo-store";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function ContentPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/content")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Content</h1>
      <ContentManagement updates={data.updates} generatedContent={data.generatedContent} />
    </div>
  );
}
