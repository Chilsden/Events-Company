// @vitest-environment jsdom
import axe from "axe-core";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import RootLayout from "@/app/layout";
import { EventForm } from "@/components/EventForm";
import { Announcer } from "@/components/ClientHelpers";
import { AuditList } from "@/components/AuditView";
import { AddGuestForm, ImportFlow, RenameGuestForm } from "@/components/GuestForms";
import { AttendanceSummary, GuestList, NoticeBanner } from "@/components/GuestViews";
import { NOTICES, type AuditEntry, type GuestRecord } from "@/domain/guest";
import { EventDetails, EventList, NotFoundContent } from "@/components/EventViews";
import type { EventRecord } from "@/domain/event";
import type { FormState } from "@/server/actions";

const event: EventRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  accountId: "22222222-2222-4222-8222-222222222222",
  name: "Summer Launch",
  date: "2027-06-18",
  location: "Test Hall",
  description: "A synthetic event.",
  createdAt: "2027-01-01T00:00:00.000Z",
};
const noop = async (): Promise<FormState> => ({});

// Colour contrast cannot be computed without a layout engine, so it is not checked here.
async function violations(html: string) {
  document.documentElement.lang = "en-GB";
  document.title = "Test page";
  document.body.innerHTML = `<main>${html}</main>`;
  const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
}

