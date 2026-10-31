import { spawn } from "node:child_process";
import { appendFileSync, rmSync } from "node:fs";

const mode = process.argv[2]; // dev | start
const port = mode === "dev" ? 3101 : 3102;
rmSync("./gate-next-data", { recursive: true, force: true });
const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const srv = spawn(cmd, ["next", mode, "-H", "127.0.0.1", "-p", String(port)], { shell: true, stdio: ["ignore", "pipe", "pipe"] });
let out = "";
srv.stdout.on("data", (d) => (out += d));
srv.stderr.on("data", (d) => (out += d));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const url = `http://127.0.0.1:${port}`;
async function until() {
  for (let i = 0; i < 90; i++) {
    try { const r = await fetch(url + "/"); if (r.status === 200) return true; } catch {}
    await wait(1000);
  }
  return false;
}
try {
  const up = await until();
  console.log(mode, "server up on 127.0.0.1:" + port, up);
  const page = await (await fetch(url + "/")).text();
  console.log("page contains 'events: 0':", /events:\s*(<!-- -->)?0/.test(page));
  const posts = await Promise.all(Array.from({ length: 5 }, () => fetch(url + "/api/ping", { method: "POST" }).then((r) => r.status)));
  console.log("5 concurrent writes statuses:", posts.join(","));
  const fr = await fetch(url + "/api/ping", { method: "POST" }); const ft = await fr.text(); console.log("final write status", fr.status, ft.slice(0,200)); const final = ft ? JSON.parse(ft) : {c: "n/a"};
  console.log("count after 6 writes:", final.c);
  if (mode === "dev") {
    appendFileSync("./lib/db.ts", "\n// touch to trigger hot reload\n");
    await wait(4000);
    const r = await fetch(url + "/api/ping", { method: "POST" });
    console.log("after hot reload write status:", r.status, JSON.stringify(await r.json()));
  }
  console.log("errors in server output:", /error|EBUSY|lock|locked/i.test(out) ? out.split("\n").filter((l) => /error|EBUSY|lock/i.test(l)).slice(0, 5).join(" | ") : "none");
} finally {
  spawn("taskkill", ["/pid", String(srv.pid), "/T", "/F"], { shell: true });
  await wait(1500);
}
