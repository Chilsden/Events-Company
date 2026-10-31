// @vitest-environment jsdom
import axe from "axe-core";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout from "@/app/layout";
import { EventForm } from "@/components/EventForm";
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
});
