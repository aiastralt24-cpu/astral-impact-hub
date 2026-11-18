alter table public.users
  add column if not exists active_session_token text unique,
  add column if not exists active_session_expires_at timestamptz;

create index if not exists users_active_session_token_idx
  on public.users (active_session_token)
  where active_session_token is not null;

create or replace function public.claim_user_session(p_user_id uuid, p_token text, p_expires_at timestamptz)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set active_session_token = p_token,
      active_session_expires_at = p_expires_at
  where id = p_user_id
    and (
      active_session_token is null
      or active_session_expires_at is null
      or active_session_expires_at <= timezone('utc', now())
    );
  return found;
end;
$$;

create or replace function public.release_user_session(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.users
  set active_session_token = null,
      active_session_expires_at = null
  where active_session_token = p_token;
$$;

revoke all on function public.claim_user_session(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.release_user_session(text) from public, anon, authenticated;
grant execute on function public.claim_user_session(uuid, text, timestamptz) to service_role;
grant execute on function public.release_user_session(text) to service_role;
