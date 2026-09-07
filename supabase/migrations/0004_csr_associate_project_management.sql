-- Allow CSR Associate accounts to manage only projects linked to their assigned CSR Associate records.

create policy "csr associates read assigned project links" on public.project_vendors
for select using (
  exists (
    select 1
    from public.users app_user
    where app_user.auth_user_id = auth.uid()
      and app_user.role = 'vendor'
      and public.project_vendors.vendor_id = any(app_user.assigned_vendor_ids)
  )
);

create policy "csr associates read assigned projects" on public.projects
for select using (
  exists (
    select 1
    from public.users app_user
    join public.project_vendors project_link
      on project_link.vendor_id = any(app_user.assigned_vendor_ids)
    where app_user.auth_user_id = auth.uid()
      and app_user.role = 'vendor'
      and project_link.project_id = public.projects.id
  )
);

create policy "csr associates update assigned projects" on public.projects
for update using (
  exists (
    select 1
    from public.users app_user
    join public.project_vendors project_link
      on project_link.vendor_id = any(app_user.assigned_vendor_ids)
    where app_user.auth_user_id = auth.uid()
      and app_user.role = 'vendor'
      and project_link.project_id = public.projects.id
  )
)
with check (
  exists (
    select 1
    from public.users app_user
    join public.project_vendors project_link
      on project_link.vendor_id = any(app_user.assigned_vendor_ids)
    where app_user.auth_user_id = auth.uid()
      and app_user.role = 'vendor'
      and project_link.project_id = public.projects.id
  )
);

create policy "csr associates delete assigned projects" on public.projects
for delete using (
  exists (
    select 1
    from public.users app_user
    join public.project_vendors project_link
      on project_link.vendor_id = any(app_user.assigned_vendor_ids)
    where app_user.auth_user_id = auth.uid()
      and app_user.role = 'vendor'
      and project_link.project_id = public.projects.id
  )
);
