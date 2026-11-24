-- Add the names and attribution needed for clear, personalized notification copy.
alter table public.email_notifications
  add column if not exists recipient_name text,
  add column if not exists context_name text;

alter table public.projects
  add column if not exists created_by_user_id uuid references public.users(id) on delete set null,
  add column if not exists updated_by_user_id uuid references public.users(id) on delete set null;

alter table public.users
  add column if not exists notification_actor_user_id uuid references public.users(id) on delete set null;

update public.email_notifications n set recipient_name=coalesce(
  (select nullif(trim(u.full_name),'') from public.users u where lower(trim(u.email))=lower(trim(n.recipient)) limit 1),
  (select nullif(trim(v.primary_contact_name),'') from public.vendors v where lower(trim(v.email))=lower(trim(n.recipient)) limit 1),
  split_part(n.recipient,'@',1)
) where n.recipient_name is null;

create or replace function public.enqueue_project_email_context(
  p_project_id uuid,
  p_label text,
  p_fields text[],
  p_actor uuid,
  p_context text
) returns void language plpgsql security definer set search_path=public as $$
declare event_uuid uuid := gen_random_uuid();
begin
  insert into public.email_notifications(
    event_id, project_id, recipient, recipient_name, project_name,
    event_label, changed_fields, actor_name, context_name
  )
  select event_uuid, p.id, r.email,
    coalesce(
      (select nullif(trim(u.full_name),'') from public.users u where lower(trim(u.email))=r.email limit 1),
      (select nullif(trim(v.primary_contact_name),'') from public.vendors v where lower(trim(v.email))=r.email limit 1),
      split_part(r.email,'@',1)
    ),
    p.name, p_label, coalesce(p_fields,'{}'), actor.full_name, p_context
  from public.projects p
  cross join public.project_email_recipients(p_project_id) r
  left join public.users actor on actor.id=p_actor
  where p.id=p_project_id;
end;
$$;

-- Preserve the original helper signature for existing callers.
create or replace function public.enqueue_project_email(
  p_project_id uuid,
  p_label text,
  p_fields text[] default '{}',
  p_actor uuid default null
) returns void language plpgsql security definer set search_path=public as $$
begin
  perform public.enqueue_project_email_context(p_project_id,p_label,p_fields,p_actor,null);
end;
$$;

create or replace function public.capture_project_email() returns trigger language plpgsql security definer set search_path=public as $$
declare pid uuid; fields text[]; before_row jsonb; after_row jsonb; context text;
begin
  if tg_table_name='projects' then
    if tg_op='INSERT' then
      perform public.enqueue_project_email_context(new.id,'Project created','{}',new.created_by_user_id,null);
    else
      before_row := to_jsonb(old) - array['updated_at','health_score','content_readiness_average','created_by_user_id','updated_by_user_id'];
      after_row := to_jsonb(new) - array['updated_at','health_score','content_readiness_average','created_by_user_id','updated_by_user_id'];
      select array_agg(key order by key) into fields from jsonb_each(after_row) where value is distinct from before_row->key;
      if cardinality(fields)>0 then
        perform public.enqueue_project_email_context(new.id,'Project details updated',fields,new.updated_by_user_id,null);
      end if;
    end if;
  elsif tg_table_name='project_vendors' then
    if tg_op='DELETE' then
      pid:=old.project_id;
      select name into context from public.vendors where id=old.vendor_id;
      perform public.enqueue_project_email_context(pid,'CSR organisation unlinked','{}',null,context);
    else
      pid:=new.project_id;
      select name into context from public.vendors where id=new.vendor_id;
      perform public.enqueue_project_email_context(pid,'CSR organisation joined','{}',null,context);
    end if;
  elsif tg_table_name='updates' then
    if tg_op='INSERT' then
      perform public.enqueue_project_email_context(new.project_id,'Activity update submitted','{}',new.submitted_by_user_id,null);
    else
      before_row := to_jsonb(old)-array['updated_at','readiness_score','status','revision_count'];
      after_row := to_jsonb(new)-array['updated_at','readiness_score','status','revision_count'];
      if before_row is distinct from after_row then perform public.enqueue_project_email_context(new.project_id,'Activity details updated','{}',null,null); end if;
    end if;
  elsif tg_table_name='approvals' then
    select project_id into pid from public.updates where id=new.update_id;
    perform public.enqueue_project_email_context(pid,case new.action
      when 'approve' then 'Activity approval recorded' when 'reject' then 'Activity rejection recorded'
      when 'request_revision' then 'Activity revision requested' else 'Activity escalated for review' end,'{}',new.reviewer_user_id,null);
  elsif tg_table_name='users' then
    if tg_op='UPDATE' then
      if new.assigned_vendor_ids=old.assigned_vendor_ids and
        (new.role='vendor' or new.assigned_project_ids=old.assigned_project_ids) and new.role=old.role then return new; end if;
      for pid in select p.id from public.projects p where
        (p.id=any(new.assigned_project_ids)) is distinct from (p.id=any(old.assigned_project_ids)) or
        exists(select 1 from public.project_vendors pv where pv.project_id=p.id and
          (pv.vendor_id=any(new.assigned_vendor_ids)) is distinct from (pv.vendor_id=any(old.assigned_vendor_ids))) or
        (new.role<>old.role and (p.id=any(new.assigned_project_ids) or exists(select 1 from public.project_vendors pv where pv.project_id=p.id and pv.vendor_id=any(new.assigned_vendor_ids))))
      loop perform public.enqueue_project_email_context(pid,'Team assignment changed','{}',new.notification_actor_user_id,new.full_name); end loop;
    else
      for pid in select p.id from public.projects p where p.id=any(new.assigned_project_ids) or exists(
        select 1 from public.project_vendors pv where pv.project_id=p.id and pv.vendor_id=any(new.assigned_vendor_ids))
      loop perform public.enqueue_project_email_context(pid,'Team member assigned','{}',new.notification_actor_user_id,new.full_name); end loop;
    end if;
  end if;
  return null;
end;
$$;

revoke all on function public.enqueue_project_email_context(uuid,text,text[],uuid,text) from public,anon,authenticated;
grant execute on function public.enqueue_project_email_context(uuid,text,text[],uuid,text) to service_role;
