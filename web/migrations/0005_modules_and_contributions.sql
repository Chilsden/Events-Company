-- Configurable Check-in Studio: per-event input modules, and a shared contribution model that does not need a guest.
-- Contributions are captured by Check-in Studio and later consumed by other products (Mosaic, Event Gallery) only
-- through the eligibility view below. Display permission is a separate, append-only history, so it can be revoked
-- without ever changing or deleting the contribution itself.

-- ---------------------------------------------------------------------------------------------------------------
-- 1. Event modules (per-event configuration)
-- ---------------------------------------------------------------------------------------------------------------
create table event_modules (
  account_id uuid not null,
  event_id uuid not null,
  module text not null check (module in
    ('guest_registration', 'attendance', 'signature', 'drawing', 'photograph', 'video', 'text_message', 'consent')),
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  primary key (account_id, event_id, module),
  -- Only built modules can be on. A new module is made switchable by a migration that adds it here, so the database
  -- (not just the application) refuses to turn on a planned one, and with it any contribution kind that has no storage yet.
  check (not enabled or module in ('guest_registration', 'attendance', 'signature')),
  foreign key (event_id, account_id) references events (id, account_id)
);

-- Existing events keep exactly what they have today: guest registration and attendance on, nothing else.
insert into event_modules (account_id, event_id, module, enabled)
select e.account_id, e.id, m.module, m.enabled
from events e
cross join (values
  ('guest_registration', true), ('attendance', true), ('signature', false), ('drawing', false),
  ('photograph', false), ('video', false), ('text_message', false), ('consent', false)
) as m(module, enabled);

-- Every NEW event gets an explicit row for every module, so its configuration is never implicit. The defaults are
-- the same as for migrated events (the behaviour organisers already know); signature capture is switched on by choice.
create function events_default_modules() returns trigger language plpgsql as $$
begin
  insert into event_modules (account_id, event_id, module, enabled)
  select new.account_id, new.id, m.module, m.enabled
  from (values
    ('guest_registration', true), ('attendance', true), ('signature', false), ('drawing', false),
    ('photograph', false), ('video', false), ('text_message', false), ('consent', false)
  ) as m(module, enabled);
  return null;
end;
$$;
create trigger events_default_modules after insert on events
  for each row execute function events_default_modules();

-- ---------------------------------------------------------------------------------------------------------------
-- 2. Contributions (signatures now; drawings, photographs, videos and text messages are planned)
-- ---------------------------------------------------------------------------------------------------------------
create table contributions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  event_id uuid not null,
  guest_id uuid,                                   -- optional: an anonymous contribution has no guest
  kind text not null check (kind in ('signature', 'drawing', 'photograph', 'video', 'text_message')),
  content jsonb,                                   -- safe, validated data (for example pen strokes); never markup
  storage_ref text,                                -- reserved for photographs and videos kept in object storage later
  source text not null default 'check_in_studio' check (source = 'check_in_studio'),
  actor text not null default 'local_demo_operator' check (actor = 'local_demo_operator'),
  created_at timestamptz not null default now(),
  check ((content is not null) <> (storage_ref is not null)),
  check (kind not in ('signature', 'drawing', 'text_message') or content is not null),
  check (kind not in ('photograph', 'video') or storage_ref is not null),
  check (content is null or octet_length(content::text) <= 200000),
  check (storage_ref is null or char_length(storage_ref) between 1 and 500),
  -- a signature or drawing is pen strokes and nothing else
  check (kind not in ('signature', 'drawing') or (
    jsonb_typeof(content) = 'object'
    and (content - 'v' - 'strokes') = '{}'::jsonb
    and jsonb_typeof(content -> 'strokes') = 'array'
    and jsonb_array_length(content -> 'strokes') between 1 and 50)),
  foreign key (event_id, account_id) references events (id, account_id),
  foreign key (guest_id, event_id, account_id) references guests (id, event_id, account_id),
  unique (id, event_id, account_id)
);
create index contributions_event_idx on contributions (account_id, event_id, created_at);

-- A contribution can be stored only while its input module is enabled for the event.
create function contributions_require_module() returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from event_modules
    where account_id = new.account_id and event_id = new.event_id and enabled
      and module = case new.kind
        when 'signature' then 'signature' when 'drawing' then 'drawing' when 'photograph' then 'photograph'
        when 'video' then 'video' when 'text_message' then 'text_message' end
  ) then
    raise exception 'this input is not enabled for the event' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;
