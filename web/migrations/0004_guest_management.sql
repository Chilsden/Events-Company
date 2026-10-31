-- Guest management: CSV import batches, name edits, undoable check-in, and an append-only audit history.
-- Current attendance state stays on guests.checked_in_at. The EVIDENCE of how it got there lives in audit_events
-- (and check_in_log), which cannot be updated or deleted. A deferred trigger refuses any change to the state or a
-- guest's name unless a matching audit record was written in the same transaction, so state and history cannot diverge.

create table import_batches (
  account_id uuid not null,
  id uuid not null,                       -- chosen by the server when the preview is shown; makes a double submit harmless
  event_id uuid not null,
  guest_count integer not null check (guest_count between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (account_id, id),
  unique (account_id, event_id, id),
  foreign key (event_id, account_id) references events (id, account_id)
);

alter table guests add column import_batch_id uuid;
alter table guests add foreign key (account_id, event_id, import_batch_id) references import_batches (account_id, event_id, id);

-- Audit history. No names: guests are referred to by id, and the page looks the current name up.
create table audit_events (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity unique,   -- the order events were recorded
  account_id uuid not null,
  event_id uuid not null,
  guest_id uuid,
  action text not null check (action in
    ('guest_added', 'guests_imported', 'guest_renamed', 'checked_in', 'check_in_undone', 'checked_in_again')),
  -- Until sign-in exists nobody is identified. This value says so and is the only one allowed.
  actor text not null default 'local_demo_operator' check (actor = 'local_demo_operator'),
  detail jsonb not null default '{}'::jsonb check (jsonb_typeof(detail) = 'object' and (detail - 'count' - 'batch_id') = '{}'::jsonb),
  occurred_at timestamptz not null default clock_timestamp(),
  tx_id bigint not null default txid_current(),
  foreign key (event_id, account_id) references events (id, account_id),
  foreign key (guest_id, event_id, account_id) references guests (id, event_id, account_id)
);
create index audit_events_event_idx on audit_events (account_id, event_id, seq);

create function audit_events_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'audit_events is append-only' using errcode = 'check_violation';
end;
$$;
create trigger audit_events_no_update before update or delete on audit_events
  for each row execute function audit_events_immutable();
create trigger audit_events_no_truncate before truncate on audit_events
  for each statement execute function audit_events_immutable();

-- Replaces the 0003 rule ("a set check-in time can never change"), which would have made undo impossible.
-- The protection moves to the audit history: changes are allowed only together with their audit record.
drop trigger guests_protect_check_in_time on guests;
drop function guests_protect_check_in_time();

create function guests_require_audit() returns trigger language plpgsql as $$
declare
  wanted text[];
begin
  if new.checked_in_at is distinct from old.checked_in_at then
    if old.checked_in_at is null then
      wanted := array['checked_in', 'checked_in_again'];
    elsif new.checked_in_at is null then
      wanted := array['check_in_undone'];
    else
      raise exception 'a recorded check-in time cannot be replaced' using errcode = 'check_violation';
    end if;
    if not exists (select 1 from audit_events where guest_id = new.id and tx_id = txid_current() and action = any (wanted)) then
      raise exception 'attendance change without an audit record' using errcode = 'check_violation';
    end if;
  end if;
  if new.name is distinct from old.name then
    if not exists (select 1 from audit_events where guest_id = new.id and tx_id = txid_current() and action = 'guest_renamed') then
      raise exception 'name change without an audit record' using errcode = 'check_violation';
    end if;
  end if;
  return null;
end;
$$;
create constraint trigger guests_require_audit
  after update of checked_in_at, name on guests
  deferrable initially deferred
  for each row execute function guests_require_audit();

-- A guest cannot be created already checked in without the matching audit record either.
create function guests_insert_require_audit() returns trigger language plpgsql as $$
begin
  if new.checked_in_at is not null and not exists
     (select 1 from audit_events where guest_id = new.id and tx_id = txid_current() and action in ('checked_in', 'checked_in_again')) then
    raise exception 'attendance change without an audit record' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;
create constraint trigger guests_insert_require_audit
  after insert on guests
  deferrable initially deferred
  for each row execute function guests_insert_require_audit();

-- Application role: the new tables, and the right to change a guest's name and check-in state (nothing else).
grant select, insert on import_batches to events_app;
-- Guests are created not-checked-in: the application role has no right to insert a check-in time.
revoke insert on guests from events_app;
grant insert (account_id, event_id, name, import_batch_id) on guests to events_app;
grant select, insert on audit_events to events_app;
grant update (name) on guests to events_app;

alter table import_batches enable row level security;
alter table import_batches force row level security;
alter table audit_events enable row level security;
alter table audit_events force row level security;

create policy import_batches_select_own_account on import_batches for select
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy import_batches_insert_own_account on import_batches for insert
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy audit_events_select_own_account on audit_events for select
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy audit_events_insert_own_account on audit_events for insert
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);

-- Existing local data (made before this history existed): give every guest and check-in an audit record,
-- in time order, so state and history agree from the start.
insert into audit_events (account_id, event_id, guest_id, action, occurred_at)
select account_id, event_id, guest_id, action, occurred_at from (
  select account_id, event_id, id as guest_id, 'guest_added' as action, created_at as occurred_at from guests
  union all
  select account_id, event_id, id, 'checked_in', checked_in_at from guests where checked_in_at is not null
) as history
order by occurred_at, case action when 'guest_added' then 0 else 1 end, guest_id;

-- The other direction: an audit record about a guest must describe a change made in the same transaction, so a
-- caller cannot append invented history ("checked in", "undone", "renamed", "added") for something that did not happen.
-- (Created after the backfill above, which records history for changes made earlier.) xmin is the id of the
-- transaction that last wrote the row.
create function audit_events_describe_real_change() returns trigger language plpgsql as $$
declare
  previous text;
begin
  if new.guest_id is null then
    return null;
  end if;
  -- Attendance records must alternate for each guest: checked_in (first time), check_in_undone, checked_in_again, ...
  if new.action in ('checked_in', 'checked_in_again', 'check_in_undone') then
    select action into previous from audit_events
      where guest_id = new.guest_id and action in ('checked_in', 'checked_in_again', 'check_in_undone') and seq < new.seq
      order by seq desc limit 1;
    if (new.action = 'checked_in' and previous is not null)
       or (new.action = 'checked_in_again' and previous is distinct from 'check_in_undone')
       or (new.action = 'check_in_undone' and previous is null)
       or (new.action = 'check_in_undone' and previous = 'check_in_undone') then
      raise exception 'audit record out of order' using errcode = 'check_violation';
    end if;
  end if;
  if not exists (
    select 1 from guests g
    where g.id = new.guest_id
      and g.xmin::text::bigint = (txid_current() & 4294967295)
      and case new.action
            when 'checked_in' then g.checked_in_at is not null
            when 'checked_in_again' then g.checked_in_at is not null
            when 'check_in_undone' then g.checked_in_at is null
            else true
          end
  ) then
    raise exception 'audit record without a matching change' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;
create constraint trigger audit_events_describe_real_change
  after insert on audit_events
  deferrable initially deferred
  for each row execute function audit_events_describe_real_change();
