import type { ProjectRecord } from "@/types/domain";

export function resolveAssignedProjectId(
  projects: Pick<ProjectRecord, "id">[],
  ...candidates: Array<string | undefined>
) {
  for (const candidate of candidates) {
    if (candidate && projects.some((project) => project.id === candidate)) {
      return candidate;
    }
  }

  return projects[0]?.id ?? "";
}
