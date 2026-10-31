// End-to-end smoke test against the production build, using a throwaway data folder and synthetic data.
// Run `npm run build` first. It starts `next start` on 127.0.0.1:3199, drives the real pages and the real
// no-JavaScript form submission, restarts the server to prove persistence, then removes the temporary folder.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const PORT = 3199;
const BASE = `http://127.0.0.1:${PORT}`;
const dataDir = path.join(mkdtempSync(path.join(tmpdir(), "events-smoke-")), "pglite");
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + detail}`);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function start() {
  const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(PORT)], {
    env: { ...process.env, EVENTS_DATA_DIR: dataDir },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.output = "";
  child.stdout.on("data", (d) => (child.output += d));
  child.stderr.on("data", (d) => (child.output += d));
  return child;
}
async function stop(child) {
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
  else child.kill("SIGTERM");
  await wait(1500);
}
async function ready() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(BASE + "/")).status === 200) return true; } catch { /* not up yet */ }
    await wait(1000);
  }
  return false;
}
const decodeHtml = (s) => s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
async function submit(fields) {
  const html = await (await fetch(BASE + "/events/new")).text();
  const form = new FormData();
  // React renders hidden inputs that identify the server action when JavaScript is off.
  for (const m of html.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]*)"/.exec(m[0])?.[1];
    const value = /value="([^"]*)"/.exec(m[0])?.[1] ?? "";
    if (name) form.append(decodeHtml(name), decodeHtml(value));
  }
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  return fetch(BASE + "/events/new", { method: "POST", body: form, redirect: "manual" });
}

let server = start();
try {
  check("production server starts on 127.0.0.1", await ready(), server.output.slice(-300));

  const home = await (await fetch(BASE + "/")).text();
  check("dashboard shows the local-demonstration warning", home.includes("Local demonstration only — no sign-in or production security."));
  check("dashboard starts with no events", /<strong>0<\/strong>\s*events/.test(home.replace(/<!-- -->/g, "")));

  const formPage = await (await fetch(BASE + "/events/new")).text();
  check("new-event form has labelled fields", ["name", "date", "location", "description"].every((f) => formPage.includes(`for="${f}"`)));

  const bad = await submit({ name: "", date: "2027-02-30", location: "" });
  const badHtml = await bad.text();
  check("invalid submission is rejected with messages", bad.status === 200 && badHtml.includes("Enter an event name.") && badHtml.includes("real date") && badHtml.includes("Enter the event location."), `status ${bad.status}`);

  const good = await submit({ name: "Smoke Test Party", date: "2027-06-18", location: "Test Hall, London", description: "Synthetic <b>smoke</b> test" });
  const where = good.headers.get("location") ?? "";
  check("valid submission redirects to the new event", [303, 307].includes(good.status) && /\/events\/[0-9a-f-]{36}$/.test(where), `status ${good.status} location ${where}`);

  const detailPath = new URL(where, BASE).pathname;
  const detail = await fetch(BASE + detailPath);
  const detailHtml = await detail.text();
  check("details page shows the saved event", detail.status === 200 && detailHtml.includes("Smoke Test Party") && detailHtml.includes("Test Hall, London"));
  check("details page escapes markup in the description", detailHtml.includes("&lt;b&gt;smoke&lt;/b&gt;") && !detailHtml.includes("<b>smoke</b>"));

  const list = await (await fetch(BASE + "/events")).text();
  check("list shows the event with a link to its details", list.includes("Smoke Test Party") && list.includes(`href="${detailPath}"`));

  const unknown = await fetch(BASE + "/events/33333333-3333-4333-8333-333333333333");
  check("unknown event id returns 404", unknown.status === 404 && (await unknown.text()).includes("Event not found"));
  const junk = await fetch(BASE + "/events/not-a-uuid");
  check("malformed event id returns 404", junk.status === 404);

  await stop(server);
  server = start();
  check("server restarts", await ready(), server.output.slice(-300));
  const after = await (await fetch(BASE + "/events")).text();
  check("event is still there after a server restart (persistence)", after.includes("Smoke Test Party"));
  check("no errors in server output", !/error|unhandled/i.test(server.output), server.output.slice(-400));
} finally {
  await stop(server);
  rmSync(path.dirname(dataDir), { recursive: true, force: true });
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} smoke checks passed`);
process.exit(failed ? 1 : 0);
