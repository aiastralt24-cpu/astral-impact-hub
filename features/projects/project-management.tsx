import { createProjectAction, deleteProjectAction, updateProjectAction } from "@/features/projects/actions";
import { Badge } from "@/components/ui/badge";
import type { AppUser, ProjectRecord, VendorRecord } from "@/types/domain";

type ProjectManagementProps = {
  projects: ProjectRecord[];
  vendors: VendorRecord[];
  managers: AppUser[];
  session: AppUser;
};

export function ProjectManagement({ projects, vendors, managers, session }: ProjectManagementProps) {
  const canManageProjects = Boolean(session.isSuperAdmin || session.role === "admin");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="glass-card rounded-[30px] p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={project.healthScore >= 70 ? "approved" : project.healthScore >= 45 ? "pending" : "rejected"}>
                Health {project.healthScore}
              </Badge>
              <Badge variant="neutral">{project.reportingFrequency}</Badge>
              {project.requireAdminApproval ? <Badge variant="review">Admin approval</Badge> : null}
            </div>
            <h3 className="font-display mt-3 text-2xl font-black text-[var(--foreground)]">{project.name}</h3>
            <p className="mt-2 text-sm text-[var(--gray-mid)]">{project.projectBrief}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <p className="text-[var(--gray-mid)]">Location</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">{project.location}</p>
              </div>
              <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <p className="text-[var(--gray-mid)]">Assigned vendors</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">{project.vendorName}</p>
              </div>
              <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                <p className="text-[var(--gray-mid)]">Budget</p>
                <p className="mt-1 font-medium text-[var(--foreground)]">INR {project.budgetInr.toLocaleString("en-IN")}</p>
              </div>
            </div>

            {canManageProjects ? (
              <details className="mt-4 rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4">
                <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">Edit project</summary>
                <form action={updateProjectAction} className="mt-4 grid gap-4">
                  <input type="hidden" name="projectId" value={project.id} />
                  <input name="name" defaultValue={project.name} placeholder="Project name" className="h-12 rounded-2xl px-4" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="category" defaultValue={project.category} placeholder="Category" className="h-12 rounded-2xl px-4" />
                    <input name="subCategory" defaultValue={project.subCategory} placeholder="Sub-category" className="h-12 rounded-2xl px-4" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="state" defaultValue={project.state} placeholder="State" className="h-12 rounded-2xl px-4" />
                    <input name="district" defaultValue={project.district} placeholder="District" className="h-12 rounded-2xl px-4" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="startDate" defaultValue={project.startDate} type="date" className="h-12 rounded-2xl px-4" />
                    <input name="endDate" defaultValue={project.endDate} type="date" className="h-12 rounded-2xl px-4" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input name="budgetInr" defaultValue={project.budgetInr} type="number" placeholder="Budget" className="h-12 rounded-2xl px-4" />
                    <select name="reportingFrequency" defaultValue={project.reportingFrequency} className="h-12 rounded-2xl px-4">
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <select name="internalOwnerId" defaultValue={project.internalOwnerId} className="h-12 rounded-2xl px-4">
                    {managers.map((manager) => (
                      <option value={manager.id} key={manager.id}>
                        {manager.fullName}
                      </option>
                    ))}
                  </select>
                  <div className="rounded-3xl bg-white p-4 ring-1 ring-[var(--border)]">
                    <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Assigned vendors</p>
                    <div className="grid gap-2 text-sm">
                      {vendors.map((vendor) => (
                        <label key={vendor.id} className="flex items-center gap-3 text-[var(--gray-mid)]">
                          <input type="checkbox" name="vendorIds" value={vendor.id} defaultChecked={project.vendorIds.includes(vendor.id)} />
                          <span>{vendor.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <textarea name="projectBrief" defaultValue={project.projectBrief} placeholder="Project brief" className="min-h-28 rounded-3xl px-4 py-3" />
                  <input name="strategicTags" defaultValue={project.strategicTags.join(", ")} placeholder="Strategic tags" className="h-12 rounded-2xl px-4" />
                  <input name="emotionalTags" defaultValue={project.emotionalTags.join(", ")} placeholder="Emotional tags" className="h-12 rounded-2xl px-4" />
                  <input name="beneficiaryTarget" defaultValue={project.beneficiaryTarget} type="number" placeholder="Beneficiary target" className="h-12 rounded-2xl px-4" />
                  <select name="status" defaultValue={project.status} className="h-12 rounded-2xl px-4">
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="on_hold">On Hold</option>
                    <option value="at_risk">At Risk</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                  <label className="flex items-center gap-3 text-sm text-[var(--gray-mid)]">
                    <input type="checkbox" name="requireAdminApproval" defaultChecked={project.requireAdminApproval} />
                    Require admin approval
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]">
                      Save project
                    </button>
                  </div>
                </form>

                <form action={deleteProjectAction} className="mt-3">
                  <input type="hidden" name="projectId" value={project.id} />
                  <button className="rounded-full border border-rose-500/18 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/16">
                    Delete project
                  </button>
                </form>
              </details>
            ) : null}
          </div>
        ))}
      </div>

      <form action={createProjectAction} className="glass-card rounded-[30px] p-6">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Create project</p>
        <div className="mt-4 grid gap-4">
          <input name="name" placeholder="Project name" className="h-12 rounded-2xl px-4" />
          <div className="grid gap-4 md:grid-cols-2">
            <input name="category" placeholder="Category" className="h-12 rounded-2xl px-4" />
            <input name="subCategory" placeholder="Sub-category" className="h-12 rounded-2xl px-4" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="state" placeholder="State" className="h-12 rounded-2xl px-4" />
            <input name="district" placeholder="District" className="h-12 rounded-2xl px-4" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="startDate" type="date" className="h-12 rounded-2xl px-4" />
            <input name="endDate" type="date" className="h-12 rounded-2xl px-4" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="budgetInr" type="number" placeholder="Budget" className="h-12 rounded-2xl px-4" />
            <select name="reportingFrequency" className="h-12 rounded-2xl px-4">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <select name="internalOwnerId" className="h-12 rounded-2xl px-4">
            {managers.map((manager) => (
              <option value={manager.id} key={manager.id}>
                {manager.fullName}
              </option>
            ))}
          </select>
          <div className="rounded-3xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)]">
            <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Assign vendors</p>
            <div className="grid gap-2 text-sm">
              {vendors.map((vendor) => (
                <label key={vendor.id} className="flex items-center gap-3 text-[var(--gray-mid)]">
                  <input type="checkbox" name="vendorIds" value={vendor.id} />
                  <span>{vendor.name}</span>
                </label>
              ))}
            </div>
          </div>
          <textarea name="projectBrief" placeholder="Project brief" className="min-h-28 rounded-3xl px-4 py-3" />
          <input name="strategicTags" placeholder="Strategic tags" className="h-12 rounded-2xl px-4" />
          <input name="emotionalTags" placeholder="Emotional tags" className="h-12 rounded-2xl px-4" />
          <input name="beneficiaryTarget" type="number" placeholder="Beneficiary target" className="h-12 rounded-2xl px-4" />
          <select name="status" className="h-12 rounded-2xl px-4">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
          </select>
          <label className="flex items-center gap-3 text-sm text-[var(--gray-mid)]">
            <input type="checkbox" name="requireAdminApproval" />
            Require admin approval
          </label>
          <button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]">Create project</button>
        </div>
      </form>
    </div>
  );
}
