-- OnBox CRM Supabase integration. Additive only; run in a development database first.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z0-9._-]{2,40}$'),
  display_name text not null,
  role text not null default 'sales' check (role in ('sales','manager')),
  must_change_password boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.is_crm_manager()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'manager');
$$;
revoke all on function public.is_crm_manager() from public;
grant execute on function public.is_crm_manager() to authenticated;

drop policy if exists profiles_select_self_or_manager on public.profiles;
create policy profiles_select_self_or_manager on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select public.is_crm_manager()));
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

alter table public.leads add column if not exists owner_auth_id uuid references auth.users(id);
alter table public.leads add column if not exists updated_at timestamptz not null default now();
create index if not exists leads_owner_auth_id_idx on public.leads(owner_auth_id);

-- Do not auto-assign legacy rows. Explicitly reconcile/import after user provisioning.
drop policy if exists leads_select_owner_or_manager on public.leads;
create policy leads_select_owner_or_manager on public.leads
for select to authenticated using (owner_auth_id = (select auth.uid()) or (select public.is_crm_manager()));

drop policy if exists leads_insert_owner_or_manager on public.leads;
create policy leads_insert_owner_or_manager on public.leads
for insert to authenticated with check (
  (owner_auth_id = (select auth.uid()) and not (select public.is_crm_manager()))
  or ((select public.is_crm_manager()) and owner_auth_id is not null)
);

drop policy if exists leads_update_owner_or_manager on public.leads;
create policy leads_update_owner_or_manager on public.leads
for update to authenticated
using (owner_auth_id = (select auth.uid()) or (select public.is_crm_manager()))
with check (owner_auth_id = (select auth.uid()) or (select public.is_crm_manager()));

drop policy if exists leads_delete_owner_or_manager on public.leads;
create policy leads_delete_owner_or_manager on public.leads
for delete to authenticated using (owner_auth_id = (select auth.uid()) or (select public.is_crm_manager()));

-- Keep legacy public.users.password untouched for rollback/audit, but do not grant browser access to it.
revoke all on public.users from anon, authenticated;
-- The app uses Supabase Auth + profiles. Existing report/config tables remain locked until their policies are designed.
commit;
