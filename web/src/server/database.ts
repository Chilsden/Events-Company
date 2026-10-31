import { PGlite } from "@electric-sql/pglite";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const DEMO_ACCOUNT_ID = "00000000-0000-4000-8000-000000000001";
const DEMO_ACCOUNT_NAME = "Local demo account (synthetic)";

// The migrations folder is read at run time from the working directory, so the bundler must not trace it.
const migrationsDir = () => path.resolve(process.cwd(), "migrations");

/** Applies any SQL files in migrations/ that have not been recorded yet, in file-name order. */
export async function migrate(db: PGlite, dir: string = migrationsDir()): Promise<string[]> {
  await db.exec(
    "create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())",
  );
  const done = new Set((await db.query<{ version: string }>("select version from schema_migrations")).rows.map((r) => r.version));
  const files = (await readdir(/*turbopackIgnore: true*/ dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied: string[] = [];
  for (const file of files) {
    if (done.has(file)) continue;
    const sql = await readFile(path.join(/*turbopackIgnore: true*/ dir, file), "utf8");
    await db.transaction(async (tx) => {
      await tx.exec(sql);
      await tx.query("insert into schema_migrations(version) values ($1)", [file]);
    });
    applied.push(file);
  }
  return applied;
}

export async function ensureAccount(db: PGlite, id: string, name: string): Promise<void> {
  await db.query("insert into accounts(id, name) values ($1, $2) on conflict (id) do nothing", [id, name]);
}

/** Opens a database (in memory when dataDir is omitted), runs migrations and ensures the demo account exists. */
export async function openDatabase(dataDir?: string): Promise<PGlite> {
  if (dataDir) await mkdir(/*turbopackIgnore: true*/ path.dirname(dataDir), { recursive: true });
  const db = await PGlite.create(dataDir);
  try {
    await migrate(db);
    await ensureAccount(db, DEMO_ACCOUNT_ID, DEMO_ACCOUNT_NAME);
  } catch (error) {
    await db.close(); // do not leave a half-opened instance holding the folder
    throw error;
  }
  return db;
}

export const defaultDataDir = (): string => process.env.EVENTS_DATA_DIR?.trim() || path.resolve(process.cwd(), ".data", "pglite");

// One PGlite instance per server process (it is a single-connection database). Kept on globalThis so
// hot reloading in development does not open a second instance on the same folder.
const holder = globalThis as unknown as { __eventsDb?: Promise<PGlite> };

export function getDatabase(): Promise<PGlite> {
  if (!holder.__eventsDb) {
    holder.__eventsDb = openDatabase(defaultDataDir()).catch((error) => {
      holder.__eventsDb = undefined;
      throw error;
    });
  }
  return holder.__eventsDb;
}
