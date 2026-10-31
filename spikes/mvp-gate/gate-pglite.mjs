import { PGlite } from "@electric-sql/pglite";
import { rmSync, mkdirSync } from "node:fs";

const dir = "./gate-data";
rmSync(dir, { recursive: true, force: true });
const log = (k, v) => console.log(k.padEnd(46), v);

let db = await PGlite.create(dir);
log("3 start with filesystem persistence", "ok (" + (await db.query("select version() as v")).rows[0].v.slice(0, 40) + ")");

await db.exec(`
create table accounts (id uuid primary key, name text not null);
create table events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id),
  name text not null check (char_length(name) between 1 and 120),
  event_date date not null,
  location text not null,
  description text,
  created_at timestamptz not null default now()
);
create index events_account_idx on events(account_id, event_date);
`);
log("4 migration created tables", (await db.query("select count(*)::int c from information_schema.tables where table_schema='public'")).rows[0].c + " tables");

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
await db.query("insert into accounts(id,name) values ($1,'Synthetic A'),($2,'Synthetic B')", [A, B]);
await db.query("insert into events(account_id,name,event_date,location) values ($1,'A launch','2027-01-10','Test Hall')", [A]);
const bRow = await db.query("insert into events(account_id,name,event_date,location) values ($1,'B party','2027-02-11','Test Barn') returning id", [B]);
log("6 two accounts represented", "ok");

await db.close();
db = await PGlite.create(dir);
const after = await db.query("select name from events order by name");
log("5 data survives close and reopen", JSON.stringify(after.rows.map((r) => r.name)));

const scoped = await db.query("select name from events where account_id = $1", [A]);
log("7 account A scoped query returns", JSON.stringify(scoped.rows.map((r) => r.name)));
const cross = await db.query("select name from events where account_id = $1 and id = $2", [A, bRow.rows[0].id]);
log("7 A asking for B's event id returns", cross.rows.length + " rows");

// 8: database-enforced RLS
let rls = "unknown";
try {
  await db.exec(`
    create role app_user nologin;
    grant usage on schema public to app_user;
    grant select, insert on events to app_user;
    grant select on accounts to app_user;
    alter table events enable row level security;
    alter table events force row level security;
    create policy events_by_account on events using (account_id = nullif(current_setting('app.account_id', true), '')::uuid)
      with check (account_id = nullif(current_setting('app.account_id', true), '')::uuid);
  `);
  log("8 create role, enable RLS, create policy", "ok");
  await db.exec("set role app_user");
  await db.exec(`set app.account_id = '${A}'`);
  const asA = await db.query("select name from events");
  log("8 as app_user with account A sees", JSON.stringify(asA.rows.map((r) => r.name)));
  await db.exec(`set app.account_id = '${B}'`);
  const asB = await db.query("select name from events");
  log("8 as app_user with account B sees", JSON.stringify(asB.rows.map((r) => r.name)));
  await db.exec(`set app.account_id = ''`);
  const none = await db.query("select name from events");
  log("8 as app_user with no account sees", none.rows.length + " rows");
  let blocked = "NOT blocked";
  try {
    await db.query("insert into events(account_id,name,event_date,location) values ($1,'sneaky','2027-03-01','x')", [B]);
    await db.exec(`set app.account_id = '${A}'`);
    await db.query("insert into events(account_id,name,event_date,location) values ($1,'sneaky','2027-03-01','x')", [B]);
  } catch (e) { blocked = "blocked: " + e.message.slice(0, 80); }
  log("8 insert for the wrong account", blocked);
  await db.exec("reset role");
  rls = asA.rows.length === 1 && asB.rows.length === 1 && none.rows.length === 0 ? "ENFORCED in this test" : "NOT enforced";
} catch (e) {
  rls = "FAILED: " + e.message;
}
log("8 RLS result", rls);
await db.close();
