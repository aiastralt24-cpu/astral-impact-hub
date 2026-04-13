import { ContentManagement } from "@/features/content/content-management";
import { getDashboardData } from "@/lib/data/demo-store";

export default async function ContentPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Content</h1>
      <ContentManagement updates={data.updates} generatedContent={data.generatedContent} />
    </div>
  );
}
