import { describe, expect, it } from "vitest";
import { EVENT_LIMITS, formatEventDate, isUuid, parseEventForm } from "@/domain/event";

const valid = { name: "Summer Launch", date: "2027-06-18", location: "Test Hall, London", description: "A synthetic test event." };

describe("parseEventForm", () => {
  it("accepts a valid event and trims whitespace", () => {
    const r = parseEventForm({ ...valid, name: "  Summer Launch  ", location: " Test Hall " });
    expect(r).toEqual({ ok: true, value: { name: "Summer Launch", date: "2027-06-18", location: "Test Hall", description: "A synthetic test event." } });
  });

  it("treats a missing or blank description as null", () => {
    for (const description of [undefined, "", "   "]) {
      const r = parseEventForm({ ...valid, description });
      expect(r.ok && r.value.description).toBeNull();
    }
  });

  it("accepts values exactly at the length limits", () => {
    const r = parseEventForm({
      ...valid,
      name: "n".repeat(EVENT_LIMITS.name),
      location: "l".repeat(EVENT_LIMITS.location),
      description: "d".repeat(EVENT_LIMITS.description),
    });
    expect(r.ok).toBe(true);
  });

  it.each([
    ["name", { name: "" }, "Enter an event name."],
    ["name", { name: "   " }, "Enter an event name."],
    ["name", { name: undefined }, "Enter an event name."],
    ["name", { name: "n".repeat(EVENT_LIMITS.name + 1) }, "120 characters or fewer"],
    ["name", { name: "bad\u0000name" }, "not allowed"],
    ["date", { date: "" }, "Enter the event date."],
    ["date", { date: "18/06/2027" }, "real date"],
    ["date", { date: "2027-02-30" }, "real date"],
    ["date", { date: "2027-13-01" }, "real date"],
    ["date", { date: "1999-12-31" }, "real date"],
    ["date", { date: "2101-01-01" }, "real date"],
    ["date", { date: "2027-6-18" }, "real date"],
    ["location", { location: "" }, "Enter the event location."],
    ["location", { location: "l".repeat(EVENT_LIMITS.location + 1) }, "200 characters or fewer"],
    ["description", { description: "d".repeat(EVENT_LIMITS.description + 1) }, "2000 characters or fewer"],
    ["description", { description: "bad\u0007text" }, "not allowed"],
  ])("rejects an invalid %s (%j)", (field, override, message) => {
    const r = parseEventForm({ ...valid, ...override });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors[field as keyof typeof r.errors]).toContain(message);
      // submitted values are returned so the form can be refilled
      expect(Object.keys(r.values).sort()).toEqual(["date", "description", "location", "name"]);
    }
  });

  it("reports every invalid field at once", () => {
    const r = parseEventForm({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["date", "location", "name"]);
  });

  it("allows tabs and new lines in the description", () => {
    expect(parseEventForm({ ...valid, description: "line one\n\tline two" }).ok).toBe(true);
  });

  it("ignores unknown fields such as an account id", () => {
    const r = parseEventForm({ ...valid, accountId: "22222222-2222-4222-8222-222222222222" });
    expect(r.ok && Object.keys(r.value).sort()).toEqual(["date", "description", "location", "name"]);
  });

  it("ignores non-string values", () => {
    const r = parseEventForm({ ...valid, name: ["a"] as unknown as string });
    expect(r.ok).toBe(false);
  });
});

describe("helpers", () => {
  it("formats dates for UK readers without a time zone shift", () => {
    expect(formatEventDate("2027-06-18")).toMatch(/^Friday,? 18 June 2027$/); // comma depends on the ICU version
    expect(formatEventDate("2027-12-31")).toMatch(/^Friday,? 31 December 2027$/);
    expect(formatEventDate("2027-03-28")).toMatch(/^Sunday,? 28 March 2027$/); // clocks change in the UK that day
  });

  it("recognises UUIDs", () => {
    expect(isUuid("11111111-1111-4111-8111-111111111111")).toBe(true);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("11111111-1111-4111-8111-11111111111")).toBe(false);
    expect(isUuid("")).toBe(false);
  });
});
