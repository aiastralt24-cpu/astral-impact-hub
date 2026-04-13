import { getDashboardData } from "@/lib/data/demo-store";
import { ProjectManagement } from "@/features/projects/project-management";

export default async function ProjectsPage() {
  const data = await getDashboardData();
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Projects</h1>
      <ProjectManagement
        projects={data.projects}
        vendors={data.vendors}
        managers={data.users.filter((user) => user.role === "admin" || user.role === "project_manager")}
      />
    </div>
  );
}
