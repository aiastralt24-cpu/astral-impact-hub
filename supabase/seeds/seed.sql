insert into public.users (id, full_name, email, role)
values
  ('11111111-1111-4111-8111-111111111111', 'Aniket Dhuri', 'aniket@astral.test', 'admin'),
  ('22222222-2222-4222-8222-222222222222', 'Project Manager', 'pm@astral.test', 'project_manager'),
  ('33333333-3333-4333-8333-333333333333', 'Content Lead', 'content@astral.test', 'content_team')
on conflict do nothing;

insert into public.vendors (id, name, primary_contact_name, email, whatsapp_phone, organization_type, geographical_scope)
values
  ('44444444-4444-4444-8444-444444444444', 'WildRoots Conservation', 'Riya Kale', 'riya@wildroots.test', '+919999999999', 'NGO', '{"Maharashtra"}')
on conflict do nothing;

insert into public.projects (
  id,
  name,
  category,
  sub_category,
  state,
  district,
  start_date,
  end_date,
  budget_inr,
  reporting_frequency,
  internal_owner_id,
  status,
  health_score
)
values (
  '55555555-5555-4555-8555-555555555555',
  'Tadoba Waterhole Revival',
  'Wildlife',
  'Waterhole',
  'Maharashtra',
  'Chandrapur',
  '2026-04-01',
  '2026-09-30',
  2500000,
  'weekly',
  '22222222-2222-4222-8222-222222222222',
  'active',
  84
)
on conflict do nothing;

insert into public.project_vendors (project_id, vendor_id)
values ('55555555-5555-4555-8555-555555555555', '44444444-4444-4444-8444-444444444444')
on conflict do nothing;
