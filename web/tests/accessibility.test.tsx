// @vitest-environment jsdom
import axe from "axe-core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout from "@/app/layout";
import { EventForm } from "@/components/EventForm";
import { AddGuestForm } from "@/components/GuestForms";
import { AttendanceSummary, GuestList, NoticeBanner } from "@/components/GuestViews";
import type { GuestRecord } from "@/domain/guest";
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

    it("guest list, empty list and empty search have no violations", async () => {
      expect(await violations(renderToStaticMarkup(<GuestList guests={guests} eventId={eventId} search="" checkInAction={submit} />))).toEqual([]);
      expect(await violations(renderToStaticMarkup(<GuestList guests={[]} eventId={eventId} search="" checkInAction={submit} />))).toEqual([]);
      expect(await violations(renderToStaticMarkup(<GuestList guests={[]} eventId={eventId} search="zzz" checkInAction={submit} />))).toEqual([]);
    });

    it("each check-in button names the guest for screen readers, and checked-in guests have no button", () => {
      document.body.innerHTML = renderToStaticMarkup(<GuestList guests={guests} eventId={eventId} search="" checkInAction={submit} />);
      const buttons = [...document.querySelectorAll("button")];
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent).toBe("Check in Alex Example");
      expect(document.body.textContent).toContain("Checked in at 14:05");
      expect(document.body.textContent).toContain("Not yet checked in");
    });

    it("status is conveyed by text, not colour alone", () => {
      document.body.innerHTML = renderToStaticMarkup(<GuestList guests={guests} eventId={eventId} search="" checkInAction={submit} />);
      for (const li of document.querySelectorAll("li.guest")) expect(li.textContent).toMatch(/checked in/i);
    });

    it("attendance summary, notices and the add-guest form (with and without an error) have no violations", async () => {
      expect(await violations(renderToStaticMarkup(<AttendanceSummary attendance={{ total: 3, checkedIn: 1, notCheckedIn: 2 }} />))).toEqual([]);
      for (const n of ["added", "checked-in", "already", "not-found", "error"] as const) {
        expect(await violations(renderToStaticMarkup(<NoticeBanner notice={n} guestName="Alex Example" />))).toEqual([]);
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
      const html = renderToStaticMarkup(<GuestList guests={evil} eventId={eventId} search="" checkInAction={submit} />);
      expect(html).not.toContain("<img");
      expect(html).toContain("&lt;img");
    });
  });
});
