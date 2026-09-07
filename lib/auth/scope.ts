import type { AppUser, ProjectRecord, UpdateRecord } from "@/types/domain";

export type WorkspaceScope = {
  projectIds: Set<string>;
  partnerIds: Set<string>;
};

/** Shared-project membership never grants access to another partner's records. */
export function getWorkspaceScope(session: AppUser, projects: ProjectRecord[]): WorkspaceScope {
  if (session.isSuperAdmin || session.role === "admin") {
    return {
      projectIds: new Set(projects.map((project) => project.id)),
      partnerIds: new Set(projects.flatMap((project) => project.vendorIds))
    };
  }

  const partnerIds = new Set(session.assignedVendorIds);
  const projectIds = new Set(
    projects
      .filter(
        (project) =>
          session.assignedProjectIds.includes(project.id) ||
          project.internalOwnerId === session.id ||
          project.vendorIds.some((partnerId) => partnerIds.has(partnerId))
      )
      .map((project) => project.id)
  );

  return { projectIds, partnerIds };
}

export function canAccessUpdate(session: AppUser, projects: ProjectRecord[], update: Pick<UpdateRecord, "projectId" | "vendorId">) {
  if (session.isSuperAdmin || session.role === "admin") return true;
  const scope = getWorkspaceScope(session, projects);
  return scope.projectIds.has(update.projectId) && scope.partnerIds.has(update.vendorId);
}
