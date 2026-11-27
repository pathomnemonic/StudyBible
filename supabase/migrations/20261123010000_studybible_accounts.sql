-- StudyBible accounts: one per app, on top of the shared sign-in.
--
-- The project has ONE sign-in pool (auth.users): one entry per email address and per Google identity, which is how Supabase Auth works. What belongs to StudyBible
-- is a StudyBible ACCOUNT, a row in studybible.accounts that the person creates in StudyBible on purpose. Signing in anywhere else does not create one, and no
-- StudyBible function works without it. An account has its own display name, its own synced data and (if there ever were one) its own subscription, and deleting it
-- removes that account and its data and nothing belonging to any other app. This migration upgrades the first one: `profiles` becomes `accounts`, the sync
-- functions require an account, and `delete_my_data` becomes `delete_account`.

do $$ begin
  if to_regclass('studybible.profiles') is not null and to_regclass('studybible.accounts') is null then
    alter table studybible.profiles rename to accounts;
    alter policy profiles_select_own on studybible.accounts rename to accounts_select_own;
  end if;
end $$;
create table if not exists studybible.accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
alter table studybible.accounts enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'studybible' and tablename = 'accounts' and policyname = 'accounts_select_own') then
    create policy accounts_select_own on studybible.accounts for select to authenticated using (user_id = (select auth.uid()));
  end if;
end $$;
revoke all on studybible.accounts from public, anon, authenticated;
grant select on studybible.accounts to authenticated;

-- a real, signed-in person who ALSO has a StudyBible account
create or replace function studybible.account_caller() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := studybible.caller();
begin
  if not exists (select 1 from studybible.accounts a where a.user_id = me) then raise exception 'no StudyBible account' using errcode = 'P0002'; end if;
  return me;
end $$;

-- does the signed-in person have a StudyBible account yet? (works before they do)
create or replace function studybible.account_status() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := studybible.caller(); a studybible.accounts%rowtype;
begin
  select * into a from studybible.accounts x where x.user_id = me;
  if not found then return jsonb_build_object('exists', false); end if;
  return jsonb_build_object('exists', true, 'name', a.display_name, 'createdAt', floor(extract(epoch from a.created_at) * 1000));
end $$;

