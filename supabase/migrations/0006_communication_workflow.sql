-- Persist review state and provider receipts. Existing content starts unapproved.
alter table public.generated_content add column if not exists workflow jsonb not null default '{}'::jsonb;
alter table public.distribution_log add column if not exists idempotency_key text;
create unique index if not exists distribution_log_idempotency on public.distribution_log(idempotency_key) where idempotency_key is not null;

-- All mutations for one update serialize; stale editors cannot overwrite approvals.
create or replace function public.save_communication(p_update_id uuid, p_expected_revision integer, p_content jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare current_row public.generated_content; result_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_update_id::text, 0));
  select * into current_row from public.generated_content where update_id = p_update_id order by created_at desc limit 1 for update;
  if coalesce((current_row.workflow->>'revision')::integer,0) <> p_expected_revision then raise exception 'STALE_CONTENT'; end if;
  if exists(select 1 from public.distribution_log where update_id = p_update_id and status in ('sending','unknown')) then raise exception 'DELIVERY_UNRESOLVED'; end if;
  if current_row.id is null then
    insert into public.generated_content(update_id,emotional_hook,instagram_caption_short,instagram_caption_long,reel_script,carousel_breakdown,telegram_update,whatsapp_digest,csr_summary,workflow)
    values(p_update_id,p_content->>'emotionalHook',p_content->>'instagramCaptionShort',p_content->>'instagramCaptionLong',p_content->>'reelScript',p_content->'carouselBreakdown',p_content->>'telegramUpdate',p_content->>'whatsappDigest',p_content->>'csrSummary',p_content->'workflow') returning id into result_id;
  else
    update public.generated_content set emotional_hook=p_content->>'emotionalHook',instagram_caption_short=p_content->>'instagramCaptionShort',instagram_caption_long=p_content->>'instagramCaptionLong',reel_script=p_content->>'reelScript',carousel_breakdown=p_content->'carouselBreakdown',telegram_update=p_content->>'telegramUpdate',whatsapp_digest=p_content->>'whatsappDigest',csr_summary=p_content->>'csrSummary',workflow=p_content->'workflow' where id=current_row.id returning id into result_id;
  end if;
  return result_id;
end $$;

create or replace function public.claim_communication_delivery(p_content_id uuid,p_revision integer,p_key text,p_channel public.distribution_channel,p_destination text)
returns uuid language plpgsql security definer set search_path = public as $$
declare content_row public.generated_content; delivery public.distribution_log; update_id_value uuid;
begin
  select update_id into update_id_value from public.generated_content where id=p_content_id;
  perform pg_advisory_xact_lock(hashtextextended(update_id_value::text,0));
  select * into content_row from public.generated_content where id=p_content_id for update;
  if content_row.id is null or content_row.workflow->>'status' is distinct from 'approved' or coalesce((content_row.workflow->>'revision')::integer,0) <> p_revision then raise exception 'NOT_APPROVED'; end if;
  if not exists(select 1 from public.updates where id=content_row.update_id and status in ('approved','published')) then raise exception 'NOT_APPROVED'; end if;
  if content_row.workflow->>'sourceUpdatedAt' is not null and not exists(select 1 from public.updates where id=content_row.update_id and updated_at=(content_row.workflow->>'sourceUpdatedAt')::timestamptz) then raise exception 'NOT_APPROVED'; end if;
  select * into delivery from public.distribution_log where idempotency_key=p_key for update;
  if delivery.id is not null and delivery.status <> 'failed' then raise exception 'ALREADY_ATTEMPTED'; end if;
  if delivery.id is not null then
    update public.distribution_log set status='sending',payload=jsonb_build_object('message','Sending to provider','revision',p_revision,'destination',p_destination),provider_message_id=null where id=delivery.id;
    return delivery.id;
  end if;
  insert into public.distribution_log(update_id,generated_content_id,channel,status,idempotency_key,payload)
  values(content_row.update_id,p_content_id,p_channel,'sending',p_key,jsonb_build_object('message','Sending to provider','revision',p_revision,'destination',p_destination)) returning * into delivery;
  return delivery.id;
end $$;
revoke all on function public.save_communication(uuid,integer,jsonb) from public,anon,authenticated;
revoke all on function public.claim_communication_delivery(uuid,integer,text,public.distribution_channel,text) from public,anon,authenticated;
grant execute on function public.save_communication(uuid,integer,jsonb) to service_role;
grant execute on function public.claim_communication_delivery(uuid,integer,text,public.distribution_channel,text) to service_role;
