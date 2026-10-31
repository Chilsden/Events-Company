import { describe, expect, it } from "vitest";
import { IMPORT_LIMITS, checkFileDetails, decodeUtf8, parseCsv, prepareImport } from "@/domain/csv";
import { parseGuestForm } from "@/domain/guest";

const enc = (s: string) => new TextEncoder().encode(s);
const csv = (...lines: string[]) => enc(lines.join("\r\n") + "\r\n");

describe("decoding", () => {
  it("reads UTF-8, with or without a byte-order mark", () => {
    expect(decodeUtf8(enc("name\r\nZoë"))).toEqual({ ok: true, text: "name\r\nZoë" });
    const withBom = new Uint8Array([0xef, 0xbb, 0xbf, ...enc("name\r\nZoë")]);
    expect(decodeUtf8(withBom)).toEqual({ ok: true, text: "name\r\nZoë" });
  });
  it("refuses bytes that are not valid UTF-8 and binary files", () => {
    expect(decodeUtf8(new Uint8Array([0x6e, 0xe9, 0x0a])).ok).toBe(false); // Latin-1 é
    expect(decodeUtf8(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00])).ok).toBe(false); // zip / xlsx start, contains NUL
  });
});

describe("parseCsv", () => {
  it("handles quotes, escaped quotes, commas inside cells, and CRLF, LF or CR line ends", () => {
    expect(parseCsv('name\r\n"Smith, Jo"\n"Say ""hi"""\rplain\r\n')).toEqual([["name"], ["Smith, Jo"], ['Say "hi"'], ["plain"]]);
  });
  it("keeps a final row with no trailing line end, and returns nothing for empty text", () => {
    expect(parseCsv("name\nA")).toEqual([["name"], ["A"]]);
    expect(parseCsv("")).toEqual([]);
  });
  it("rejects an unclosed quote", () => {
    expect(() => parseCsv('name\n"oops')).toThrow();
  });
  it("never evaluates anything: formula text stays plain text", () => {
    expect(parseCsv("name\n=1+1\n=HYPERLINK(\"http://example.invalid\")")[1]).toEqual(["=1+1"]);
  });
});

describe("file checks", () => {
  const ok = { name: "guests.csv", size: 100, type: "text/csv" };
  it("accepts a csv file", () => {
    expect(checkFileDetails(ok)).toBeNull();
    expect(checkFileDetails({ ...ok, type: "" })).toBeNull(); // some browsers send no type
    expect(checkFileDetails({ ...ok, type: "text/csv; charset=utf-8" })).toBeNull(); // parameters are ignored
    expect(checkFileDetails({ ...ok, type: "TEXT/CSV" })).toBeNull();
    expect(checkFileDetails({ ...ok, type: "application/pdf; charset=utf-8" })).not.toBeNull();
    expect(checkFileDetails({ ...ok, name: "GUESTS.CSV", type: "application/vnd.ms-excel" })).toBeNull();
  });
  it.each([
    ["wrong extension", { ...ok, name: "guests.xlsx" }],
    ["no extension", { ...ok, name: "guests" }],
    ["executable", { ...ok, name: "run.csv.exe" }],
    ["wrong type", { ...ok, type: "application/pdf" }],
    ["empty", { ...ok, size: 0 }],
    ["too big", { ...ok, size: IMPORT_LIMITS.maxBytes + 1 }],
  ])("refuses a %s file", (_label, file) => {
    expect(checkFileDetails(file)).not.toBeNull();
  });
  it("accepts a file exactly at the size limit", () => {
    expect(checkFileDetails({ ...ok, size: IMPORT_LIMITS.maxBytes })).toBeNull();
  });
});

