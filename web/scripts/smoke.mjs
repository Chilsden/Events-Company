// End-to-end smoke test against the production build, using a throwaway data folder and synthetic data.
// Run `npm run build` first. It starts `next start` on 127.0.0.1:3199 and drives the real pages and the real
// no-JavaScript form submissions (events, guests, CSV import, rename, check-in, undo, audit history), restarts the
// server to prove persistence, then removes the temporary folder. It is NOT a browser test.
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

/** Splits HTML into <form> blocks and returns each one's hidden inputs (React puts the server-action ids there). */
function forms(html) {
  return [...html.matchAll(/<form[\s\S]*?<\/form>/g)].map((m) => ({
    html: m[0],
    hidden: [...m[0].matchAll(/<input[^>]*type="hidden"[^>]*>/g)].map((i) => ({
      name: decodeHtml(/name="([^"]*)"/.exec(i[0])?.[1] ?? ""),
      value: decodeHtml(/value="([^"]*)"/.exec(i[0])?.[1] ?? ""),
    })),
  }));
}
/** Guest rows of the Check-in Studio page: id, name, state and the action form (with its hidden fields). */
function guestRows(html) {
  return [...html.matchAll(/<li[^>]*id="guest-([0-9a-f-]{36})"[\s\S]*?<\/li>/g)].map((m) => ({
    id: m[1],
    name: decodeHtml(/class="guest-name">([^<]*)</.exec(m[0])?.[1] ?? ""),
    checkedIn: m[0].includes("Checked in at"),
    form: forms(m[0])[0],
  }));
}
async function post(pathname, hidden, fields, files = {}) {
  const form = new FormData();
  for (const h of hidden) if (h.name) form.append(h.name, h.value);
  for (const [k, v] of Object.entries(fields)) form.set(k, v);
  for (const [k, f] of Object.entries(files)) form.set(k, new Blob([f.content], { type: f.type ?? "text/csv" }), f.name);
  return fetch(BASE + pathname, { method: "POST", body: form, redirect: "manual" });
}
const page = async (p) => (await fetch(BASE + p)).text();
/** Follows an action's redirect and returns the page it lands on, where the server's receipt message appears. */
async function follow(res) {
  const loc = res.headers.get("location");
  if (!loc) return { location: "", html: await res.text(), text: "" };
  const url = new URL(loc, BASE);
  const html = await page(url.pathname + url.search);
  return { location: loc, html, text: text(html) };
}
const totals = (t) => (/Total guests (\d+) Checked in (\d+) Not yet checked in (\d+)/.exec(t) ?? []).slice(1).map(Number).join("/");

