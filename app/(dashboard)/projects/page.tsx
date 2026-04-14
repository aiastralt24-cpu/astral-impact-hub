import { getDashboardData } from "@/lib/data/demo-store";
import { ProjectManagement } from "@/features/projects/project-management";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/projects")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl font-black">Projects</h1>
      <ProjectManagement
        projects={data.projects}
        vendors={data.vendors}
        managers={data.users.filter((user) => user.role === "admin" || user.role === "project_manager")}
        session={session}
      />
    </div>
  );
}
