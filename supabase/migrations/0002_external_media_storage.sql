alter table public.media_assets
  add column if not exists storage_provider text not null default 'supabase',
  add column if not exists external_file_id text,
  add column if not exists external_folder_id text,
  add column if not exists external_url text,
  add column if not exists size_bytes bigint not null default 0,
  add column if not exists uploaded_by_user_id uuid references public.users(id),
  add column if not exists uploaded_at timestamptz not null default timezone('utc', now());

update public.media_assets
set
  storage_provider = coalesce(storage_provider, 'supabase'),
  external_file_id = coalesce(external_file_id, id::text),
  external_folder_id = coalesce(external_folder_id, 'project-media/projects/unassigned'),
  external_url = coalesce(external_url, 'supabase://project-media/projects/unassigned/' || id::text),
  uploaded_at = coalesce(uploaded_at, created_at);
