alter table public.vendors
  add column if not exists instagram_handle text,
  add column if not exists facebook_handle text;

comment on column public.vendors.instagram_handle is 'Optional Instagram handle or profile URL for the CSR Associate.';
comment on column public.vendors.facebook_handle is 'Optional Facebook page name or URL for the CSR Associate.';
