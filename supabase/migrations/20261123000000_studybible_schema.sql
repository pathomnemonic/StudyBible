-- StudyBible on the shared Supabase project: one schema of its own, so nothing here can collide with another app's tables.
-- Row-level security is on for everything. A signed-in person can read only their own rows, and NO one can write a row directly: every write goes through
-- the functions below, which check who is calling, refuse anonymous visitors, validate the shape and size, and keep the sync counter correct.
-- Nothing in this file touches `public` or any other app's schema, and there is no trigger on `auth.users` (that table is shared by every app).

create schema if not exists studybible;

create table if not exists studybible.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

-- one row per person: the sync counter and what the person is using (limits are enforced from it)
create table if not exists studybible.sync_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  seq bigint not null default 0,
  records integer not null default 0,
  bytes bigint not null default 0
);

create table if not exists studybible.records (
  user_id uuid not null references auth.users (id) on delete cascade,
  tbl text not null check (tbl in ('notes','highlights','bookmarks','folders','collections','userXrefs','journal','userPlans','saved','media','userLinks','planProgress','episodeProgress','libraryProgress','classes','classwork','queue','savedSearches','memory','settings')),
  uid text not null check (char_length(uid) <= 200),
  updated_at bigint not null,
  deleted boolean not null default false,
  payload jsonb not null,
  seq bigint not null,
  primary key (user_id, tbl, uid)
);
create index if not exists records_user_seq on studybible.records (user_id, seq);

alter table studybible.profiles enable row level security;
alter table studybible.sync_state enable row level security;
alter table studybible.records enable row level security;

-- reading: your own rows only. There are deliberately no insert, update or delete policies.
create policy profiles_select_own on studybible.profiles for select to authenticated using (user_id = (select auth.uid()));
create policy sync_state_select_own on studybible.sync_state for select to authenticated using (user_id = (select auth.uid()));
create policy records_select_own on studybible.records for select to authenticated using (user_id = (select auth.uid()));

revoke all on schema studybible from public, anon;
revoke all on all tables in schema studybible from public, anon, authenticated;
grant usage on schema studybible to authenticated;
grant select on studybible.profiles, studybible.sync_state, studybible.records to authenticated;

-- ---------------------------------------------------------------------------------------------------------------------------------------------------------
-- who is calling: a real, signed-in person (not an anonymous visitor, who holds the same role)
create or replace function studybible.caller() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in' using errcode = '28000'; end if;
  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then raise exception 'sign in with an email to use sync' using errcode = '42501'; end if;
  return uid;
end $$;

-- what each synced table must look like (the same checks the self-hosted server made). A deletion carries no body, so only a live record is checked.
create or replace function studybible.payload_ok(p_tbl text, p_payload jsonb, p_deleted boolean) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then return p_deleted and (p_payload is null or p_payload = 'null'::jsonb); end if;
  if p_deleted then return true; end if;
  case p_tbl
    when 'notes' then
      return jsonb_typeof(p_payload -> 'body') = 'string'
        and (not p_payload ? 'title' or jsonb_typeof(p_payload -> 'title') = 'string')
        and (not p_payload ? 'tags' or (jsonb_typeof(p_payload -> 'tags') = 'array' and not exists (select 1 from jsonb_array_elements(p_payload -> 'tags') t where jsonb_typeof(t) <> 'string')));
    when 'highlights' then return jsonb_typeof(p_payload -> 'ref') = 'string' and jsonb_typeof(p_payload -> 'color') = 'string';
    when 'bookmarks' then return jsonb_typeof(p_payload -> 'ref') = 'string';
    when 'journal' then return jsonb_typeof(p_payload -> 'date') = 'string';
    when 'userLinks' then return jsonb_typeof(p_payload -> 'url') = 'string' and (p_payload ->> 'url') ~* '^https?://' and jsonb_typeof(p_payload -> 'ref') = 'string';
    when 'media' then return jsonb_typeof(p_payload -> 'url') = 'string' and (p_payload ->> 'url') ~* '^https?://';
    when 'settings' then return not exists (select 1 from jsonb_each(p_payload) e where jsonb_typeof(e.value) not in ('string','number','boolean','object','null'));
    else return true;
  end case;
end $$;

