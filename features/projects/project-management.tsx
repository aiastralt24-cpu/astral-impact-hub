import { deleteProjectAction, updateProjectAction } from "@/features/projects/actions";
import { Badge } from "@/components/ui/badge";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { canCreateProject, canManageProject } from "@/lib/auth/project-permissions";
import type { AppUser, ProjectRecord, VendorRecord } from "@/types/domain";
import { ProjectManagementChoice } from "@/features/projects/project-management-choice";
import { CreateProjectForm } from "@/features/projects/create-project-form";

type ProjectManagementProps = {
  projects: ProjectRecord[];
  vendors: VendorRecord[];
  managers: AppUser[];
  session: AppUser;
  showCreate?: boolean;
  defaultVendorIds?: string[];
};

export function ProjectManagement({ projects, vendors, managers, session, showCreate = true, defaultVendorIds }: ProjectManagementProps) {
  const canCreate = canCreateProject(session);

  return (
    <div className={canCreate && projects.length > 0 ? "grid gap-6 xl:grid-cols-[1.4fr_0.9fr]" : "grid w-full gap-6"}>
      <div className={projects.length ? "space-y-4" : "hidden"}>
        {projects.map((project) => (
          <div key={project.id} className="glass-card rounded-[30px] p-5">
            {project.requireAdminApproval ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="review">Admin approval</Badge>
              </div>
            ) : null}
            <h3 className="font-display mt-3 text-2xl font-black text-[var(--foreground)]">{project.name}</h3>
            <p className="mt-2 text-sm text-[var(--gray-mid)]">{project.projectBrief}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <p className="text-[var(--gray-mid)]">Location</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">{project.location}</p>
              </div>
              <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <p className="text-[var(--gray-mid)]">Project managed by</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">{project.vendorName}</p>
              </div>
            </div>

            {canManageProject(session, project.id, project.internalOwnerId) ? (
              <div className="mt-4 flex flex-wrap items-start gap-3">
              <details id="edit-project" className="open:basis-full">
                <summary className="inline-flex cursor-pointer list-none items-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary-light)]">Edit project</summary>
                <form action={updateProjectAction} className="mt-4 grid gap-4 rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input name="name" defaultValue={project.name} placeholder="Project name" className="h-12 rounded-2xl px-4" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="category" defaultValue={project.category} placeholder="Project area" className="h-12 rounded-2xl px-4" />
                    <input name="subCategory" defaultValue={project.subCategory} placeholder="Focus area" className="h-12 rounded-2xl px-4" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="state" defaultValue={project.state} placeholder="State" className="h-12 rounded-2xl px-4" />
                    <input name="district" defaultValue={project.district} placeholder="District" className="h-12 rounded-2xl px-4" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="startDate" aria-label="Start date" defaultValue={project.startDate} type="date" required className="h-12 rounded-2xl px-4" />
                    <input name="endDate" aria-label="End date" defaultValue={project.endDate} type="date" required className="h-12 rounded-2xl px-4" />
                  </div>
                  {session.role === "vendor" ? (
                    <>
                      <input type="hidden" name="internalOwnerId" value={project.internalOwnerId} />
                      {project.vendorIds.filter((id) => session.assignedVendorIds.includes(id)).map((id) => (
                        <input key={id} type="hidden" name="vendorIds" value={id} />
                      ))}
                    </>
                  ) : (
                    <>
                      <select name="internalOwnerId" defaultValue={project.internalOwnerId} className="h-12 rounded-2xl px-4">
                        {managers.map((manager) => <option value={manager.id} key={manager.id}>{manager.fullName}</option>)}
                      </select>
                      <ProjectManagementChoice vendors={vendors} defaultVendorIds={project.vendorIds} />
                    </>
                  )}
                  <textarea name="projectBrief" defaultValue={project.projectBrief} placeholder="Project overview" className="min-h-28 rounded-3xl px-4 py-3" />
                  <input name="strategicTags" defaultValue={project.strategicTags.join(", ")} placeholder="Project highlights" className="h-12 rounded-2xl px-4" />
                  <input name="emotionalTags" defaultValue={project.emotionalTags.join(", ")} placeholder="Impact themes" className="h-12 rounded-2xl px-4" />
                  <input name="beneficiaryTarget" defaultValue={project.beneficiaryTarget} type="number" placeholder="People to be reached" className="h-12 rounded-2xl px-4" />
                  <select name="status" defaultValue={project.status} className="h-12 rounded-2xl px-4">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="at_risk">At Risk</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  {session.role === "vendor" ? (
                    project.requireAdminApproval ? <input type="hidden" name="requireAdminApproval" value="on" /> : null
                  ) : (
                    <label className="flex items-center gap-3 text-sm text-[var(--gray-mid)]">
                      <input type="checkbox" name="requireAdminApproval" defaultChecked={project.requireAdminApproval} />
                      Require admin approval
                    </label>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <ConfirmSubmitButton
                      confirmMessage={`Save changes for ${project.name}?`}
                      pendingLabel="Saving..."
                      className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]"
                    >
                      Save project
                    </ConfirmSubmitButton>
                  </div>
                </form>
              </details>
                <form action={deleteProjectAction}>
                  <input type="hidden" name="projectId" value={project.id} />
                  <ConfirmSubmitButton
                    confirmMessage={`Delete ${project.name}? This will also remove linked updates and media metadata.`}
                    pendingLabel="Deleting..."
                    className="rounded-full border border-rose-500/18 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/16"
                  >
                    Delete project
                  </ConfirmSubmitButton>
                </form>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {canCreate && showCreate ? <CreateProjectForm vendors={vendors} managers={managers} defaultVendorIds={defaultVendorIds} /> : null}
    </div>
  );
}