create trigger contributions_require_module before insert on contributions
  for each row execute function contributions_require_module();

create function contributions_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'contributions cannot be changed or removed' using errcode = 'check_violation';
end;
$$;
create trigger contributions_no_change before update or delete on contributions
  for each row execute function contributions_immutable();
create trigger contributions_no_truncate before truncate on contributions
  for each statement execute function contributions_immutable();

-- ---------------------------------------------------------------------------------------------------------------
-- 3. Display permission history (purpose-specific, append-only)
-- ---------------------------------------------------------------------------------------------------------------
-- change: 'granted' or 'denied' (the explicit choice made at submission) and later 'revoked'.
-- purpose: what the permission is for. Only the synthetic demonstration purpose exists. It is NOT legally valid consent.
-- provenance: how it was recorded. The local operator is not a verified guest, so the value says so.
create table contribution_permissions (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity unique,
  account_id uuid not null,
  event_id uuid not null,
  contribution_id uuid not null,
  change text not null check (change in ('granted', 'denied', 'revoked')),
  purpose text not null check (purpose in ('mosaic_public_display_demo')),
  wording_version text not null check (char_length(wording_version) between 1 and 50),
  provenance text not null check (provenance in ('local_demo_operator_synthetic')),
  occurred_at timestamptz not null default clock_timestamp(),
  tx_id bigint not null default txid_current(),
  foreign key (contribution_id, event_id, account_id) references contributions (id, event_id, account_id)
);
create index contribution_permissions_idx on contribution_permissions (account_id, event_id, contribution_id, seq);

create function contribution_permissions_immutable() returns trigger language plpgsql as $$
begin
  raise exception 'contribution_permissions is append-only' using errcode = 'check_violation';
end;
$$;
create trigger contribution_permissions_no_change before update or delete on contribution_permissions
  for each row execute function contribution_permissions_immutable();
create trigger contribution_permissions_no_truncate before truncate on contribution_permissions
  for each statement execute function contribution_permissions_immutable();

-- The first entry is the explicit choice ('granted' or 'denied'); after that only a 'revoked' following 'granted'.
create function contribution_permissions_order() returns trigger language plpgsql as $$
declare
  previous text;
begin
  select change into previous from contribution_permissions
    where contribution_id = new.contribution_id and purpose = new.purpose and seq < new.seq
    order by seq desc limit 1;
  if (new.change in ('granted', 'denied') and previous is not null)
     or (new.change = 'revoked' and previous is distinct from 'granted') then
    raise exception 'display permission change out of order' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;
create constraint trigger contribution_permissions_order after insert on contribution_permissions
  deferrable initially deferred for each row execute function contribution_permissions_order();

-- A contribution cannot exist without its explicit permission choice recorded in the same transaction.
create function contributions_require_choice() returns trigger language plpgsql as $$
begin
  if not exists (select 1 from contribution_permissions
                 where contribution_id = new.id and tx_id = txid_current() and change in ('granted', 'denied')) then
    raise exception 'a contribution needs an explicit display permission choice' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;
create constraint trigger contributions_require_choice after insert on contributions
  deferrable initially deferred for each row execute function contributions_require_choice();

-- The ONE definition of "may be shown downstream": the latest permission for the purpose is 'granted'.
-- Other products read this view, never the table. security_invoker makes row-level security apply to the caller.
create view eligible_contributions with (security_invoker = true) as
select c.*
from contributions c
where (select p.change from contribution_permissions p
       where p.contribution_id = c.id and p.purpose = 'mosaic_public_display_demo'
       order by p.seq desc limit 1) = 'granted';

-- ---------------------------------------------------------------------------------------------------------------
-- 4. Audit history: new actions, and the real-change rule extended to them
-- ---------------------------------------------------------------------------------------------------------------
alter table audit_events drop constraint audit_events_action_check;
alter table audit_events add constraint audit_events_action_check check (action in
  ('guest_added', 'guests_imported', 'guest_renamed', 'checked_in', 'check_in_undone', 'checked_in_again',
   'module_enabled', 'module_disabled', 'contribution_submitted', 'display_permission_revoked'));