describe("prepareImport", () => {
  it("accepts a valid file and keeps the order", () => {
    const r = prepareImport(csv("name", "Alex Example", "Bea Example", "Cal Example"), []);
    expect(r).toEqual({ ok: true, names: ["Alex Example", "Bea Example", "Cal Example"], invalid: [], duplicatesInFile: 0, matchExisting: 0 });
  });
  it("accepts the header in any case, a BOM, blank lines and trims names", () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...enc("  NAME \r\n\r\n  Zoë Müller  \r\n\r\n李小龍\r\n")]);
    const r = prepareImport(bytes, []);
    expect(r.ok && r.names).toEqual(["Zoë Müller", "李小龍"]);
  });
  it("accepts quoted names with commas", () => {
    const r = prepareImport(csv("name", '"Smith, Jo"'), []);
    expect(r.ok && r.names).toEqual(["Smith, Jo"]);
  });

  it.each([
    ["no header", ["Alex Example", "Bea Example"]],
    ["a different header", ["guest", "Alex Example"]],
    ["empty file", []],
    ["header only", ["name"]],
    ["header and blank lines only", ["name", "", " "]],
  ])("refuses a file with %s", (_label, lines) => {
    expect(prepareImport(csv(...lines), []).ok).toBe(false);
  });

  it("refuses extra columns without echoing their names", () => {
    const r = prepareImport(csv("name,zzcolumn", "Alex,alex@example.invalid"), []);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toContain("2 columns");
      expect(r.error).not.toContain("zzcolumn");
    }
  });

  it("refuses unreadable input: invalid UTF-8, binary, unclosed quote", () => {
    expect(prepareImport(new Uint8Array([0x6e, 0xe9]), []).ok).toBe(false);
    expect(prepareImport(new Uint8Array([0x50, 0x4b, 0x00]), []).ok).toBe(false);
    expect(prepareImport(enc('name\n"oops'), []).ok).toBe(false);
  });

  it("enforces the row limit: the limit passes, one more is refused, blanks do not count", () => {
    const rows = (n: number) => ["name", ...Array.from({ length: n }, (_, i) => `Guest ${i}`)];
    const atLimit = prepareImport(csv(...rows(IMPORT_LIMITS.maxRows)), []);
    expect(atLimit.ok && atLimit.names.length).toBe(IMPORT_LIMITS.maxRows);
    const over = prepareImport(csv(...rows(IMPORT_LIMITS.maxRows + 1)), []);
    expect(over.ok).toBe(false);
    if (!over.ok) expect(over.error).toContain(String(IMPORT_LIMITS.maxRows));
    expect(prepareImport(csv(...rows(IMPORT_LIMITS.maxRows), "", ""), []).ok).toBe(true);
  });

  it("reports each invalid row by number with a reason, and still returns the valid rows", () => {
    const r = prepareImport(
      csv("name", "Alex Example", "=1+1", "Bea Example", "x".repeat(121), "Cal, Extra", "+44 not a name", "Dana Example"),
      [],
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.names).toEqual(["Alex Example", "Bea Example", "Dana Example"]);
      expect(r.invalid.map((i) => i.row)).toEqual([3, 5, 6, 7]);
      expect(r.invalid[0].reason).toContain("formula");
      expect(r.invalid[1].reason).toContain("120");
      expect(r.invalid[2].reason).toContain("more than one column");
    }
  });

  it("refuses email addresses, phone numbers, formula starts and control characters in the name column", () => {
    const bad = ["alex@example.invalid", "call 020 7946 0958", "+Alex", "-Alex", "=Alex", "@Alex", "Bad\u0007Name", "Al​ex", "07700 900123"];
    const lines = bad.map((b) => `"${b}"`);
    const r = prepareImport(csv("name", ...lines), []);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.names).toEqual([]);
      expect(r.invalid.length).toBe(bad.length);
    }
  });

  it("never repeats the cell text in an error message", () => {
    const r = prepareImport(csv("name", "secret@example.invalid", "=SUM(A1)"), []);
    expect(JSON.stringify(r)).not.toContain("secret@example.invalid");
    expect(JSON.stringify(r)).not.toContain("SUM(A1)");
  });

  it("counts duplicates without merging them: repeated names in the file and names already on the list", () => {
    const r = prepareImport(csv("name", "Alex Example", "alex example", "Bea Example", "Cal Example", "Cal Example", "Cal Example"), ["ALEX EXAMPLE", "Zed"]);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.names.length).toBe(6); // all kept: two real people can share a name
      expect(r.duplicatesInFile).toBe(5); // Alex x2 and Cal x3 are all in a repeated group
      expect(r.matchExisting).toBe(2); // both Alex rows match the existing guest
    }
  });
});

describe("name rules shared with the add and edit forms", () => {
  it.each(["=SUM(A1)", "+1 plus", "-Dash", "@handle", "jo@example.invalid", "Jo 020 7946 0958"])("refuses %s", (name) => {
    expect(parseGuestForm({ name }).ok).toBe(false);
  });
  it.each(["Jo-Anne", "O'Neil", "Anne-Marie Smith-Jones", "Dr. Who", "Agent 007", "Zoë", "李小龍"])("accepts %s", (name) => {
    expect(parseGuestForm({ name }).ok).toBe(true);
  });
});
