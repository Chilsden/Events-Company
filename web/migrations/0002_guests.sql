-- Check-in Studio, first slice: guests, an append-only check-in log, and an unused consent skeleton.
-- Every row carries account_id and event_id, tied to a real event of that account by a composite foreign key,
-- so a guest cannot exist under the wrong account or event even if application code is wrong.

alter table events add constraint events_id_account_unique unique (id, account_id);

create table guests (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  event_id uuid not null,
  name text not null check (char_length(name) between 1 and 120),
  checked_in_at timestamptz,            -- time of the FIRST successful check-in; null until then
  created_at timestamptz not null default now(),
  foreign key (event_id, account_id) references events (id, account_id),
  unique (id, event_id, account_id)
);
create index guests_event_name_idx on guests (account_id, event_id, lower(name));

-- Every check-in attempt that reached a real guest is recorded and never edited. Holds ids and times only, no names.
create table check_in_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  event_id uuid not null,
  guest_id uuid not null,
  outcome text not null check (outcome in ('checked_in', 'already_checked_in')),
  received_at timestamptz not null default now(),
  foreign key (guest_id, event_id, account_id) references guests (id, event_id, account_id)
);
create index check_in_log_guest_idx on check_in_log (account_id, event_id, guest_id);

-- Future consent model (architecture 24): purpose, status, wording version, provenance and timestamps.
-- Nothing writes or reads this table yet and the application role has no access to it. A guest with no row here has
-- NO consent recorded; consent is never assumed. 'synthetic_test' marks test data so it can never be mistaken for
-- a real person's consent.
create table consent_records (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  event_id uuid not null,
  guest_id uuid not null,
  purpose text not null check (char_length(purpose) between 1 and 200),
  status text not null check (status in ('granted', 'withdrawn')),
  wording_version text not null check (char_length(wording_version) between 1 and 50),
  provenance text not null check (provenance in ('guest_self', 'organiser_on_behalf', 'synthetic_test')),
  recorded_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  check ((status = 'withdrawn') = (withdrawn_at is not null)),
  foreign key (guest_id, event_id, account_id) references guests (id, event_id, account_id)
);

-- Application role: add guests, read guests, change ONLY the check-in time, append to and read the log.
grant select, insert on guests to events_app;
grant update (checked_in_at) on guests to events_app;
grant select, insert on check_in_log to events_app;

alter table guests enable row level security;
alter table guests force row level security;
alter table check_in_log enable row level security;
alter table check_in_log force row level security;
alter table consent_records enable row level security;
alter table consent_records force row level security;

create policy guests_select_own_account on guests for select
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy guests_insert_own_account on guests for insert
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy guests_update_own_account on guests for update
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid)
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);

create policy check_in_log_select_own_account on check_in_log for select
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy check_in_log_insert_own_account on check_in_log for insert
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);

create policy consent_records_own_account on consent_records
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid)
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
