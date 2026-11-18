import { Drawer } from "@/components/ui/drawer";
import { SearchableList } from "@/components/ui/searchable-list";
import { createWorkspaceUserAction, deleteWorkspaceUserAction, updateWorkspaceUserAction } from "@/features/settings/actions";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { requireSession } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/demo-store";
import { canAccessRoute } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ welcome?: string; error?: string }> }) {
  const session = await requireSession();
  if (!canAccessRoute(session.role, "/settings")) {
    redirect("/dashboard");
  }
  const [data, query] = await Promise.all([getDashboardData(session), searchParams]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm tracking-normal text-[var(--accent-blue)]">User permissions</p>
        <h1 className="font-display text-[28px] font-semibold">Team access</h1>
      </div>

      {query.welcome === "sent" ? <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">The user was created and the registration email was sent.</p> : null}
      {query.welcome && query.welcome !== "sent" ? <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">The user was created, but the registration email could not be sent. Check the email service configuration.</p> : null}
      {query.error === "required-fields" ? <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">Full name, email, user ID, and temporary password are required.</p> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Super admin</p>
          <p className="font-display mt-3 text-[28px] font-semibold tracking-[-0.05em] text-[var(--foreground)]">
            {data.users.filter((user) => user.isSuperAdmin).length}
          </p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Has full workspace access and user creation rights.</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">Employee accounts</p>
          <p className="font-display mt-3 text-[28px] font-semibold tracking-[-0.05em] text-[var(--foreground)]">
            {data.users.filter((user) => user.role !== "vendor" && !user.isSuperAdmin).length}
          </p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">Employees can work only inside their assigned CSR Associates and projects.</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm font-semibold text-[var(--foreground)]">CSR Associate accounts</p>
          <p className="font-display mt-3 text-[28px] font-semibold tracking-[-0.05em] text-[var(--foreground)]">
            {data.users.filter((user) => user.role === "vendor").length}
          </p>
          <p className="mt-2 text-sm text-[var(--gray-mid)]">CSR Associates only see their own projects, updates, media, and submissions.</p>
        </div>
      </section>

      <SearchableList label="members" action={<Drawer title="Add team member" trigger="Add member" primary>        <form action={createWorkspaceUserAction} className="space-y-4">
          <div className="mt-4 grid gap-4">
            <label className="grid gap-1.5 text-sm font-medium"><span>Account type</span><select name="accountType" className="h-12 rounded-2xl px-4">
              <option value="employee">This is an employee</option>
              <option value="vendor">This is a CSR Associate</option>
            </select></label>
            <label className="grid gap-1.5 text-sm font-medium"><span>Full name</span><input required name="fullName" placeholder="Full name" className="h-12 rounded-2xl px-4" /></label>
            <label className="grid gap-1.5 text-sm font-medium"><span>Email</span><input required type="email" name="email" placeholder="Email" className="h-12 rounded-2xl px-4" /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium"><span>User ID</span><input required name="username" placeholder="User ID" className="h-12 rounded-2xl px-4" /></label>
              <label className="grid gap-1.5 text-sm font-medium"><span>Temporary password</span><input required minLength={10} autoComplete="new-password" type="password" name="password" placeholder="At least 10 characters" className="h-12 rounded-2xl px-4" /></label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium"><span>Role</span><select name="role" className="h-12 rounded-2xl px-4">
              <option value="project_manager">Project manager</option>
              <option value="content_team">Content team</option>
              <option value="leadership">Leadership</option>
            </select></label>
            <label className="grid gap-1.5 text-sm font-medium"><span>Linked CSR Associate</span><select name="vendorId" className="h-12 rounded-2xl px-4">
              <option value="">Link CSR Associate account later</option>
              {data.vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select></label>
            <div className="rounded-xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)]">
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
            <div className="rounded-xl bg-[#f8f9fc] p-4 ring-1 ring-[var(--border)]">
              <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Assign CSR Associates</p>
              <div className="grid gap-2 text-sm text-[var(--gray-mid)]">
                {data.vendors.map((vendor) => (
                  <label key={vendor.id} className="flex items-center gap-3">
                    <input type="checkbox" name="assignedVendorIds" value={vendor.id} />
                    <span>{vendor.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <ConfirmSubmitButton
              confirmMessage="Create this user?"
              pendingLabel="Creating..."
              className="rounded-lg bg-[var(--primary)] px-5 py-3 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]"
            >
              Create user
            </ConfirmSubmitButton>
          </div>
        </form></Drawer>} entries={data.users.map((user) => ({ id: user.id, search: `${user.fullName} ${user.username} ${user.role === "vendor" ? "CSR Associate" : user.role} ${data.vendors.find(vendor => user.assignedVendorIds.includes(vendor.id))?.name || ""}`, content: (
            <div className="grid items-start gap-4 p-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-base font-semibold text-[var(--foreground)]">{/^\d+$/.test(user.fullName) ? data.vendors.find(vendor => user.assignedVendorIds.includes(vendor.id))?.name || user.fullName : user.fullName}</h2>
                  <p className="mt-1 text-sm text-[var(--gray-mid)]">
                    {user.username} · {user.role === "vendor" ? "CSR Associate" : user.role.replaceAll("_", " ")}
                  </p>
                </div>
                <span className="rounded-full bg-[#f8f9fc] shrink-0 px-2 py-1 text-xs font-medium text-[var(--foreground)] ring-1 ring-[var(--border)]">
                  {user.isSuperAdmin ? "Super admin" : "Scoped access"}
                </span>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="text-sm">
                  <p className="text-[var(--gray-mid)]">Projects</p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">{user.isSuperAdmin ? "All projects" : user.assignedProjectIds.length}</p>
                </div>
                <div className="text-sm">
                  <p className="text-[var(--gray-mid)]">CSR Associates</p>
                  <p className="mt-1 font-medium text-[var(--foreground)]">{user.assignedVendorIds.length || "None"}</p>
                </div>
              </div>

              {user.isSuperAdmin ? null : (
                <Drawer title={`Edit access · ${user.fullName}`} trigger="Edit access">
                  <form action={updateWorkspaceUserAction} className="mt-4 grid gap-4">
                    <input type="hidden" name="userId" value={user.id} />
                    <label className="grid gap-1.5 text-sm font-medium"><span>Full name</span><input name="fullName" defaultValue={user.fullName} placeholder="Full name" className="h-12 rounded-2xl px-4" /></label>
                    <label className="grid gap-1.5 text-sm font-medium"><span>Email</span><input name="email" defaultValue={user.email} placeholder="Email" className="h-12 rounded-2xl px-4" /></label>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-1.5 text-sm font-medium"><span>User ID</span><input name="username" defaultValue={user.username} placeholder="User ID" className="h-12 rounded-2xl px-4" /></label>
                      <label className="grid gap-1.5 text-sm font-medium"><span>New password (optional)</span><input minLength={10} autoComplete="new-password" type="password" name="password" placeholder="At least 10 characters" className="h-12 rounded-2xl px-4" /></label>
                    </div>
                    <label className="grid gap-1.5 text-sm font-medium"><span>Role</span><select name="role" defaultValue={user.role} className="h-12 rounded-2xl px-4">
                      <option value="project_manager">Project manager</option>
                      <option value="content_team">Content team</option>
                      <option value="leadership">Leadership</option>
                      <option value="vendor">CSR Associate</option>
                    </select></label>
                    <div className="rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
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
                    <div className="rounded-xl bg-white p-4 ring-1 ring-[var(--border)]">
                      <p className="mb-3 text-sm font-medium text-[var(--foreground)]">Assigned CSR Associates</p>
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
                      <ConfirmSubmitButton
                        confirmMessage={`Save changes for ${user.fullName}?`}
                        pendingLabel="Saving..."
                        className="rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-white shadow-[0_12px_24px_rgba(93,99,255,0.18)]"
                      >
                        Save changes
                      </ConfirmSubmitButton>
                    </div>
                  </form>

                  <form action={deleteWorkspaceUserAction} className="mt-3">
                    <input type="hidden" name="userId" value={user.id} />
                    <ConfirmSubmitButton
                      confirmMessage={`Delete ${user.fullName}? This cannot be undone.`}
                      pendingLabel="Deleting..."
                      className="rounded-full border border-rose-500/18 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-500/16"
                    >
                      Delete user
                    </ConfirmSubmitButton>
                  </form>
                </Drawer>
              )}
            </div>
          ) }))} />
    </div>
  );
}
