import { parseGuestForm } from "@/domain/guest";

export const IMPORT_LIMITS = { maxBytes: 200 * 1024, maxRows: 500 } as const;
export const IMPORT_COLUMN = "name";

export interface InvalidRow {
  row: number; // record number in the file; the header is row 1
  reason: string;
}

export type ImportPreview =
  | { ok: false; error: string }
  | {
      ok: true;
      names: string[]; // valid names, in file order
      invalid: InvalidRow[];
      duplicatesInFile: number; // rows whose name appears more than once in the file (case-insensitive)
      matchExisting: number; // valid rows whose name equals a guest already on the list
    };

/** Decodes UTF-8 (an optional byte-order mark is removed). Anything else is refused rather than guessed at. */
export function decodeUtf8(bytes: Uint8Array): { ok: true; text: string } | { ok: false; error: string } {
  if (bytes.includes(0)) return { ok: false, error: "This does not look like a text CSV file. Save it as CSV (UTF-8) and try again." };
  try {
    const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes);
    return { ok: true, text: text.charCodeAt(0) === 0xfeff ? text.slice(1) : text };
  } catch {
    return { ok: false, error: "The file is not valid UTF-8 text. In your spreadsheet program, save it as CSV (UTF-8) and try again." };
  }
}

/** Minimal RFC 4180 reader: commas, double-quoted cells with "" escapes, CRLF, LF or CR line ends. Never evaluates anything. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let i = 0;
  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
        const next = text[i + 1];
        if (next !== undefined && next !== "," && next !== "\r" && next !== "\n") throw new Error("text after a closing quote");
      } else {
        cell += ch;
      }
    } else if (ch === '"' && cell === "") {
      quoted = true;
    } else if (ch === ",") {
      endCell();
    } else if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
      endRow();
    } else if (ch === "\n") {
      endRow();
    } else {
      cell += ch;
    }
    i++;
  }
  if (quoted) throw new Error("unterminated quote");
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}

export function checkFileDetails(file: { name: string; size: number; type: string }): string | null {
  if (!/\.csv$/i.test(file.name)) return "Choose a file ending in .csv.";
  const mime = file.type.split(";")[0].trim().toLowerCase(); // "text/csv; charset=utf-8" is fine
  if (mime && !["text/csv", "application/vnd.ms-excel", "text/plain", "application/csv"].includes(mime)) {
    return "That file type is not accepted. Choose a CSV file.";
  }
  if (file.size === 0) return "The file is empty.";
  if (file.size > IMPORT_LIMITS.maxBytes) return `The file is larger than ${IMPORT_LIMITS.maxBytes / 1024} KB. Split it into smaller files.`;
  return null;
}

/**
 * Validates a CSV of guest names. The first row must be a header with exactly one column called "name".
 * Rows that fail validation are reported by row number and reason only (the cell text is not echoed back).
 */
export function prepareImport(bytes: Uint8Array, existingNames: string[]): ImportPreview {
  const decoded = decodeUtf8(bytes);
  if (!decoded.ok) return { ok: false, error: decoded.error };
  let records: string[][];
  try {
    records = parseCsv(decoded.text);
  } catch {
    return { ok: false, error: "The file could not be read as CSV: a quoted value is not closed, or text follows a closing quote." };
  }
  if (records.length === 0) return { ok: false, error: "The file is empty." };
  const header = records[0].map((h) => h.trim().toLowerCase());
  if (header.length !== 1 || header[0] !== IMPORT_COLUMN) {
    return {
      ok: false,
      error:
        header.length > 1
          ? `The file has ${header.length} columns. This prototype accepts one column called "${IMPORT_COLUMN}" only, with no emails, phone numbers or other personal details. Remove the other columns.`
          : `The first row must be a header with the single column name "${IMPORT_COLUMN}".`,
    };
  }
  const data = records.slice(1).map((cells, i) => ({ row: i + 2, cells }));
  const nonBlank = data.filter((d) => !(d.cells.length === 1 && d.cells[0].trim() === ""));
  if (nonBlank.length === 0) return { ok: false, error: "The file has a header but no guests." };
  if (nonBlank.length > IMPORT_LIMITS.maxRows) {
    return { ok: false, error: `The file has ${nonBlank.length} rows. The limit is ${IMPORT_LIMITS.maxRows} guests per import. Split it into smaller files.` };
  }

  const names: string[] = [];
  const invalid: InvalidRow[] = [];
  for (const { row, cells } of nonBlank) {
    if (cells.length !== 1) {
      invalid.push({ row, reason: "This row has more than one column. Only a name is accepted." });
      continue;
    }
    const parsed = parseGuestForm({ name: cells[0] });
    if (parsed.ok) names.push(parsed.name);
    else invalid.push({ row, reason: parsed.error });
  }

  const key = (n: string) => n.trim().toLowerCase();
  const counts = new Map<string, number>();
  for (const n of names) counts.set(key(n), (counts.get(key(n)) ?? 0) + 1);
  const duplicatesInFile = names.filter((n) => (counts.get(key(n)) ?? 0) > 1).length;
  const existing = new Set(existingNames.map(key));
  const matchExisting = names.filter((n) => existing.has(key(n))).length;
  return { ok: true, names, invalid, duplicatesInFile, matchExisting };
}