-- create the StudyBible account for the signed-in person (the app calls this when they choose to; calling it again changes nothing)
create or replace function studybible.create_account(p_name text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := studybible.caller();
begin
  insert into studybible.accounts (user_id, display_name) values (me, nullif(left(btrim(coalesce(p_name, '')), 80), '')) on conflict (user_id) do nothing;
  insert into studybible.sync_state (user_id) values (me) on conflict (user_id) do nothing;
  return studybible.account_status();
end $$;

create or replace function studybible.sync(p_protocol integer, p_cursor bigint, p_changes jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid := studybible.account_caller();
  held boolean; c jsonb; v_tbl text; v_uid text; v_payload jsonb; v_body text; stamp bigint; ex record; new_seq bigint;
  rejected integer := 0; mine text[] := '{}';
  now_ms bigint := floor(extract(epoch from clock_timestamp()) * 1000);
  st studybible.sync_state%rowtype;
  rows jsonb; last_seq bigint; n integer;
  cursor_in bigint := greatest(coalesce(p_cursor, 0), 0);
begin
  if p_protocol is not null and p_protocol > 1 then raise exception 'This app is newer than the sync service. Update the service.' using errcode = '22023'; end if;
  if p_changes is null then p_changes := '[]'::jsonb; end if;
  if jsonb_typeof(p_changes) <> 'array' then raise exception 'changes must be a list' using errcode = '22023'; end if;
  if jsonb_array_length(p_changes) > 1000 then raise exception 'Send at most 1000 changes per request.' using errcode = '22023'; end if;

  insert into studybible.sync_state (user_id) values (me) on conflict (user_id) do nothing;
  select * into st from studybible.sync_state where user_id = me for update; -- one person's writes go one at a time, so `seq` never goes out of order

  for c in select * from jsonb_array_elements(p_changes) loop
    if jsonb_typeof(c) <> 'object' or jsonb_typeof(c -> 'table') <> 'string' or jsonb_typeof(c -> 'uid') <> 'string' or jsonb_typeof(c -> 'updatedAt') <> 'number' then rejected := rejected + 1; continue; end if;
    v_tbl := c ->> 'table'; v_uid := c ->> 'uid';
    if char_length(v_uid) > 200 or v_tbl not in ('notes','highlights','bookmarks','folders','collections','userXrefs','journal','userPlans','saved','media','userLinks','planProgress','episodeProgress','libraryProgress','classes','classwork','queue','savedSearches','memory','settings') then rejected := rejected + 1; continue; end if;
    v_payload := coalesce(c -> 'payload', '{}'::jsonb);
    if not studybible.payload_ok(v_tbl, c -> 'payload', coalesce((c ->> 'deleted')::boolean, false)) then rejected := rejected + 1; continue; end if;
    v_body := v_payload::text;
    if octet_length(v_body) > 262144 then rejected := rejected + 1; continue; end if;
    stamp := least(floor((c ->> 'updatedAt')::numeric)::bigint, now_ms + 300000);
    select r.updated_at, octet_length(r.payload::text) as len into ex from studybible.records r where r.user_id = me and r.tbl = v_tbl and r.uid = v_uid;
    held := found; -- FOUND is reset by the next statement, so keep the answer
    if held and ex.updated_at > stamp then continue; end if; -- the held copy is newer: the sender gets it below
    if not held and coalesce((c ->> 'deleted')::boolean, false) then continue; end if; -- deleting a record that was never held: nothing to store, and it must not eat into the record or byte quota
    if held then
      if st.bytes - ex.len + octet_length(v_body) > 104857600 then rejected := rejected + 1; continue; end if;
    else
      if st.bytes + octet_length(v_body) > 104857600 or st.records >= 200000 then rejected := rejected + 1; continue; end if;
    end if;
    st.seq := st.seq + 1;
    insert into studybible.records (user_id, tbl, uid, updated_at, deleted, payload, seq)
      values (me, v_tbl, v_uid, stamp, coalesce((c ->> 'deleted')::boolean, false), v_payload, st.seq)
      on conflict (user_id, tbl, uid) do update set updated_at = excluded.updated_at, deleted = excluded.deleted, payload = excluded.payload, seq = excluded.seq;
    if held then st.bytes := st.bytes - ex.len + octet_length(v_body); else st.records := st.records + 1; st.bytes := st.bytes + octet_length(v_body); end if;
    mine := mine || (v_tbl || '|' || v_uid);
  end loop;
  update studybible.sync_state s set seq = st.seq, records = st.records, bytes = st.bytes where s.user_id = me;

  select coalesce(jsonb_agg(jsonb_build_object('table', r.tbl, 'uid', r.uid, 'updatedAt', r.updated_at, 'deleted', r.deleted, 'payload', r.payload) order by r.seq) filter (where not ((r.tbl || '|' || r.uid) = any (mine))), '[]'::jsonb),
         coalesce(max(r.seq), cursor_in), count(*)
    into rows, last_seq, n
    from (select * from studybible.records where user_id = me and seq > cursor_in order by seq limit 2000) r;
  return jsonb_build_object('cursor', last_seq, 'more', n >= 2000, 'rejected', rejected, 'protocol', 1, 'changes', rows);
end $$;

create or replace function studybible.export_all() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := studybible.account_caller();
begin
  return jsonb_build_object(
    'format', 'studybible-supabase-export', 'exportedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'user', (select jsonb_build_object('id', u.id, 'email', u.email, 'name', p.display_name, 'createdAt', floor(extract(epoch from u.created_at) * 1000))
             from auth.users u left join studybible.accounts p on p.user_id = u.id where u.id = me),
    'records', coalesce((select jsonb_agg(jsonb_build_object('table', r.tbl, 'uid', r.uid, 'updatedAt', r.updated_at, 'data', r.payload) order by r.tbl, r.uid) from studybible.records r where r.user_id = me and not r.deleted), '[]'::jsonb));
end $$;

create or replace function studybible.stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := studybible.account_caller();
begin
  return jsonb_build_object(
    'tables', coalesce((select jsonb_agg(jsonb_build_object('table', t.tbl, 'records', t.live, 'deleted', t.gone) order by t.tbl)
                        from (select tbl, count(*) filter (where not deleted) as live, count(*) filter (where deleted) as gone from studybible.records where user_id = me group by tbl) t), '[]'::jsonb),
    'bytes', coalesce((select bytes from studybible.sync_state where user_id = me), 0),
    'limits', jsonb_build_object('records', 200000, 'bytes', 104857600));
end $$;

create or replace function studybible.set_display_name(p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := studybible.account_caller();
begin
  update studybible.accounts set display_name = nullif(left(btrim(coalesce(p_name, '')), 80), '') where user_id = me;
end $$;

-- "Delete my StudyBible account": the account and everything stored for it. Nothing else is touched: not the shared sign-in, and nothing of any other app.
drop function if exists studybible.delete_my_data();
create or replace function studybible.delete_account() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := studybible.account_caller(); n bigint;
begin
  delete from studybible.records where user_id = me; get diagnostics n = row_count;
  delete from studybible.sync_state where user_id = me;
  delete from studybible.accounts where user_id = me;
  return jsonb_build_object('ok', true, 'recordsRemoved', n);
end $$;

revoke all on function studybible.account_caller(), studybible.account_status(), studybible.create_account(text), studybible.sync(integer, bigint, jsonb), studybible.export_all(), studybible.stats(), studybible.set_display_name(text), studybible.delete_account() from public, anon;
grant execute on function studybible.account_status(), studybible.create_account(text), studybible.sync(integer, bigint, jsonb), studybible.export_all(), studybible.stats(), studybible.set_display_name(text), studybible.delete_account() to authenticated;
