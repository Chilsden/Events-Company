// End-to-end smoke test against the production build, using a throwaway data folder and synthetic data.
// Run `npm run build` first. It starts `next start` on 127.0.0.1:3199, drives the real pages and the real
// no-JavaScript form submissions (events, guests, check-in), restarts the server to prove persistence, then removes
// the temporary folder.
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
const decodeHtml = (s) => s.replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const text = (html) => decodeHtml(html.replace(/<!-- -->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));

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

/** Splits a page into its <form> blocks and returns each one's hidden inputs (React puts the server-action ids there). */
function forms(html) {
  return [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => {
    const hidden = [...m[0].matchAll(/<input[^>]*type="hidden"[^>]*>/g)].map((i) => ({
      name: decodeHtml(/name="([^"]*)"/.exec(i[0])?.[1] ?? ""),
      value: decodeHtml(/value="([^"]*)"/.exec(i[0])?.[1] ?? ""),
    }));
    return { html: m[0], hidden };
  });
}
async function post(pathname, hidden, fields) {
  const form = new FormData();
  for (const h of hidden) if (h.name) form.append(h.name, h.value);
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  return fetch(BASE + pathname, { method: "POST", body: form, redirect: "manual" });
}
const page = async (pathname) => (await fetch(BASE + pathname)).text();
const noticeOf = (res) => new URL(res.headers.get("location") ?? "/", BASE).searchParams.get("notice");

