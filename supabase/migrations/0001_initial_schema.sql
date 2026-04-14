create extension if not exists "pgcrypto";

create type app_role as enum ('admin', 'project_manager', 'vendor', 'content_team', 'leadership');
create type project_status as enum ('draft', 'active', 'on_hold', 'at_risk', 'completed', 'archived');
create type update_status as enum ('draft', 'pending', 'in_review', 'revision_requested', 'approved', 'rejected', 'published');
create type distribution_channel as enum ('telegram', 'whatsapp', 'instagram');
create type approval_stage as enum ('manager', 'admin', 'system');
create type approval_action as enum ('approve', 'request_revision', 'reject', 'escalate');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  full_name text not null,
  email text not null unique,
  role app_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_contact_name text not null,
  whatsapp_phone text,
  email text,
  organization_type text,
  geographical_scope text[] not null default '{}',
  contract_valid_until date,
  rate_card_inr numeric(12,2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  sub_category text not null,
  state text not null,
  district text not null,
  coordinates point,
  start_date date not null,
  end_date date not null,
  budget_inr numeric(12,2) not null,
  reporting_frequency text not null,
  internal_owner_id uuid references public.users(id),
  project_brief text,
  beneficiary_target integer,
  strategic_tags text[] not null default '{}',
  emotional_tags text[] not null default '{}',
  status project_status not null default 'draft',
  health_score integer not null default 0,
  content_readiness_average integer not null default 0,
  require_admin_approval boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.project_vendors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  assigned_at timestamptz not null default timezone('utc', now()),
  unique(project_id, vendor_id)
);

create table if not exists public.updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  vendor_id uuid references public.vendors(id),
  submitted_by_user_id uuid references public.users(id),
  happened_at date not null,
  description text not null,
  beneficiaries_count integer,
  beneficiary_type text,
  milestone_label text,
  progress_percent integer not null check (progress_percent between 0 and 100),
  work_duration text,
  why_it_matters text,
  highlight_moment text,
  quote text,
  challenges text,
  next_steps text,
  social_media_worthy boolean not null default false,
  urgent boolean not null default false,
  documentation_only boolean not null default false,
  sensitive_content boolean not null default false,
  readiness_score integer not null default 0,
  revision_count integer not null default 0,
  status update_status not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.updates(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text not null,
  caption text,
  is_cover boolean not null default false,
  width integer,
  height integer,
  duration_seconds integer,
  checksum text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.approvals (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.updates(id) on delete cascade,
  stage approval_stage not null,
  action approval_action not null,
  reviewer_user_id uuid references public.users(id),
  comment text,
  field_comments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.generated_content (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.updates(id) on delete cascade,
  prompt_version text not null default 'v1.0',
  emotional_hook text not null,
  instagram_caption_short text not null,
  instagram_caption_long text not null,
  reel_script text not null,
  carousel_breakdown jsonb not null default '[]'::jsonb,
  telegram_update text not null,
  whatsapp_digest text not null,
  csr_summary text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.distribution_log (
  id uuid primary key default gen_random_uuid(),
  update_id uuid not null references public.updates(id) on delete cascade,
  generated_content_id uuid references public.generated_content(id),
  channel distribution_channel not null,
  provider_message_id text,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.vendor_scores (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete cascade,
  score integer not null check (score between 0 and 100),
  calculated_at timestamptz not null default timezone('utc', now()),
  notes jsonb not null default '{}'::jsonb
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.users(id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create trigger users_set_updated_at before update on public.users for each row execute procedure public.set_updated_at();
create trigger vendors_set_updated_at before update on public.vendors for each row execute procedure public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
create trigger updates_set_updated_at before update on public.updates for each row execute procedure public.set_updated_at();
create trigger generated_content_set_updated_at before update on public.generated_content for each row execute procedure public.set_updated_at();

alter table public.users enable row level security;
alter table public.vendors enable row level security;
alter table public.projects enable row level security;
alter table public.project_vendors enable row level security;
alter table public.updates enable row level security;
alter table public.media_assets enable row level security;
alter table public.approvals enable row level security;
alter table public.generated_content enable row level security;
alter table public.distribution_log enable row level security;
alter table public.vendor_scores enable row level security;
alter table public.audit_events enable row level security;

create policy "users read self or admin" on public.users
for select using (
  auth.uid() = auth_user_id
  or exists (
    select 1 from public.users app_user
    where app_user.auth_user_id = auth.uid()
      and app_user.role = 'admin'
  )
);

create policy "admin full vendors" on public.vendors
for all using (
  exists (
    select 1 from public.users app_user
    where app_user.auth_user_id = auth.uid()
      and app_user.role = 'admin'
  )
);

create policy "project read by privileged roles" on public.projects
for select using (
  exists (
    select 1 from public.users app_user
    where app_user.auth_user_id = auth.uid()
      and app_user.role in ('admin', 'project_manager', 'content_team', 'leadership')
  )
);

create policy "project update by managers and admins" on public.projects
for update using (
  exists (
    select 1 from public.users app_user
    where app_user.auth_user_id = auth.uid()
      and (
        app_user.role = 'admin'
        or (app_user.role = 'project_manager' and public.projects.internal_owner_id = app_user.id)
      )
  )
);

create policy "updates by permitted roles" on public.updates
for select using (
  exists (
    select 1 from public.users app_user
    where app_user.auth_user_id = auth.uid()
      and (
        app_user.role = 'admin'
        or app_user.role = 'content_team'
        or app_user.role = 'leadership'
        or (app_user.role = 'project_manager' and public.updates.project_id in (
          select p.id from public.projects p where p.internal_owner_id = app_user.id
        ))
        or (app_user.role = 'vendor' and public.updates.submitted_by_user_id = app_user.id)
      )
  )
);

create policy "vendors manage own updates" on public.updates
for insert with check (
  exists (
    select 1 from public.users app_user
    where app_user.auth_user_id = auth.uid()
      and app_user.role = 'vendor'
      and app_user.id = public.updates.submitted_by_user_id
  )
);

create policy "admin and manager approvals" on public.approvals
for all using (
  exists (
    select 1 from public.users app_user
    where app_user.auth_user_id = auth.uid()
      and app_user.role in ('admin', 'project_manager', 'content_team')
  )
);