let server = start();
try {
  check("production server starts on 127.0.0.1", await ready(), server.output.slice(-300));

  // ---- events (slice 1)
  const home = await page("/");
  check("dashboard shows the local-demonstration warning", home.includes("Local demonstration only — no sign-in or production security."));
  const newPage = await page("/events/new");
  const eventForm = forms(newPage).find((f) => f.html.includes('name="name"'));
  const bad = await post("/events/new", eventForm.hidden, { name: "", date: "2027-02-30", location: "" });
  const badHtml = await bad.text();
  check("invalid event is rejected with messages", bad.status === 200 && badHtml.includes("Enter an event name.") && badHtml.includes("real date"));
  const good = await post("/events/new", eventForm.hidden, { name: "Smoke Test Party", date: "2027-06-18", location: "Test Hall, London", description: "Synthetic <b>smoke</b> test" });
  const eventPath = new URL(good.headers.get("location") ?? "/", BASE).pathname;
  check("valid event redirects to the new event", [303, 307].includes(good.status) && /\/events\/[0-9a-f-]{36}$/.test(eventPath), `${good.status} ${eventPath}`);
  const detailHtml = await page(eventPath);
  check("details page shows the event, escapes markup and links to Check-in Studio", detailHtml.includes("Smoke Test Party") && detailHtml.includes("&lt;b&gt;smoke&lt;/b&gt;") && detailHtml.includes(`href="${eventPath}/check-in"`));
  check("unknown and malformed event ids return 404", (await fetch(BASE + "/events/33333333-3333-4333-8333-333333333333")).status === 404 && (await fetch(BASE + "/events/not-a-uuid")).status === 404);

  // ---- Check-in Studio: empty state, add
  const studioPath = `${eventPath}/check-in`;
  let studio = await page(studioPath);
  check("Check-in Studio opens empty, with the warning and attendance 0/0/0", studio.includes("Local demonstration only") && text(studio).includes("There are no guests yet") && totals(text(studio)) === "0/0/0");
  const addForm = forms(studio).find((f) => f.html.includes('id="guest-name"'));
  const blank = await post(studioPath, addForm.hidden, { name: "   " });
  check("a blank guest name is rejected and adds nobody", blank.status === 200 && text(await blank.text()).includes("Enter the guest's name.") && totals(text(await page(studioPath))) === "0/0/0");
  const formula = await post(studioPath, addForm.hidden, { name: "=1+1" });
  check("a name that starts like a spreadsheet formula is rejected", formula.status === 200 && text(await formula.text()).includes("formulas"));
  const added = await follow(await post(studioPath, addForm.hidden, { name: "Zed Manual" }));
  check("adding a guest works and the page confirms it (server receipt)", added.text.includes("Zed Manual was added to the guest list."), added.text.slice(0, 200));

  // ---- forged confirmation messages
  const rowsNow = guestRows(await page(studioPath));
  for (const forged of [`?notice=checked-in&g=${rowsNow[0].id}`, "?r=checked-in", "?r=AAAAAAAAAAAAAAAAAAAAAA", "?notice=imported&count=999"]) {
    const html = await page(studioPath + forged);
    check(`a forged link (${forged.slice(0, 26)}) shows no confirmation message`, !html.includes('class="notice') && !text(html).includes("is now checked in") && !text(html).includes("imported from the file"));
  }

  // ---- CSV import
  const example = await fetch(BASE + "/example-guests.csv");
  const exampleText = await example.text();
  check("the example CSV downloads, has a name header and ten synthetic guests", example.status === 200 && exampleText.split(/\r?\n/).filter(Boolean).length === 11 && exampleText.startsWith("name"));
  const importPath = `${studioPath}/import`;
  const importPage = await page(importPath);
  check("import page explains the rules and limits", /UTF-8/.test(importPage) && /500 guests/.test(importPage.replace(/<!-- -->/g, "")) && importPage.includes("example-guests.csv"));
  const uploadForm = forms(importPage).find((f) => f.html.includes('type="file"'));
  const upload = (content, name = "guests.csv", type = "text/csv") => post(importPath, uploadForm.hidden, {}, { file: { content, name, type } });

  const refusals = [
    ["a file that is not a CSV", upload(exampleText, "guests.xlsx", "application/vnd.ms-excel"), "ending in .csv"],
    ["a file with the wrong header", upload("guest\r\nA Example\r\n"), "header"],
    ["a file with extra columns", upload("name,email\r\nA Example,a@example.invalid\r\n"), "2 columns"],
    ["a file that is not UTF-8", upload(new Uint8Array([0x6e, 0x61, 0x6d, 0x65, 0x0a, 0xe9, 0x0a])), "UTF-8"],
    ["a file over the row limit", upload("name\r\n" + Array.from({ length: 501 }, (_, i) => `G ${i}`).join("\r\n")), "500"],
    ["a file over the size limit", upload("name\r\n" + "A Example\r\n".repeat(30000)), "larger than"],
  ];
  for (const [label, res, expected] of refusals) {
    const r = await res;
    const t = text(await r.text());
    check(`import refuses ${label} with a clear message`, r.status === 200 && t.includes("cannot be imported") && t.includes(expected) && !/[A-Z]:\\|node_modules|SQL|postgres/i.test(t), t.slice(0, 200));
  }
  check("refused files saved nothing", totals(text(await page(studioPath))) === "1/0/1");

  const previewHtml = await (await upload(exampleText + "=Bad Row\r\n")).text();
  const previewText = text(previewHtml);
  check("preview shows the number to import, the skipped row and a confirm button", /10 guests will be imported/.test(previewText) && /Row 12: .*formula/.test(previewText) && previewText.includes("Import 10 guests"), previewText.slice(0, 300));
  check("previewing saves nothing", totals(text(await page(studioPath))) === "1/0/1");

  const freshHtml = await (await upload(exampleText)).text();
  check("a clean file previews ten guests, with nothing saved yet", /10 guests will be imported/.test(text(freshHtml)) && text(freshHtml).includes("Nothing has been saved yet"));
  const confirmForm = forms(freshHtml).find((f) => f.hidden.some((h) => h.name === "names"));
  const tampered = await post(importPath, confirmForm.hidden.map((h) => (h.name === "names" ? { ...h, value: JSON.stringify(["=cmd|' /C calc'!A0"]) } : h)), {});
  check("a tampered confirmation is refused and saves nothing", tampered.status === 200 && text(await tampered.text()).includes("could not be confirmed") && totals(text(await page(studioPath))) === "1/0/1");
  const [c1, c2] = await Promise.all([post(importPath, confirmForm.hidden, {}), post(importPath, confirmForm.hidden, {})]);
  const [r1, r2] = await Promise.all([follow(c1), follow(c2)]);
  const messages = [r1.text, r2.text];
  check("a double submission imports once: one 'imported' and one 'already saved'", messages.filter((m) => m.includes("10 guests imported from the file.")).length === 1 && messages.filter((m) => m.includes("had already been saved")).length === 1, messages.map((m) => m.slice(0, 120)).join(" | "));
  studio = await page(studioPath);
  check("eleven guests, none checked in", totals(text(studio)) === "11/0/11");

  // ---- rename
  let rows = guestRows(studio);
  const alex = rows.find((r) => r.name === "Alex Example");
  const editPath = `${studioPath}/guests/${alex.id}/edit`;
  const editHtml = await page(editPath);
  const editForm = forms(editHtml).find((f) => f.html.includes('id="rename-name"'));
  check("the edit page shows the current name", editHtml.includes('value="Alex Example"'));
  const badRename = await post(editPath, editForm.hidden, { name: "jo@example.invalid" });
  check("renaming to an email-like text is refused", badRename.status === 200 && text(await badRename.text()).includes("names only"));
  const renamed = await follow(await post(editPath, editForm.hidden, { name: "Alexandra Example" }));
  check("renaming works, keeps the guest and confirms by the new name", renamed.text.includes("The guest's name is now Alexandra Example."), renamed.text.slice(0, 200));
  rows = guestRows(await page(studioPath));
  check("the guest keeps the same id after the rename", rows.some((r) => r.id === alex.id && r.name === "Alexandra Example") && !rows.some((r) => r.name === "Alex Example"));

  // ---- check in, repeat, undo, repeat, check in again
  const target = rows.find((r) => r.id === alex.id);
  const checkedIn = await follow(await post(studioPath, target.form.hidden, {}));
  check("check-in works, the page confirms and attendance is 11/1/10", checkedIn.text.includes("Alexandra Example is now checked in.") && totals(checkedIn.text) === "11/1/10", checkedIn.text.slice(0, 250));
  check("the redirect carries a receipt id and no message text", /\?r=[A-Za-z0-9_-]{22}/.test(checkedIn.location) && !/notice=|checked-in/.test(checkedIn.location), checkedIn.location);
  const again = await follow(await post(studioPath, target.form.hidden, {}));
  check("a repeated check-in says 'already checked in' and attendance stays 11/1/10", again.text.includes("was already checked in") && totals(again.text) === "11/1/10");
  const afterCheckIn = guestRows(await page(studioPath)).find((r) => r.id === alex.id);
  check("the guest row now offers 'Undo check-in'", afterCheckIn.checkedIn && afterCheckIn.form.html.includes("Undo check-in"));
  const undone = await follow(await post(studioPath, afterCheckIn.form.hidden, {}));
  check("undo works, is confirmed, and attendance returns to 11/0/11", undone.text.includes("check-in was undone") && totals(undone.text) === "11/0/11", undone.text.slice(0, 250));
  const undoAgain = await follow(await post(studioPath, afterCheckIn.form.hidden, {}));
  check("a repeated undo is safe: 'nothing to undo', attendance unchanged", undoAgain.text.includes("nothing to undo") && totals(undoAgain.text) === "11/0/11");
  const reCheck = await follow(await post(studioPath, guestRows(await page(studioPath)).find((r) => r.id === alex.id).form.hidden, {}));
  check("the guest can be checked in again afterwards (11/1/10)", reCheck.text.includes("is now checked in") && totals(reCheck.text) === "11/1/10");

  // ---- simultaneous check-ins of one other guest
  const bea = guestRows(await page(studioPath)).find((r) => r.name === "Bea Example");
  const burst = await Promise.all(Array.from({ length: 6 }, () => post(studioPath, bea.form.hidden, {}).then(follow)));
  const said = burst.map((b) => b.text);
  check("6 simultaneous check-ins of one guest: exactly one succeeds", said.filter((m) => m.includes("Bea Example is now checked in.")).length === 1 && said.filter((m) => m.includes("was already checked in")).length === 5, said.map((m) => m.slice(0, 80)).join(" | "));
  check("attendance is 11/2/9 after the burst", totals(text(await page(studioPath))) === "11/2/9");

  // ---- search
  check("search finds a guest by part of the name", text(await page(`${studioPath}?q=alexandra`)).includes("Alexandra Example") && !text(await page(`${studioPath}?q=alexandra`)).includes("Bea Example"));

  // ---- audit history
  const auditHtml = await page(`${studioPath}/audit`);
  const auditText = text(auditHtml);
  check("the audit history lists every kind of action, newest first, with the demo-operator label", ["Checked in again", "Check-in undone", "Guest name changed", "Guests imported from CSV (10)", "Guest added", "Checked in"].every((s) => auditText.includes(s)) && auditText.indexOf("Checked in") < auditText.indexOf("Guest name changed") && auditText.includes("Local demonstration operator") && auditText.includes("not a verified person"), auditText.slice(0, 400));
  const seqs = [...auditHtml.matchAll(/<tr><td>(\d+)<\/td>/g)].map((m) => Number(m[1]));
  check("audit sequence numbers strictly decrease down the page", seqs.length >= 7 && seqs.every((s, i) => i === 0 || s < seqs[i - 1]), seqs.join(","));
  check("the audit page has no edit or delete controls", !/<form|<button/i.test(auditHtml.split("<main")[1] ?? ""));

  // ---- search and isolation between events
  const second = await post("/events/new", eventForm.hidden, { name: "Second Smoke Event", date: "2027-07-01", location: "Elsewhere" });
  const secondPath = new URL(second.headers.get("location"), BASE).pathname;
  const secondStudio = `${secondPath}/check-in`;
  const t2 = text(await page(secondStudio));
  check("a second event shows none of the first event's guests and an empty audit history", !t2.includes("Alexandra") && t2.includes("There are no guests yet") && text(await page(`${secondStudio}/audit`)).includes("Nothing has been recorded"));
  const reAlex = guestRows(await page(studioPath)).find((r) => r.id === alex.id);
  const ev2 = secondPath.split("/").pop();
  const swap = (hidden) => hidden.map((h) => (h.name === "eventId" ? { ...h, value: ev2 } : h));
  const crossIn = await follow(await post(secondStudio, swap(reAlex.form.hidden), {}));
  check("undoing event 1's guest through event 2 is refused and changes nothing", crossIn.text.includes("could not be found") && totals(text(await page(studioPath))) === "11/2/9");
  check("event 1's guest cannot be opened for editing through event 2", (await fetch(`${BASE}${secondStudio}/guests/${alex.id}/edit`)).status === 404);
  await post(`${secondStudio}/guests/${alex.id}/edit`, swap(editForm.hidden), { name: "Hijacked" });
  check("renaming event 1's guest through event 2 is refused", !guestRows(await page(studioPath)).some((r) => r.name === "Hijacked"));
  await post(`${secondStudio}/import`, swap(confirmForm.hidden), {});
  check("replaying event 1's import confirmation into event 2 imports nothing", totals(text(await page(secondStudio))) === "0/0/0");
  check("unknown events return 404 for Check-in Studio, import and audit", (await Promise.all(["check-in", "check-in/import", "check-in/audit"].map((s) => fetch(`${BASE}/events/33333333-3333-4333-8333-333333333333/${s}`)))).every((r) => r.status === 404));

  // ---- persistence across a restart
  const countBefore = /of (\d+) recorded events/.exec(text(await page(`${studioPath}/audit`)))?.[1];
  await stop(server);
  server = start();
  check("server restarts", await ready(), server.output.slice(-300));
  const t6 = text(await page(studioPath));
  check("guests, the renamed name, the check-ins and the totals survive a restart", t6.includes("Alexandra Example") && totals(t6) === "11/2/9", t6.slice(0, 200));
  const countAfter = /of (\d+) recorded events/.exec(text(await page(`${studioPath}/audit`)))?.[1];
  check("the audit history survives a restart unchanged", countBefore !== undefined && countAfter === countBefore, `${countBefore} vs ${countAfter}`);
  const reUndo = await follow(await post(studioPath, guestRows(await page(studioPath)).find((r) => r.id === alex.id).form.hidden, {}));
  check("undo still works after the restart (11/1/10)", reUndo.text.includes("check-in was undone") && totals(reUndo.text) === "11/1/10");
  check("no errors in server output", !/error|unhandled/i.test(server.output), server.output.slice(-400));
} finally {
  await stop(server);
  rmSync(path.dirname(dataDir), { recursive: true, force: true });
}
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} of ${results.length} smoke checks passed`);
process.exit(failed ? 1 : 0);