let server = start();
try {
  check("production server starts on 127.0.0.1", await ready(), server.output.slice(-300));

  // ---- first slice: events
  const home = await page("/");
  check("dashboard shows the local-demonstration warning", home.includes("Local demonstration only — no sign-in or production security."));
  check("dashboard starts with no events", /<strong>0<\/strong>\s*events/.test(home.replace(/<!-- -->/g, "")));

  const newPage = await page("/events/new");
  const eventForm = forms(newPage).find((f) => f.html.includes('name="name"'));
  check("new-event form has labelled fields", ["name", "date", "location", "description"].every((f) => newPage.includes(`for="${f}"`)));

  const bad = await post("/events/new", eventForm.hidden, { name: "", date: "2027-02-30", location: "" });
  const badHtml = await bad.text();
  check("invalid event is rejected with messages", bad.status === 200 && badHtml.includes("Enter an event name.") && badHtml.includes("real date") && badHtml.includes("Enter the event location."), `status ${bad.status}`);

  const good = await post("/events/new", eventForm.hidden, { name: "Smoke Test Party", date: "2027-06-18", location: "Test Hall, London", description: "Synthetic <b>smoke</b> test" });
  const where = good.headers.get("location") ?? "";
  check("valid event redirects to the new event", [303, 307].includes(good.status) && /\/events\/[0-9a-f-]{36}$/.test(where), `status ${good.status} location ${where}`);
  const eventPath = new URL(where, BASE).pathname;
  const eventId = eventPath.split("/").pop();

  const detailHtml = await page(eventPath);
  check("details page shows the saved event", detailHtml.includes("Smoke Test Party") && detailHtml.includes("Test Hall, London"));
  check("details page escapes markup in the description", detailHtml.includes("&lt;b&gt;smoke&lt;/b&gt;") && !detailHtml.includes("<b>smoke</b>"));
  check("details page links to Check-in Studio", detailHtml.includes(`href="${eventPath}/check-in"`));
  check("list shows the event", (await page("/events")).includes("Smoke Test Party"));

  const unknown = await fetch(BASE + "/events/33333333-3333-4333-8333-333333333333");
  check("unknown event id returns 404", unknown.status === 404 && (await unknown.text()).includes("Event not found"));
  check("malformed event id returns 404", (await fetch(BASE + "/events/not-a-uuid")).status === 404);

  // ---- Check-in Studio
  const studioPath = `${eventPath}/check-in`;
  let studio = await page(studioPath);
  const t0 = text(studio);
  check("Check-in Studio opens with the warning and an empty state", studio.includes("Local demonstration only") && t0.includes("There are no guests yet"));
  check("attendance starts at 0 / 0 / 0", /Total guests 0 Checked in 0 Not yet checked in 0/.test(t0), t0.slice(0, 300));

  const addForm = forms(studio).find((f) => f.html.includes('name="name"') && f.html.includes('id="guest-name"'));
  const noName = await post(studioPath, addForm.hidden, { name: "   " });
  const noNameHtml = text(await noName.text());
  check("a blank guest name is rejected with a message and adds nobody", noName.status === 200 && noNameHtml.includes("Enter the guest's name.") && /Total guests 0/.test(text(await page(studioPath))), noNameHtml.slice(0, 200));

  const names = ["Alex Example", "Bea Example", "Cal Example"];
  for (const name of names) {
    const r = await post(studioPath, addForm.hidden, { name });
    check(`guest "${name}" is added and the page reports it`, [303, 307].includes(r.status) && noticeOf(r) === "added", `status ${r.status} ${r.headers.get("location")}`);
  }
  studio = await page(studioPath);
  const t1 = text(studio);
  check("guest list shows all three guests, not checked in", names.every((n) => t1.includes(n)) && (t1.match(/Not yet checked in/g) ?? []).length >= 3);
  check("attendance is 3 / 0 / 3", /Total guests 3 Checked in 0 Not yet checked in 3/.test(t1), t1.slice(0, 300));
  const checkInForms = forms(studio).filter((f) => f.hidden.some((h) => h.name === "guestId"));
  check("each guest has a check-in button naming the guest", checkInForms.length === 3 && names.every((n) => studio.replace(/<!-- -->/g, "").includes(`Check in<span class="visually-hidden"> ${n}</span>`)));

  const guestOf = (f) => f.hidden.find((h) => h.name === "guestId").value;
  const first = checkInForms[0];
  const r1 = await post(studioPath, first.hidden, {});
  check("check-in succeeds", [303, 307].includes(r1.status) && noticeOf(r1) === "checked-in", `${r1.status} ${r1.headers.get("location")}`);
  const afterFirst = await page(new URL(r1.headers.get("location"), BASE).pathname + new URL(r1.headers.get("location"), BASE).search);
  const t2 = text(afterFirst);
  check("page confirms the check-in by name and attendance is 3 / 1 / 2", /is now checked in/.test(t2) && /Total guests 3 Checked in 1 Not yet checked in 2/.test(t2), t2.slice(0, 300));

  const r2 = await post(studioPath, first.hidden, {});
  check("repeating the check-in reports 'already' and changes nothing", noticeOf(r2) === "already");
  const burst = await Promise.all(Array.from({ length: 8 }, () => post(studioPath, checkInForms[1].hidden, {})));
  const notices = burst.map(noticeOf);
  check("8 simultaneous check-ins of one guest: exactly one succeeds", notices.filter((n) => n === "checked-in").length === 1 && notices.filter((n) => n === "already").length === 7, notices.join(","));
  const t3 = text(await page(studioPath));
  check("attendance is 3 / 2 / 1 after the burst", /Total guests 3 Checked in 2 Not yet checked in 1/.test(t3), t3.slice(0, 300));
  check("search finds a guest by part of the name", text(await page(`${studioPath}?q=bea`)).includes("Bea Example") && !text(await page(`${studioPath}?q=bea`)).includes("Alex Example"));
  check("search with no match shows a message", text(await page(`${studioPath}?q=nobody`)).includes("No guests match that search"));
  check("a made-up notice in the address is ignored", !text(await page(`${studioPath}?notice=%3Cscript%3E`)).includes("<script>"));

  // ---- isolation between events
  const second = await post("/events/new", eventForm.hidden, { name: "Second Smoke Event", date: "2027-07-01", location: "Elsewhere" });
  const secondPath = new URL(second.headers.get("location"), BASE).pathname;
  const secondStudio = `${secondPath}/check-in`;
  const t4 = text(await page(secondStudio));
  check("a second event shows none of the first event's guests", !names.some((n) => t4.includes(n)) && t4.includes("There are no guests yet"));
  const cross = await post(secondStudio, [...first.hidden.filter((h) => h.name !== "eventId"), { name: "eventId", value: secondPath.split("/").pop() }], {});
  const crossNotice = noticeOf(cross);
  check("checking in event 1's guest through event 2 is refused", crossNotice === "not-found", String(crossNotice));
  const wrongId = first.hidden.filter((h) => h.name !== "guestId");
  const unknownGuest = await post(studioPath, [...wrongId, { name: "guestId", value: "44444444-4444-4444-8444-444444444444" }], {});
  check("checking in an unknown guest is refused", noticeOf(unknownGuest) === "not-found");
  const junkGuest = await post(studioPath, [...wrongId, { name: "guestId", value: "not-a-uuid" }], {});
  check("checking in a malformed guest id is refused", noticeOf(junkGuest) === "not-found");
  check("Check-in Studio for an unknown event returns 404", (await fetch(BASE + "/events/33333333-3333-4333-8333-333333333333/check-in")).status === 404);
  check("Check-in Studio for a malformed event id returns 404", (await fetch(BASE + "/events/nope/check-in")).status === 404);
  const t5 = text(await page(studioPath));
  check("event 1 attendance is unchanged by the refused attempts (3 / 2 / 1)", /Total guests 3 Checked in 2 Not yet checked in 1/.test(t5), t5.slice(0, 300));

  // ---- persistence across a restart
  await stop(server);
  server = start();
  check("server restarts", await ready(), server.output.slice(-300));
  const t6 = text(await page(studioPath));
  check("guests and check-ins are still there after a server restart", names.every((n) => t6.includes(n)) && /Total guests 3 Checked in 2 Not yet checked in 1/.test(t6), t6.slice(0, 300));
  const again = await post(studioPath, first.hidden, {});
  check("a check-in repeated after the restart still reports 'already'", noticeOf(again) === "already");
  check("no errors in server output", !/error|unhandled/i.test(server.output), server.output.slice(-400));
} finally {
  await stop(server);
  rmSync(path.dirname(dataDir), { recursive: true, force: true });
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} smoke checks passed`);
process.exit(failed ? 1 : 0);
