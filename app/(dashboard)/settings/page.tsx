import { createWorkspaceUserAction, deleteWorkspaceUserAction, updateWorkspaceUserAction } from "@/features/settings/actions";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/demo-store";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/settings")) {
    redirect("/dashboard");
  }
  const data = await getDashboardData(session);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm uppercase tracking-[0.26em] text-[var(--accent-blue)]">Access control</p>
        <h1 className="font-display text-3xl font-black">Workspace access</h1>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Super admin</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">
            {data.users.filter((user) => user.isSuperAdmin).length}
          </p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Has full workspace access and user creation rights.</p>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Employee accounts</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">
            {data.users.filter((user) => user.role !== "vendor").length}
          </p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Employees can work only inside their assigned vendors and projects.</p>
        </div>
        <div className="glass-card rounded-[28px] p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Vendor accounts</p>
          <p className="font-display mt-3 text-4xl font-black tracking-[-0.05em] text-[var(--foreground)]">
            {data.users.filter((user) => user.role === "vendor").length}
          </p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Vendors only see their own project updates, media, and submissions.</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {data.users.map((user) => (
            <div key={user.id} className="glass-card rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-black text-[var(--foreground)]">{user.fullName}</h2>
                  <p className="mt-1 text-sm text-[var(--gray-mid)]">
                    {user.username} · {user.role.replaceAll("_", " ")}
                  </p>
                </div>
                <span className="rounded-full bg-[#f8f9fc] px-3 py-2 text-sm font-medium text-[var(--foreground)] ring-1 ring-[var(--border)]">
                  {user.isSuperAdmin ? "Super admin" : "Scoped access"}
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                  <p className="text-[var(--gray-mid)]">Projects</p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">{user.assignedProjectIds.length || "All assigned through role"}</p>
                </div>
                <div className="rounded-3xl bg-[#f8f9fc] p-4 text-sm ring-1 ring-[var(--border)]">
                  <p className="text-[var(--gray-mid)]">Vendors</p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">{user.assignedVendorIds.length || "None"}</p>
                </div>
              </div>

              {user.isSuperAdmin ? null : (
                <details className="mt-4 rounded-[24px] border border-[var(--border)] bg-[#f8f9fc] p-4">
                  <summary className="cursor-pointer text-sm font-medium text-[var(--foreground)]">Edit access</summary>
                  <form action={updateWorkspaceUserAction} className="mt-4 grid gap-4">
                    <input type="hidden" name="userId" value={user.id} />
                    <input name="fullName" defaultValue={user.fullName} placeholder="Full name" className="h-12 rounded-2xl px-4" />
                    <input name="email" defaultValue={user.email} placeholder="Email" className="h-12 rounded-2xl px-4" />
                    <div className="grid gap-4 md:grid-cols-2">
                      <input name="username" defaultValue={user.username} placeholder="User ID" className="h-12 rounded-2xl px-4" />
                      <input name="password" placeholder="New password (optional)" className="h-12 rounded-2xl px-4" />
                    </div>
                    <select name="role" defaultValue={user.role} className="h-12 rounded-2xl px-4">
                      <option value="project_manager">Project manager</option>
                      <option value="content_team">Content team</option>
                      <option value="leadership">Leadership</option>
                      <option value="vendor">Vendor</option>
                    </select>
                    <div className="rounded-3xl bg-white p-4 ring-1 ring-[var(--border)]">
                      <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Assigned projects</p>
                      <div className="grid gap-2 text-sm text-[var(--gray-mid)]">
                        {data.projects.map((project) => (
                          <label key={project.id} className="flex items-center gap-3">
                            <input type="checkbox" name="assignedProjectIds" value={project.id} defaultChecked={user.assignedProjectIds.includes(project.id)} />
                            <span>{project.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-3xl bg-white p-4 ring-1 ring-[var(--border)]">
                      <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Assigned vendors</p>
                      <div className="grid gap-2 text-sm text-[var(--gray-mid)]">
                        {data.vendors.map((vendor) => (
                          <label key={vendor.id} className="flex items-center gap-3">
                            <input type="checkbox" name="assignedVendorIds" value={vendor.id} defaultChecked={user.assignedVendorIds.includes(vendor.id)} />
                            <span>{vendor.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button className="rounded-full bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]">
                        Save changes
                      </button>
                    </div>
                  </form>

                  <form action={deleteWorkspaceUserAction} className="mt-3">
                    <input type="hidden" name="userId" value={user.id} />
                    <button className="rounded-full border border-rose-500/18 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/16">
                      Delete user
                    </button>
                  </form>
                </details>
              )}
            </div>
          ))}
        </div>

        <form action={createWorkspaceUserAction} className="glass-card rounded-[28px] p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--accent-blue)]">Create workspace user</p>
          <div className="mt-4 grid gap-4">
            <select name="accountType" className="h-12 rounded-2xl px-4">
              <option value="employee">This is an employee</option>
              <option value="vendor">This is a vendor</option>
            </select>
            <input name="fullName" placeholder="Full name" className="h-12 rounded-2xl px-4" />
            <input name="email" placeholder="Email" className="h-12 rounded-2xl px-4" />
            <div className="grid gap-4 md:grid-cols-2">
              <input name="username" placeholder="User ID" className="h-12 rounded-2xl px-4" />
              <input name="password" placeholder="Password" className="h-12 rounded-2xl px-4" />
            </div>
            <select name="role" className="h-12 rounded-2xl px-4">
              <option value="project_manager">Project manager</option>
              <option value="content_team">Content team</option>
              <option value="leadership">Leadership</option>
            </select>
            <select name="vendorId" className="h-12 rounded-2xl px-4">
              <option value="">Link vendor account later</option>
              {data.vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
            <div className="rounded-3xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)]">
              <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Assign projects</p>
              <div className="grid gap-2 text-sm text-[var(--gray-mid)]">
                {data.projects.map((project) => (
                  <label key={project.id} className="flex items-center gap-3">
                    <input type="checkbox" name="assignedProjectIds" value={project.id} />
                    <span>{project.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)]">
              <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Assign vendors</p>
              <div className="grid gap-2 text-sm text-[var(--gray-mid)]">
                {data.vendors.map((vendor) => (
                  <label key={vendor.id} className="flex items-center gap-3">
                    <input type="checkbox" name="assignedVendorIds" value={vendor.id} />
                    <span>{vendor.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="rounded-full bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]">
              Create user
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