alter table audit_events drop constraint audit_events_detail_check;
alter table audit_events add constraint audit_events_detail_check check
  (jsonb_typeof(detail) = 'object' and (detail - 'count' - 'batch_id' - 'module') = '{}'::jsonb);
alter table audit_events add column contribution_id uuid;
alter table audit_events add foreign key (contribution_id, event_id, account_id) references contributions (id, event_id, account_id);

create or replace function audit_events_describe_real_change() returns trigger language plpgsql as $$
declare
  previous text;
begin
  -- Event-level records that are not about a guest
  if new.action in ('module_enabled', 'module_disabled') then
    if not exists (select 1 from event_modules m
                   where m.account_id = new.account_id and m.event_id = new.event_id and m.module = new.detail ->> 'module'
                     and m.xmin::text::bigint = (txid_current() & 4294967295)
                     and m.enabled = (new.action = 'module_enabled')) then
      raise exception 'audit record without a matching change' using errcode = 'check_violation';
    end if;
    return null;
  end if;
  if new.action = 'contribution_submitted' then
    if new.contribution_id is null or not exists (select 1 from contributions c
                   where c.id = new.contribution_id and c.xmin::text::bigint = (txid_current() & 4294967295)) then
      raise exception 'audit record without a matching change' using errcode = 'check_violation';
    end if;
    return null;
  end if;
  if new.action = 'display_permission_revoked' then
    if new.contribution_id is null or not exists (select 1 from contribution_permissions p
                   where p.contribution_id = new.contribution_id and p.change = 'revoked' and p.tx_id = txid_current()) then
      raise exception 'audit record without a matching change' using errcode = 'check_violation';
    end if;
    return null;
  end if;

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

-- A module's enabled flag can change only together with its audit record in the same transaction.
create function event_modules_require_audit() returns trigger language plpgsql as $$
begin
  if new.enabled is distinct from old.enabled and not exists (
    select 1 from audit_events a
    where a.event_id = new.event_id and a.tx_id = txid_current() and a.detail ->> 'module' = new.module
      and a.action = case when new.enabled then 'module_enabled' else 'module_disabled' end
  ) then
    raise exception 'module change without an audit record' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;
create constraint trigger event_modules_require_audit after update of enabled on event_modules
  deferrable initially deferred for each row execute function event_modules_require_audit();

-- Attendance needs the guest list, checked when the transaction commits (so both can be changed together).
create function event_modules_dependencies() returns trigger language plpgsql as $$
begin
  if exists (select 1 from event_modules a
             where a.account_id = new.account_id and a.event_id = new.event_id and a.module = 'attendance' and a.enabled)
     and not exists (select 1 from event_modules g
             where g.account_id = new.account_id and g.event_id = new.event_id and g.module = 'guest_registration' and g.enabled) then
    raise exception 'attendance needs the guest list' using errcode = 'check_violation';
  end if;
  return null;
end;
$$;
create constraint trigger event_modules_dependencies after update of enabled on event_modules
  deferrable initially deferred for each row execute function event_modules_dependencies();

-- ---------------------------------------------------------------------------------------------------------------
-- 5. Access: the application role, and row-level security by account
-- ---------------------------------------------------------------------------------------------------------------
grant select, insert on event_modules to events_app;
grant update (enabled, updated_at) on event_modules to events_app;
grant select, insert (account_id, event_id, guest_id, kind, content, storage_ref) on contributions to events_app;
grant select, insert (account_id, event_id, contribution_id, change, purpose, wording_version, provenance) on contribution_permissions to events_app;
grant select on eligible_contributions to events_app;

alter table event_modules enable row level security;
alter table event_modules force row level security;
alter table contributions enable row level security;
alter table contributions force row level security;
alter table contribution_permissions enable row level security;
alter table contribution_permissions force row level security;

create policy event_modules_select_own_account on event_modules for select
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy event_modules_insert_own_account on event_modules for insert
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy event_modules_update_own_account on event_modules for update
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid)
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy contributions_select_own_account on contributions for select
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy contributions_insert_own_account on contributions for insert
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy contribution_permissions_select_own_account on contribution_permissions for select
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy contribution_permissions_insert_own_account on contribution_permissions for insert
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