-- ---------------------------------------------------------------------------------------------------------------------------------------------------------
-- The sync call: the same rules as the self-hosted server's /api/sync.
--   * at most 1000 changes a call; a record over 256 KB, or a person over 100 MB or 200,000 records, is refused (counted in `rejected`)
--   * a writer's clock set far ahead must not win every later conflict: timestamps are capped at the server's time plus 5 minutes
--   * a newer copy already held wins (the sender receives it); a deletion is a row with deleted = true
--   * the answer is the person's rows after `p_cursor`, up to 2000, without the rows this call just wrote
create or replace function studybible.sync(p_protocol integer, p_cursor bigint, p_changes jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid := studybible.caller();
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
  insert into studybible.profiles (user_id) values (me) on conflict (user_id) do nothing;
  select * into st from studybible.sync_state where user_id = me for update; -- one person's writes go one at a time, so `seq` never goes out of order

  for c in select * from jsonb_array_elements(p_changes) loop
    if jsonb_typeof(c) <> 'object' or jsonb_typeof(c -> 'table') <> 'string' or jsonb_typeof(c -> 'uid') <> 'string' or jsonb_typeof(c -> 'updatedAt') <> 'number' then rejected := rejected + 1; continue; end if;
    v_tbl := c ->> 'table'; v_uid := c ->> 'uid';
    if char_length(v_uid) > 200 or v_tbl not in ('notes','highlights','bookmarks','folders','collections','userXrefs','journal','userPlans','saved','media','userLinks','planProgress','episodeProgress','libraryProgress','classes','classwork','queue','savedSearches','memory','settings') then rejected := rejected + 1; continue; end if;
    v_payload := coalesce(c -> 'payload', '{}'::jsonb);
    if not studybible.payload_ok(v_tbl, c -> 'payload', coalesce((c ->> 'deleted')::boolean, false)) then rejected := rejected + 1; continue; end if;
    v_body := v_payload::text;
    if char_length(v_body) > 262144 then rejected := rejected + 1; continue; end if;
    stamp := least(floor((c ->> 'updatedAt')::numeric)::bigint, now_ms + 300000);
    select r.updated_at, char_length(r.payload::text) as len into ex from studybible.records r where r.user_id = me and r.tbl = v_tbl and r.uid = v_uid;
    held := found; -- FOUND is reset by the next statement, so keep the answer
    if held and ex.updated_at > stamp then continue; end if; -- the held copy is newer: the sender gets it below
    if held then
      if st.bytes - ex.len + char_length(v_body) > 104857600 then rejected := rejected + 1; continue; end if;
    else
      if st.bytes + char_length(v_body) > 104857600 or st.records >= 200000 then rejected := rejected + 1; continue; end if;
    end if;
    st.seq := st.seq + 1;
    insert into studybible.records (user_id, tbl, uid, updated_at, deleted, payload, seq)
      values (me, v_tbl, v_uid, stamp, coalesce((c ->> 'deleted')::boolean, false), v_payload, st.seq)
      on conflict (user_id, tbl, uid) do update set updated_at = excluded.updated_at, deleted = excluded.deleted, payload = excluded.payload, seq = excluded.seq;
    if held then st.bytes := st.bytes - ex.len + char_length(v_body); else st.records := st.records + 1; st.bytes := st.bytes + char_length(v_body); end if;
    mine := mine || (v_tbl || '|' || v_uid);
  end loop;
  update studybible.sync_state s set seq = st.seq, records = st.records, bytes = st.bytes where s.user_id = me;

  select coalesce(jsonb_agg(jsonb_build_object('table', r.tbl, 'uid', r.uid, 'updatedAt', r.updated_at, 'deleted', r.deleted, 'payload', r.payload) order by r.seq) filter (where not ((r.tbl || '|' || r.uid) = any (mine))), '[]'::jsonb),
         coalesce(max(r.seq), cursor_in), count(*)
    into rows, last_seq, n
    from (select * from studybible.records where user_id = me and seq > cursor_in order by seq limit 2000) r;
  return jsonb_build_object('cursor', last_seq, 'more', n >= 2000, 'rejected', rejected, 'protocol', 1, 'changes', rows);
end $$;

-- everything the person has, for the "download my data" button
create or replace function studybible.export_all() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := studybible.caller();
begin
  return jsonb_build_object(
    'format', 'studybible-supabase-export', 'exportedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'user', (select jsonb_build_object('id', u.id, 'email', u.email, 'name', p.display_name, 'createdAt', floor(extract(epoch from u.created_at) * 1000))
             from auth.users u left join studybible.profiles p on p.user_id = u.id where u.id = me),
    'records', coalesce((select jsonb_agg(jsonb_build_object('table', r.tbl, 'uid', r.uid, 'updatedAt', r.updated_at, 'data', r.payload) order by r.tbl, r.uid) from studybible.records r where r.user_id = me and not r.deleted), '[]'::jsonb));
end $$;

-- what the person is using (for the account page)
create or replace function studybible.stats() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare me uuid := studybible.caller();
begin
  return jsonb_build_object(
    'tables', coalesce((select jsonb_agg(jsonb_build_object('table', t.tbl, 'records', t.live, 'deleted', t.gone) order by t.tbl)
                        from (select tbl, count(*) filter (where not deleted) as live, count(*) filter (where deleted) as gone from studybible.records where user_id = me group by tbl) t), '[]'::jsonb),
    'bytes', coalesce((select bytes from studybible.sync_state where user_id = me), 0),
    'limits', jsonb_build_object('records', 200000, 'bytes', 104857600));
end $$;

create or replace function studybible.set_display_name(p_name text) returns void
language plpgsql security definer set search_path = '' as $$
declare me uuid := studybible.caller();
begin
  insert into studybible.profiles (user_id, display_name) values (me, nullif(left(btrim(coalesce(p_name, '')), 80), ''))
    on conflict (user_id) do update set display_name = excluded.display_name;
end $$;

-- "Delete my StudyBible data": removes this app's rows for the caller. The shared sign-in is NOT touched (other apps may use it).
create or replace function studybible.delete_my_data() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare me uuid := studybible.caller(); n bigint;
begin
  delete from studybible.records where user_id = me; get diagnostics n = row_count;
  delete from studybible.sync_state where user_id = me;
  delete from studybible.profiles where user_id = me;
  return jsonb_build_object('ok', true, 'recordsRemoved', n);
end $$;

-- who may call what: signed-in people only; never `public` or `anon`
revoke all on function studybible.caller(), studybible.payload_ok(text, jsonb, boolean), studybible.sync(integer, bigint, jsonb), studybible.export_all(), studybible.stats(), studybible.set_display_name(text), studybible.delete_my_data() from public, anon;
grant execute on function studybible.sync(integer, bigint, jsonb), studybible.export_all(), studybible.stats(), studybible.set_display_name(text), studybible.delete_my_data() to authenticated;
