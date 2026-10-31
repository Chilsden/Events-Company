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

  // ---- configurable inputs: the original event keeps its guest list and attendance
  const eventId = eventPath.split("/").pop();
  const mainOf = (html) => (html.split("<main")[1] ?? "").split("</main>")[0];
  const modulesPath = `${studioPath}/modules`;
  const modulesPage1 = await page(modulesPath);
  check("the original event still has the guest list and attendance switched on, signatures off", /id="module-guest_registration"[^>]*checked/.test(modulesPage1) && /id="module-attendance"[^>]*checked/.test(modulesPage1) && !/id="module-signature"[^>]*checked/.test(modulesPage1));
  check("planned inputs are listed as text only, with no control", text(modulesPage1).includes("Planned, not available yet") && text(modulesPage1).includes("Photograph capture or upload") && !/name="module_(photograph|video|drawing|text_message|consent)"/.test(modulesPage1));
  const sig1 = await page(`${studioPath}/collect`);
  check("the collection screen of an event with signatures off offers nothing to collect", text(sig1).includes("No input is switched on") && !sig1.includes('data-testid="pad"'));

  // ---- signature-only event
  const sigEv = await post("/events/new", eventForm.hidden, { name: "Signature Only Event", date: "2027-08-01", location: "Gallery" });
  const sigPath = new URL(sigEv.headers.get("location"), BASE).pathname;
  const sigId = sigPath.split("/").pop();
  const sigStudio = `${sigPath}/check-in`;
  const sigModules = `${sigStudio}/modules`;
  const sigModulesPage = await page(sigModules);
  const sigForm = forms(sigModulesPage).find((f) => f.html.includes('name="preset"'));
  const planned = await post(sigModules, sigForm.hidden, { module_guest_registration: "on", module_attendance: "on", module_photograph: "on" });
  check("a tampered form cannot switch on a planned input", planned.status === 200 && text(await planned.text()).includes("planned but not built yet"));
  const saved = await follow(await post(sigModules, sigForm.hidden, { preset: "signatures-only" }));
  check("choosing 'Signatures only' saves, confirms and ticks only signature capture", saved.text.includes("The inputs for this event were updated") && /id="module-signature"[^>]*checked/.test(saved.html) && !/id="module-guest_registration"[^>]*checked/.test(saved.html) && !/id="module-attendance"[^>]*checked/.test(saved.html), saved.text.slice(0, 200));
  check("the other event's configuration is unchanged by that", /id="module-guest_registration"[^>]*checked/.test(await page(modulesPath)) && !/id="module-signature"[^>]*checked/.test(await page(modulesPath)));

  const sigStudioPage = await page(sigStudio);
  const sigStudioText = text(sigStudioPage);
  check("the Check-in Studio of a signatures-only event has no guest list, registration, import or attendance", sigStudioText.includes("guest list is switched off") && !sigStudioPage.includes('id="guest-name"') && !sigStudioText.includes("Import guests") && !sigStudioText.includes("Total guests") && sigStudioPage.includes(`${sigStudio}/collect`));

  // the server refuses guest actions for the switched-off module, even when the form is replayed from another event
  const swapTo = (hidden, id) => hidden.map((h) => (h.name === "eventId" ? { ...h, value: id } : h));
  const addGuestForm = forms(await page(studioPath)).find((f) => f.html.includes('id="guest-name"'));
  const refusedAdd = await post(studioPath, swapTo(addGuestForm.hidden, sigId), { name: "Should Not Exist" });
  check("adding a guest to the signatures-only event is refused by the server", refusedAdd.status === 200 && text(await refusedAdd.text()).includes("guest list is switched off"));
  const someGuest = guestRows(await page(studioPath))[0];
  const refusedCheckIn = await follow(await post(studioPath, swapTo(someGuest.form.hidden, sigId), {}));
  check("checking in through the signatures-only event is refused", refusedCheckIn.text.includes("switched off"), refusedCheckIn.text.slice(0, 150));
  const importForm = forms(await page(`${studioPath}/import`)).find((f) => f.html.includes('type="file"'));
  const refusedImport = await post(`${studioPath}/import`, swapTo(importForm.hidden, sigId), {}, { file: { content: "name\r\nA Example\r\n", name: "g.csv" } });
  check("importing guests into the signatures-only event is refused", text(await refusedImport.text()).includes("switched off"));

  // collection screen
  const collectPath = `${sigStudio}/collect`;
  const collectHtml = await page(collectPath);
  const collectText = text(collectHtml);
  check("the collection screen shows the drawing area and nothing about registration", collectHtml.includes('data-testid="pad"') && collectHtml.includes("Signature drawing area") && !/<input[^>]*type="(email|tel)"/.test(collectHtml) && !/name="(name|email|phone|guestId)"/.test(collectHtml) && !/RSVP|your name|register/i.test(collectText), collectText.slice(0, 300));
  check("the collection screen states the accessibility limits honestly", collectText.includes("not been tested with a screen reader"));
  const sigSubmitForm = forms(collectHtml).find((f) => f.html.includes('name="payload"'));
  const STROKES = JSON.stringify({ strokes: [[[10, 10], [50, 40], [120, 20], [200, 90]], [[220, 30], [260, 80]]] });

  const noChoice = await post(collectPath, sigSubmitForm.hidden, { payload: STROKES });
  check("submitting without choosing display permission is refused: there is no default", noChoice.status === 200 && text(await noChoice.text()).includes("no default"));
  for (const [label, payload, expected] of [
    ["an empty signature", JSON.stringify({ strokes: [] }), "Draw a signature first"],
    ["a dot", JSON.stringify({ strokes: [[[100, 100]]] }), "Draw a signature first"],
    ["a payload that is not JSON", "<script>alert(1)</script>", "could not be read"],
    ["a payload with extra markup", JSON.stringify({ strokes: [[[10, 10], [50, 40], [120, 20]]], svg: "<svg onload=alert(1)>" }), "could not be read"],
    ["an oversized payload", "x".repeat(130000), "too large"],
  ]) {
    const res = await post(collectPath, sigSubmitForm.hidden, { payload, permission: "granted" });
    const body = text(await res.text());
    check(`${label} is refused with a clear message`, res.status === 200 && body.includes(expected) && !body.includes("alert(1)"), body.slice(0, 200));
  }
  const badGuest = await post(collectPath, sigSubmitForm.hidden, { payload: STROKES, permission: "granted", guestId: "44444444-4444-4444-8444-444444444444" });
  check("linking to a guest is refused when the guest list is off", badGuest.status === 200 && /guest list is switched off|could not be found/.test(text(await badGuest.text())));
  const none = await page(`${sigStudio}/contributions`);
  check("nothing was saved by the refused submissions", text(none).includes("No signatures have been collected") && /Eligible for display by other products \(Mosaic, Event Gallery\): 0 of 0/.test(text(none)));

  const one = await follow(await post(collectPath, sigSubmitForm.hidden, { payload: STROKES, permission: "granted" }));
  check("an anonymous signature with explicit permission is saved and confirmed", one.text.includes("The signature was saved. You can add another.") && /\?r=[A-Za-z0-9_-]{22}/.test(one.location), one.text.slice(0, 200));
  check("another signature can follow straight away on the same screen", one.html.includes('data-testid="pad"'));
  const two = await follow(await post(collectPath, sigSubmitForm.hidden, { payload: STROKES, permission: "denied" }));
  check("a signature saved with 'do not show' is stored too", two.text.includes("The signature was saved"));
  const forgedCollect = await page(`${collectPath}?r=AAAAAAAAAAAAAAAAAAAAAA`);
  const forgedCollect2 = await page(`${collectPath}?notice=contribution-saved`);
  check("a forged link cannot make the collection screen claim a signature was saved", !forgedCollect.includes('class="notice') && !forgedCollect2.includes('class="notice'));
  check("no guest record was created for the signatures", text(await page(sigStudio)).includes("guest list is switched off") && (await (await fetch(`${BASE}${sigStudio}`)).text()).indexOf("guest-") === -1);

  // organiser's list and revocation
  const contribPath = `${sigStudio}/contributions`;
  const contribHtml = await page(contribPath);
  const contribText = text(contribHtml);
  check("the organiser sees both signatures, with times, anonymity and permission status", (contribHtml.match(/<svg[^>]*signature-image/g) ?? []).length === 2 && contribText.includes("No (anonymous)") && contribText.includes("Display permission given") && contribText.includes("Display permission not given") && !/<script|<image|onload/i.test(mainOf(contribHtml)), contribText.slice(0, 300));
  check("only the signature with permission given counts as eligible for other products (1 of 2)", /Eligible for display by other products \(Mosaic, Event Gallery\): 1 of 2/.test(contribText));
  const revokeForm = forms(contribHtml).find((f) => f.hidden.some((h) => h.name === "contributionId"));
  check("only the permitted signature offers 'Withdraw display permission'", forms(contribHtml).filter((f) => f.hidden.some((h) => h.name === "contributionId")).length === 1);
  const revoked = await follow(await post(contribPath, revokeForm.hidden, {}));
  check("withdrawing permission is confirmed and the signature is kept", revoked.text.includes("Display permission was withdrawn") && (revoked.html.match(/<svg[^>]*signature-image/g) ?? []).length === 2 && revoked.text.includes("Display permission withdrawn"), revoked.text.slice(0, 250));
  check("after withdrawal nothing is eligible for display (0 of 2)", /Eligible for display by other products \(Mosaic, Event Gallery\): 0 of 2/.test(revoked.text));
  const again2 = await follow(await post(contribPath, revokeForm.hidden, {}));
  check("withdrawing twice is safe", again2.text.includes("was not active for that item") && /: 0 of 2/.test(again2.text));

  // isolation between events for contributions
  const otherContrib = text(await page(`${studioPath}/contributions`));
  check("the other event shows none of these signatures", otherContrib.includes("No signatures have been collected") && /: 0 of 0/.test(otherContrib));
  const crossRevoke = await follow(await post(`${studioPath}/contributions`, swapTo(revokeForm.hidden, eventId), {}));
  check("withdrawing a signature through another event is refused", crossRevoke.text.includes("could not be found"));
  const crossSubmit = await post(`${studioPath}/collect`, swapTo(sigSubmitForm.hidden, eventId), { payload: STROKES, permission: "granted" });
  check("submitting a signature to an event with the input switched off is refused by the server", /switched off/.test(text(await crossSubmit.text())));
  check("unknown events return 404 for the new pages", (await Promise.all(["check-in/collect", "check-in/modules", "check-in/contributions"].map((s) => fetch(`${BASE}/events/33333333-3333-4333-8333-333333333333/${s}`)))).every((x) => x.status === 404));

  // switching the input off keeps what was collected
  const off = await follow(await post(sigModules, sigForm.hidden, { module_guest_registration: "on", module_attendance: "on" }));
  check("switching signature capture off is confirmed and keeps earlier signatures", off.text.includes("Anything already collected has been kept") && (text(await page(contribPath)).includes("These earlier signatures have been kept")));
  const afterOff = await post(collectPath, sigSubmitForm.hidden, { payload: STROKES, permission: "granted" });
  check("with signatures switched off a new submission is refused", /switched off/.test(text(await afterOff.text())));
  check("a dependency rule is enforced: attendance needs the guest list", text(await (await post(sigModules, sigForm.hidden, { module_attendance: "on" })).text()).includes("needs"));
  await follow(await post(sigModules, sigForm.hidden, { preset: "signatures-only" }));
  const sigAudit = text(await page(`${sigStudio}/audit`));
  check("the audit history records the configuration changes, the signatures and the withdrawal, without any names", ["Input switched on", "Input switched off", "Signature submitted", "Display permission withdrawn"].every((s) => sigAudit.includes(s)) && !sigAudit.includes("Should Not Exist"), sigAudit.slice(0, 300));

  // ---- guest list and signatures together: the collection screen never lists guests
  await follow(await post(modulesPath, forms(await page(modulesPath)).find((f) => f.html.includes('name="preset"')).hidden, { preset: "guest-list-and-signatures" }));
  const bothCollect = await page(`${studioPath}/collect`);
  check("with the guest list on, the collection screen still shows no guest names and no guest picker", bothCollect.includes('data-testid="pad"') && !bothCollect.includes("<select") && !text(bothCollect).includes("Alexandra Example") && !text(bothCollect).includes("Zed Manual"));
  const aGuest = guestRows(await page(studioPath)).find((g) => g.name === "Zed Manual");
  check("each guest row offers 'Take a signature' for that guest", (await page(studioPath)).includes(`href="${studioPath}/collect?guest=${aGuest.id}"`));
  const linkedCollect = await page(`${studioPath}/collect?guest=${aGuest.id}`);
  check("opening the collection screen from a guest's row says whom it will be linked to, and only that guest", text(linkedCollect).includes("This signature will be linked to Zed Manual"), text(linkedCollect).slice(0, 300));
  const linkedForm = forms(linkedCollect).find((f) => f.html.includes('name="payload"'));
  check("the link carries that guest's id in the form (and no list of others)", linkedForm.hidden.some((h) => h.name === "guestId" && h.value === aGuest.id) && !linkedForm.html.includes("<select"));
  const foreignGuestLink = await page(`${studioPath}/collect?guest=${alex.id.replace(/.$/, "0")}`);
  check("a guest id that is not on this event links nothing", !forms(foreignGuestLink).some((f) => f.hidden.some((h) => h.name === "guestId")));
  const linkedSave = await follow(await post(`${studioPath}/collect`, linkedForm.hidden, { payload: STROKES, permission: "granted", guestId: aGuest.id }));
  check("a signature can be linked to a valid guest of the same event", linkedSave.text.includes("The signature was saved"));
  const linkedList = text(await page(`${studioPath}/contributions`));
  check("the organiser sees it as linked to a guest, still without the guest's name on the signature record", linkedList.includes("Linked to a guest Yes") && !linkedList.includes("Zed Manual"));
  const wrongGuest = await post(`${studioPath}/collect`, linkedForm.hidden, { payload: STROKES, permission: "granted", guestId: sigId });
  check("linking to something that is not a guest of this event is refused", wrongGuest.status === 200 && text(await wrongGuest.text()).includes("could not be found"));
  await follow(await post(modulesPath, forms(await page(modulesPath)).find((f) => f.html.includes('name="preset"')).hidden, { preset: "guest-list" }));

  // ---- persistence across a restart
  const countBefore = /of (\d+) recorded events/.exec(text(await page(`${studioPath}/audit`)))?.[1];
  await stop(server);
  server = start();
  check("server restarts", await ready(), server.output.slice(-300));
  const t6 = text(await page(studioPath));
  check("guests, the renamed name, the check-ins and the totals survive a restart", t6.includes("Alexandra Example") && totals(t6) === "11/2/9", t6.slice(0, 200));
  const countAfter = /of (\d+) recorded events/.exec(text(await page(`${studioPath}/audit`)))?.[1];
  check("the audit history survives a restart unchanged", countBefore !== undefined && countAfter === countBefore, `${countBefore} vs ${countAfter}`);
  const sigContribAfter = text(await page(contribPath));
  check("after a restart the signature-only configuration, both signatures and the withdrawal are still there", /: 0 of 2/.test(sigContribAfter) && (await page(`${sigStudio}/modules`)).match(/id="module-signature"[^>]*checked/) !== null && !/id="module-guest_registration"[^>]*checked/.test(await page(`${sigStudio}/modules`)));
  const freshCollect = await page(collectPath);
  const freshSubmit = forms(freshCollect).find((f) => f.html.includes('name="payload"'));
  const afterRestartSave = await follow(await post(collectPath, freshSubmit.hidden, { payload: STROKES, permission: "granted" }));
  check("after a restart signatures can still be submitted and are eligible (1 of 3)", afterRestartSave.text.includes("The signature was saved") && /: 1 of 3/.test(text(await page(contribPath))));
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
