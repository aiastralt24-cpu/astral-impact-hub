import type { AppUser } from "@/types/domain";

export function canCreateProject(session: AppUser) {
  return Boolean(session.isSuperAdmin || session.role === "admin" || session.role === "project_manager");
}

export function canManageProject(session: AppUser, projectId: string) {
  return Boolean(
    session.isSuperAdmin ||
      session.role === "admin" ||
      ((session.role === "project_manager" || session.role === "vendor") && session.assignedProjectIds.includes(projectId))
  );
}
