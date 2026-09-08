import { getDashboardData } from "@/lib/data/demo-store";
import { ProjectList } from "@/features/projects/project-list";
import { requireSession } from "@/lib/auth/session";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProjectsPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/projects")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pl-16 lg:pl-0">
        <div>
          <h1 className="font-display text-3xl font-black">Projects</h1>
          <p className="mt-1 text-sm text-[var(--gray-mid)]">Assign a CSR Associate or mark the project as managed internally.</p>
        </div>
        {session.role !== "vendor" ? (
          <div className="flex gap-2"><Link href="/vendors/new" className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)]">Add CSR Associate</Link><Link href="/projects/new" className="rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">Create new project</Link></div>
        ) : null}
      </div>
      <ProjectList projects={data.projects} projectsWithUpdates={[...new Set(data.updates.map((update) => update.projectId))]} />
    </div>
  );
}
