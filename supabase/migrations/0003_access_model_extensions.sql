alter table public.users
  add column if not exists username text unique,
  add column if not exists password text,
  add column if not exists assigned_project_ids uuid[] not null default '{}',
  add column if not exists assigned_vendor_ids uuid[] not null default '{}',
  add column if not exists managed_by_user_id uuid references public.users(id),
  add column if not exists is_super_admin boolean not null default false;

create index if not exists users_username_idx on public.users (username);

update public.users
set
  username = coalesce(username, split_part(email, '@', 1)),
  password = coalesce(password, ''),
  assigned_project_ids = coalesce(assigned_project_ids, '{}'),
  assigned_vendor_ids = coalesce(assigned_vendor_ids, '{}'),
  is_super_admin = coalesce(is_super_admin, false)
where
  username is null
  or password is null;
