// Deletes the local synthetic database folder (web/.data). Stop the server first.
import { rmSync } from "node:fs";
import path from "node:path";

const dir = path.resolve(process.cwd(), ".data");
if (path.basename(process.cwd()) !== "web") {
  console.error("Run this from the web folder: cd web && npm run reset-data");
  process.exit(1);
}
rmSync(dir, { recursive: true, force: true });
console.log(`Removed ${dir}. A new empty database is created the next time the application starts.`);
