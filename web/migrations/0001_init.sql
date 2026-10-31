-- Accounts own events. The first slice has one fixed synthetic demo account and no sign-in.
create table accounts (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id),
  name text not null check (char_length(name) between 1 and 120),
  event_date date not null,
  location text not null check (char_length(location) between 1 and 200),
  description text check (char_length(description) <= 2000),
  created_at timestamptz not null default now()
);

create index events_account_date_idx on events (account_id, event_date, created_at);

-- Defence in depth: the application queries as a limited role and Postgres row-level security
-- restricts every row to the account set for the current transaction. The repository also filters by account.
create role events_app nologin;
grant usage on schema public to events_app;
grant select, insert on events to events_app;
-- No access to accounts: the foreign-key check on insert does not need it.

alter table events enable row level security;
alter table events force row level security;

create policy events_select_own_account on events for select
  using (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
create policy events_insert_own_account on events for insert
  with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