describe("basic accessibility (axe-core on server-rendered markup)", () => {
  it("event form has no violations", async () => {
    expect(await violations(renderToStaticMarkup(<EventForm action={noop} />))).toEqual([]);
  });

  it("every form control has a label and a required marker in its label", () => {
    const html = renderToStaticMarkup(<EventForm action={noop} />);
    document.body.innerHTML = html;
    for (const id of ["name", "date", "location", "description"]) {
      const label = document.querySelector(`label[for="${id}"]`);
      expect(label, id).not.toBeNull();
      expect(document.getElementById(id), id).not.toBeNull();
    }
    expect(document.querySelector('label[for="name"]')?.textContent).toContain("required");
    expect(document.querySelector('label[for="description"]')?.textContent).toContain("optional");
  });

  it("event form showing every error has no violations and links each message to its field", async () => {
    const errors = { name: "Enter an event name.", date: "Enter a real date.", location: "Enter the event location.", description: "Too long." };
    const html = renderToStaticMarkup(
      <EventForm action={noop} initialState={{ errors, values: { name: "", date: "", location: "", description: "" } }} />,
    );
    expect(await violations(html)).toEqual([]);
    for (const id of ["name", "date", "location", "description"]) {
      expect(document.querySelector(`#${id}[aria-invalid="true"]`), id).not.toBeNull();
      expect(document.querySelector(`#${id}`)?.getAttribute("aria-describedby")).toContain(`${id}-error`);
      expect(document.getElementById(`${id}-error`)?.textContent).toBe(errors[id as keyof typeof errors]);
      expect(document.querySelector(`.alert a[href="#${id}"]`), id).not.toBeNull();
    }
  });

  it("every page carries the local-demonstration warning, a skip link and a UK English language", () => {
    const html = renderToStaticMarkup(<RootLayout><p>page</p></RootLayout>);
    expect(html).toContain("Local demonstration only — no sign-in or production security.");
    expect(html).toContain('href="#main"');
    expect(html).toContain('lang="en-GB"');
    expect(html).toContain('id="main"');
  });

  it("list and empty list have no violations", async () => {
    expect(await violations(renderToStaticMarkup(<EventList events={[event]} />))).toEqual([]);
    expect(await violations(renderToStaticMarkup(<EventList events={[]} />))).toEqual([]);
  });

  it("details and not-found content have no violations", async () => {
    expect(await violations(renderToStaticMarkup(<EventDetails event={event} />))).toEqual([]);
    expect(await violations(renderToStaticMarkup(<NotFoundContent />))).toEqual([]);
  });

  it("escapes event text instead of treating it as markup", () => {
    const html = renderToStaticMarkup(<EventDetails event={{ ...event, name: "<script>alert(1)</script>", description: "<img src=x onerror=alert(1)>" }} />);
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  describe("Check-in Studio components", () => {
    const eventId = "22222222-2222-4222-8222-222222222222";
    const guests: GuestRecord[] = [
      { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", accountId: "11111111-1111-4111-8111-111111111111", eventId, name: "Alex Example", checkedInAt: null, createdAt: "2027-06-18T09:00:00.000Z" },
      { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", accountId: "11111111-1111-4111-8111-111111111111", eventId, name: "Bea Example", checkedInAt: "2027-06-18T13:05:00.000Z", createdAt: "2027-06-18T09:01:00.000Z" },
    ];
    const submit = async () => undefined;
    const list = (g: GuestRecord[], search = "") => <GuestList guests={g} eventId={eventId} search={search} checkInAction={submit} undoAction={submit} />;

    it("guest list, empty list and empty search have no violations", async () => {
      expect(await violations(renderToStaticMarkup(list(guests)))).toEqual([]);
      expect(await violations(renderToStaticMarkup(list([])))).toEqual([]);
      expect(await violations(renderToStaticMarkup(list([], "zzz")))).toEqual([]);
    });

    it("each action names the guest for screen readers: check in for those not in, undo for those in, edit for both", () => {
      document.body.innerHTML = renderToStaticMarkup(list(guests));
      const buttons = [...document.querySelectorAll("button")].map((b) => b.textContent);
      expect(buttons).toEqual(["Check in Alex Example", "Undo check-in for Bea Example"]);
      expect([...document.querySelectorAll("a")].map((a) => a.textContent)).toEqual(["Edit name of Alex Example", "Edit name of Bea Example"]);
      expect(document.body.textContent).toContain("Checked in at 14:05");
      expect(document.body.textContent).toContain("Not yet checked in");
    });

    it("status is conveyed by text, not colour alone", () => {
      document.body.innerHTML = renderToStaticMarkup(list(guests));
      for (const li of document.querySelectorAll("li.guest")) expect(li.textContent).toMatch(/checked in/i);
    });

    it("attendance summary, notices and the add-guest form (with and without an error) have no violations", async () => {
      expect(await violations(renderToStaticMarkup(<AttendanceSummary attendance={{ total: 3, checkedIn: 1, notCheckedIn: 2 }} />))).toEqual([]);
      for (const n of NOTICES) {
        expect(await violations(renderToStaticMarkup(<NoticeBanner notice={n} guestName="Alex Example" count={3} />))).toEqual([]);
      }
      expect(await violations(renderToStaticMarkup(<AddGuestForm action={async () => ({})} eventId={eventId} />))).toEqual([]);
      expect(await violations(renderToStaticMarkup(<AddGuestForm action={async () => ({})} eventId={eventId} initialState={{ error: "Enter the guest's name.", value: "" }} />))).toEqual([]);
      expect(document.getElementById("guest-name")?.getAttribute("aria-describedby")).toContain("guest-name-error");
    });

    it("problem notices are announced as alerts and others as status messages", () => {
      expect(renderToStaticMarkup(<NoticeBanner notice="error" />)).toContain('role="alert"');
      expect(renderToStaticMarkup(<NoticeBanner notice="checked-in" guestName="Alex" />)).toContain('role="status"');
    });

    it("escapes guest names instead of treating them as markup", () => {
      const evil = [{ ...guests[0], name: "<img src=x onerror=alert(1)>" }];
      const html = renderToStaticMarkup(list(evil));
      expect(html).not.toContain("<img");
      expect(html).toContain("&lt;img");
    });
  });

  describe("guest management components", () => {
    const eventId = "22222222-2222-4222-8222-222222222222";
    const guestId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const entries: AuditEntry[] = [
      { seq: 3, action: "check_in_undone", guestId, guestName: "Alex Example", count: null, actor: "Local demonstration operator (not a verified person)", occurredAt: "2027-06-18T13:05:00.000Z" },
      { seq: 2, action: "guests_imported", guestId: null, guestName: null, count: 10, actor: "Local demonstration operator (not a verified person)", occurredAt: "2027-06-18T12:00:00.000Z" },
      { seq: 1, action: "guest_added", guestId, guestName: "Alex Example", count: null, actor: "Local demonstration operator (not a verified person)", occurredAt: "2027-06-18T11:00:00.000Z" },
    ];
    const preview = async () => ({});
    const preview1 = { submissionId: "55555555-5555-4555-8555-555555555555", names: ["A Example", "B Example"], invalid: [{ row: 3, reason: "Enter the guest's name." }], duplicatesInFile: 2, matchExisting: 1 };

    it("edit-name form, with and without an error, has no violations and links the error to the field", async () => {
      const rename = async () => ({});
      expect(await violations(renderToStaticMarkup(<RenameGuestForm action={rename} eventId={eventId} guestId={guestId} currentName="Alex" />))).toEqual([]);
      expect(await violations(renderToStaticMarkup(<RenameGuestForm action={rename} eventId={eventId} guestId={guestId} currentName="Alex" initialState={{ error: "Enter the guest's name.", value: "" }} />))).toEqual([]);
      expect(document.getElementById("rename-name")?.getAttribute("aria-describedby")).toContain("rename-name-error");
      expect(document.getElementById("rename-name")?.getAttribute("aria-invalid")).toBe("true");
    });

    it("import: upload form, error state and preview state have no violations", async () => {
      const flow = (initialPreview = {}) => renderToStaticMarkup(<ImportFlow eventId={eventId} previewAction={preview} confirmAction={preview} initialPreview={initialPreview} />);
      expect(await violations(flow())).toEqual([]);
      expect(await violations(flow({ error: "The file is empty." }))).toEqual([]);
      expect(await violations(flow({ preview: preview1 }))).toEqual([]);
      expect(document.getElementById("csv-file")).not.toBeNull();
      expect(document.querySelector('label[for="csv-file"]')?.textContent).toContain("required");
    });

    it("the preview states the count, warns about repeated names, lists skipped rows, and needs a separate confirm button", () => {
      document.body.innerHTML = renderToStaticMarkup(<ImportFlow eventId={eventId} previewAction={preview} confirmAction={preview} initialPreview={{ preview: preview1 }} />);
      const text = document.body.textContent ?? "";
      expect(document.querySelector('[data-testid="import-count"]')?.textContent).toBe("2");
      expect(text).toContain("separate guests");
      expect(text).toContain("Row 3: Enter the guest's name.");
      expect(text).toContain("Nothing has been saved yet");
      const confirm = [...document.querySelectorAll("button")].find((b) => b.textContent?.startsWith("Import 2"));
      expect(confirm).toBeDefined();
      expect(confirm?.closest("form")?.querySelector('input[name="names"]')).not.toBeNull();
    });

    it("audit table has headers, a caption, time elements and no violations; empty history has a message", async () => {
      expect(await violations(renderToStaticMarkup(<AuditList entries={entries} total={3} />))).toEqual([]);
      expect([...document.querySelectorAll("th")].map((h) => h.getAttribute("scope"))).toEqual(["col", "col", "col", "col", "col"]);
      expect(document.querySelectorAll("time").length).toBe(3);
      expect(document.body.textContent).toContain("Check-in undone");
      expect(document.body.textContent).toContain("Guests imported from CSV (10)");
      expect(await violations(renderToStaticMarkup(<AuditList entries={[]} total={0} />))).toEqual([]);
    });

    it("the announcer starts empty (visible text is already on the page) and then fills its live region", async () => {
      vi.useFakeTimers();
      const host = document.createElement("div");
      document.body.appendChild(host);
      const root = createRoot(host);
      try {
        await act(async () => {
          root.render(<Announcer text="Alex is now checked in." urgent={false} />);
        });
        const region = host.querySelector('[role="status"]')!;
        expect(region.textContent).toBe("");
        await act(async () => {
          vi.advanceTimersByTime(200);
        });
        expect(host.querySelector('[role="status"]')?.textContent).toBe("Alex is now checked in.");
        await act(async () => {
          root.render(<Announcer text="It failed." urgent />);
        });
        await act(async () => {
          vi.advanceTimersByTime(200);
        });
        expect(host.querySelector('[role="alert"]')?.textContent).toBe("It failed.");
      } finally {
        await act(async () => root.unmount());
        vi.useRealTimers();
      }
    });
  });
});
