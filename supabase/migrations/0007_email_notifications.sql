-- Transactional notifications: a saved change and its recipient queue commit together.
create table public.email_notifications (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  recipient text not null,
  project_name text not null,
  event_label text not null,
  changed_fields text[] not null default '{}',
  actor_name text,
  status text not null default 'pending' check (status in ('pending','sending','accepted','failed','cancelled')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  lease_until timestamptz,
  lease_token uuid,
  request_payload jsonb,
  provider_id text,
  last_error text,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique(event_id,recipient)
);
alter table public.email_notifications enable row level security;
revoke all on public.email_notifications from anon, authenticated;
grant all on public.email_notifications to service_role;
create index email_notifications_pending on public.email_notifications(status,available_at);

-- No passwords, activity text, private comments, or attachments are copied to email.
create function public.project_email_recipients(p_project_id uuid)
returns table(email text) language sql stable security definer set search_path = public as $$
  select distinct lower(trim(address)) from (
    select u.email as address from public.users u join public.projects p on p.id=p_project_id
    where u.role='admin' or u.is_super_admin or
      (u.role <> 'vendor' and (u.id=p.internal_owner_id or p.id=any(u.assigned_project_ids) or exists (
        select 1 from public.project_vendors pv where pv.project_id=p.id and pv.vendor_id=any(u.assigned_vendor_ids)
      ))) or (u.role='vendor' and exists (
        select 1 from public.project_vendors pv where pv.project_id=p.id and pv.vendor_id=any(u.assigned_vendor_ids)
      ))
    union all
    select v.email from public.vendors v join public.project_vendors pv on pv.vendor_id=v.id where pv.project_id=p_project_id
  ) addresses where trim(address) ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$';
$$;

create function public.enqueue_project_email(p_project_id uuid, p_label text, p_fields text[] default '{}', p_actor uuid default null)
returns void language plpgsql security definer set search_path = public as $$
declare event_uuid uuid := gen_random_uuid();
begin
  insert into public.email_notifications(event_id,project_id,recipient,project_name,event_label,changed_fields,actor_name)
  select event_uuid,p.id,r.email,p.name,p_label,p_fields,u.full_name
  from public.projects p cross join public.project_email_recipients(p_project_id) r
  left join public.users u on u.id=p_actor where p.id=p_project_id;
end;
$$;

create function public.capture_project_email() returns trigger language plpgsql security definer set search_path=public as $$
declare pid uuid; fields text[]; before_row jsonb; after_row jsonb;
begin
  if tg_table_name='projects' then
    if tg_op='INSERT' then
      perform public.enqueue_project_email(new.id,'Project created');
    else
      before_row := to_jsonb(old) - array['updated_at','health_score','content_readiness_average'];
      after_row := to_jsonb(new) - array['updated_at','health_score','content_readiness_average'];
      select array_agg(key order by key) into fields from jsonb_each(after_row) where value is distinct from before_row->key;
      if cardinality(fields)>0 then perform public.enqueue_project_email(new.id,'Project details updated',fields); end if;
    end if;
  elsif tg_table_name='project_vendors' then
    if tg_op='DELETE' then pid:=old.project_id; else pid:=new.project_id; end if;
    perform public.enqueue_project_email(pid,'CSR assignment changed');
  elsif tg_table_name='updates' then
    if tg_op='INSERT' then
      perform public.enqueue_project_email(new.project_id,'Activity update submitted','{}',new.submitted_by_user_id);
    else
      -- Approval status is notified by the approvals trigger, not twice here.
      before_row := to_jsonb(old)-array['updated_at','readiness_score','status','revision_count'];
      after_row := to_jsonb(new)-array['updated_at','readiness_score','status','revision_count'];
      if before_row is distinct from after_row then perform public.enqueue_project_email(new.project_id,'Activity details updated'); end if;
    end if;
  elsif tg_table_name='approvals' then
    select project_id into pid from public.updates where id=new.update_id;
    perform public.enqueue_project_email(pid,case new.action
      when 'approve' then 'Activity approval recorded' when 'reject' then 'Activity rejection recorded'
      when 'request_revision' then 'Activity revision requested' else 'Activity escalated for review' end,'{}',new.reviewer_user_id);
  elsif tg_table_name='users' then
    if tg_op='UPDATE' then
      -- Derived project memberships of CSR accounts are maintained by project saves.
      if new.assigned_vendor_ids=old.assigned_vendor_ids and
        (new.role='vendor' or new.assigned_project_ids=old.assigned_project_ids) and new.role=old.role then return new; end if;
      for pid in select p.id from public.projects p where
        (p.id=any(new.assigned_project_ids)) is distinct from (p.id=any(old.assigned_project_ids)) or
        exists(select 1 from public.project_vendors pv where pv.project_id=p.id and
          (pv.vendor_id=any(new.assigned_vendor_ids)) is distinct from (pv.vendor_id=any(old.assigned_vendor_ids))) or
        (new.role<>old.role and (p.id=any(new.assigned_project_ids) or exists(select 1 from public.project_vendors pv where pv.project_id=p.id and pv.vendor_id=any(new.assigned_vendor_ids))))
      loop perform public.enqueue_project_email(pid,'Team assignment changed'); end loop;
    else
      for pid in select p.id from public.projects p where p.id=any(new.assigned_project_ids) or exists(
        select 1 from public.project_vendors pv where pv.project_id=p.id and pv.vendor_id=any(new.assigned_vendor_ids))
      loop perform public.enqueue_project_email(pid,'Team member assigned'); end loop;
    end if;
  end if;
  return null;
end;
$$;
create trigger projects_email after insert or update on public.projects for each row execute function public.capture_project_email();
create trigger project_vendors_email after insert or delete on public.project_vendors for each row execute function public.capture_project_email();
create trigger updates_email after insert or update on public.updates for each row execute function public.capture_project_email();
create trigger approvals_email after insert on public.approvals for each row execute function public.capture_project_email();
create trigger users_assignment_email after insert or update on public.users for each row execute function public.capture_project_email();

-- A lease and token protect concurrent request/cron workers. Retry only within
-- 23 hours of first attempt: Resend retains idempotency keys for 24 hours.
create function public.claim_project_emails(p_limit integer default 5)
returns setof public.email_notifications language plpgsql security definer set search_path=public as $$
begin
  update public.email_notifications set status='failed',last_error='Retry window or attempt limit exceeded; reconcile with Resend before resending.'
    where status in ('pending','sending') and (lease_until is null or lease_until<now())
    and (first_attempt_at<now()-interval '23 hours' or attempts>=8);
  update public.email_notifications n set status='cancelled',last_error='Recipient no longer assigned to this project.'
    where n.status in ('pending','sending') and (n.lease_until is null or n.lease_until<now())
    and not exists(select 1 from public.project_email_recipients(n.project_id) r where r.email=n.recipient);
  return query with candidates as (
    select id from public.email_notifications where
      (status='pending' and available_at<=now()) or (status='sending' and lease_until<now())
    order by created_at for update skip locked limit least(greatest(p_limit,1),5)
  ) update public.email_notifications n set status='sending',attempts=n.attempts+1,
    first_attempt_at=coalesce(n.first_attempt_at,now()),lease_until=now()+interval '5 minutes',lease_token=gen_random_uuid()
    from candidates c where n.id=c.id returning n.*;
end;
$$;
revoke all on function public.project_email_recipients(uuid) from public,anon,authenticated;
revoke all on function public.enqueue_project_email(uuid,text,text[],uuid) from public,anon,authenticated;
revoke all on function public.capture_project_email() from public,anon,authenticated;
revoke all on function public.claim_project_emails(integer) from public,anon,authenticated;
grant execute on function public.project_email_recipients(uuid), public.claim_project_emails(integer) to service_role;
