begin;

create table if not exists public.crm_checklists (
  user_id uuid primary key references auth.users(id) on delete cascade,
  items jsonb not null default '[false,false,false,false,false,false,false,false,false,false]'::jsonb,
  schema_version smallint not null default 1 check (schema_version = 1),
  updated_at timestamptz not null default now(),
  constraint crm_checklists_items_shape check (
    jsonb_typeof(items) = 'array'
    and jsonb_array_length(items) = 10
  )
);

alter table public.crm_checklists enable row level security;
revoke all on public.crm_checklists from anon, authenticated;
grant select, insert, update, delete on public.crm_checklists to authenticated;

drop policy if exists crm_checklists_select_own on public.crm_checklists;
create policy crm_checklists_select_own on public.crm_checklists
for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists crm_checklists_insert_own on public.crm_checklists;
create policy crm_checklists_insert_own on public.crm_checklists
for insert to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists crm_checklists_update_own on public.crm_checklists;
create policy crm_checklists_update_own on public.crm_checklists
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists crm_checklists_delete_own on public.crm_checklists;
create policy crm_checklists_delete_own on public.crm_checklists
for delete to authenticated
using (user_id = (select auth.uid()));

commit;
