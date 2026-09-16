-- ==========================================================================
-- CORAVIDA — database.  Three tables carry everything the admin and the
-- website need; row-level security decides who sees what.
--
--   content   what the website is made of (site.json) and what it may know
--             about the calendar (availability). Public to read, staff to write.
--   records   the books: bookings, blocks, invoices, payments, expenses, the
--             activity log and settings — one row per record, the record
--             itself as JSON, with the columns the queries need beside it.
--             Staff only.
--   inbox     what guests send through the forms. Anyone may add one (and only
--             add); staff read, update and delete.
--
-- "Staff" = any signed-in user. Sign-ups are closed; accounts are created by
-- the office. Every table has RLS on.
-- ==========================================================================

create table if not exists public.content (
  key      text primary key,
  data     jsonb not null,
  updated  timestamptz not null default now()
);

create table if not exists public.records (
  id       text primary key,
  kind     text not null check (kind in ('bookings','invoices','payments','expenses','blocks','log','settings')),
  updated  timestamptz not null default now(),
  deleted  boolean not null default false,
  data     jsonb not null
);
create index if not exists records_kind_idx on public.records (kind);
create index if not exists records_date_idx on public.records ((data->>'date'));
create index if not exists records_updated_idx on public.records (updated desc);

create table if not exists public.inbox (
  id          text primary key,
  at          timestamptz not null default now(),
  kind        text not null default 'enquiry' check (kind in ('enquiry','contact')),
  status      text not null default 'new' check (status in ('new','handled','archived')),
  data        jsonb not null,
  booking_ref text,
  handled_at  timestamptz,
  handled_by  text
);
create index if not exists inbox_status_idx on public.inbox (status, at desc);

-- ---- row-level security -------------------------------------------------
alter table public.content enable row level security;
alter table public.records enable row level security;
alter table public.inbox   enable row level security;

-- content: the website reads it, staff write it
drop policy if exists "content is public to read" on public.content;
create policy "content is public to read" on public.content
  for select to anon, authenticated using (true);
drop policy if exists "staff write content" on public.content;
create policy "staff write content" on public.content
  for insert to authenticated with check (true);
drop policy if exists "staff update content" on public.content;
create policy "staff update content" on public.content
  for update to authenticated using (true) with check (true);

-- records: staff only, all operations
drop policy if exists "staff read records" on public.records;
create policy "staff read records" on public.records
  for select to authenticated using (true);
drop policy if exists "staff insert records" on public.records;
create policy "staff insert records" on public.records
  for insert to authenticated with check (true);
drop policy if exists "staff update records" on public.records;
create policy "staff update records" on public.records
  for update to authenticated using (true) with check (true);

-- inbox: guests may only add; staff do the rest
-- (the guests' insert policy is defined at the end of this file)
drop policy if exists "staff read inbox" on public.inbox;
create policy "staff read inbox" on public.inbox
  for select to authenticated using (true);
drop policy if exists "staff update inbox" on public.inbox;
create policy "staff update inbox" on public.inbox
  for update to authenticated using (true) with check (true);
drop policy if exists "staff delete inbox" on public.inbox;
create policy "staff delete inbox" on public.inbox
  for delete to authenticated using (true);

-- the Data API needs the roles granted on the tables as well as RLS
grant usage on schema public to anon, authenticated;
grant select on public.content to anon, authenticated;
grant insert, update on public.content to authenticated;
grant select, insert, update on public.records to authenticated;
grant insert on public.inbox to anon, authenticated;
grant select, update, delete on public.inbox to authenticated;

-- the admin hears about changes made on another device the moment they land
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'records') then
    alter publication supabase_realtime add table public.records;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'inbox') then
    alter publication supabase_realtime add table public.inbox;
  end if;
end $$;

-- ---- storage: photographs the admin uploads ---------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('uploads', 'uploads', true, 15728640, array['image/jpeg','image/png','image/webp'])
  on conflict (id) do nothing;
drop policy if exists "uploads are public to read" on storage.objects;
create policy "uploads are public to read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'uploads');
drop policy if exists "staff upload photographs" on storage.objects;
create policy "staff upload photographs" on storage.objects
  for insert to authenticated with check (bucket_id = 'uploads');
drop policy if exists "staff replace photographs" on storage.objects;
create policy "staff replace photographs" on storage.objects
  for update to authenticated using (bucket_id = 'uploads') with check (bucket_id = 'uploads');
drop policy if exists "staff remove photographs" on storage.objects;
create policy "staff remove photographs" on storage.objects
  for delete to authenticated using (bucket_id = 'uploads');

-- Supabase's default privileges hand every role every verb on new tables;
-- take back what the public key has no business attempting.
revoke all on public.records from anon;
revoke select, update, delete, truncate, references, trigger on public.inbox from anon;
revoke insert, update, delete, truncate, references, trigger on public.content from anon;

-- ---- newer wins, decided here ------------------------------------------------
-- Every record carries the stamp of its last edit. A copy that is not newer
-- than what the row already holds is dropped, whichever device sends it and
-- however late it arrives. A stamp from a clock running ahead is pulled back
-- to now, so one wrong clock cannot lock a record against every other device;
-- the admin reads the stamp the database kept from the upsert's reply.
create or replace function public.keep_newer() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.updated > now() + interval '2 minutes' then new.updated := now(); end if;
  if tg_op = 'UPDATE' and new.updated <= old.updated then return null; end if;
  return new;
end $$;
drop trigger if exists records_keep_newer on public.records;
create trigger records_keep_newer before insert or update on public.records
  for each row execute function public.keep_newer();

-- ---- the inbox cannot be flooded ---------------------------------------------
-- The public key may add to the inbox, so a script could add without end and
-- bury real enquiries. A marina office hears from a handful of guests a day;
-- past a generous budget the insert is refused and the website falls back to
-- the prepared WhatsApp / e-mail message, so a guest still reaches the office.
create or replace function public.inbox_budget() returns trigger
language plpgsql security definer set search_path = '' as $$
declare recent int; today int;
begin
  select count(*) into recent from public.inbox where at > now() - interval '1 hour';
  select count(*) into today  from public.inbox where at > now() - interval '1 day';
  if recent >= 30 or today >= 150 then
    raise exception 'The inbox is busy — please reach us on WhatsApp or by e-mail.' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function public.inbox_budget() from public, anon, authenticated;
drop trigger if exists inbox_budget on public.inbox;
create trigger inbox_budget before insert on public.inbox
  for each row execute function public.inbox_budget();

-- ---- the inbox takes three things from a guest and nothing else -------------
-- The website sends an id, a kind and the form's data; the time is the
-- server's, and the handling columns are the office's alone.
revoke insert on public.inbox from anon;
grant insert (id, kind, data) on public.inbox to anon;
drop policy if exists "guests add to the inbox" on public.inbox;
create policy "guests add to the inbox" on public.inbox
  for insert to anon, authenticated
  with check (status = 'new' and booking_ref is null and handled_at is null and handled_by is null
              and at between now() - interval '5 minutes' and now() + interval '5 minutes'
              and length(id) <= 40 and kind in ('enquiry','contact')
              and length(data::text) < 12000);
