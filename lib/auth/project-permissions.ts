import type { AppUser } from "@/types/domain";

export function canCreateProject(session: AppUser) {
  return Boolean(session.isSuperAdmin || session.role === "admin" || session.role === "project_manager");
}

export function canManageProject(session: AppUser, projectId: string, internalOwnerId?: string) {
  return Boolean(
    session.isSuperAdmin ||
      session.role === "admin" ||
      (session.role === "project_manager" && (session.assignedProjectIds.includes(projectId) || internalOwnerId === session.id)) ||
      (session.role === "vendor" && session.assignedProjectIds.includes(projectId))
  );
}
