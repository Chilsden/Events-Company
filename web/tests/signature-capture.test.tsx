// @vitest-environment jsdom
import axe from "axe-core";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContributionList } from "@/components/ContributionViews";
import { ModulesForm } from "@/components/ModulesForm";
import { SignatureCapture } from "@/components/SignatureCapture";
import { SignatureImage } from "@/components/SignatureViews";
import { MODULES } from "@/domain/modules";
import { parseSignaturePayload, type Strokes } from "@/domain/signature";
import type { ContributionView } from "@/server/contributions-repository";
import type { ModuleView } from "@/server/modules-repository";

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const eventId = "22222222-2222-4222-8222-222222222222";
const noop = async () => ({});
const noAction = async (): Promise<void> => undefined;
const STROKES: Strokes = [[[10, 10], [50, 40], [120, 20], [200, 90]]];

async function violations(html: string) {
  document.documentElement.lang = "en-GB";
  document.title = "Test page";
  document.body.innerHTML = `<main>${html}</main>`;
  const result = await axe.run(document.body, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`);
}

describe("static markup", () => {
  it("drawing step, preview step and error states have no accessibility violations", async () => {
    const linkedGuest = { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Alex Example" };
    expect(await violations(renderToStaticMarkup(<SignatureCapture action={noop} eventId={eventId} />))).toEqual([]);
    expect(await violations(renderToStaticMarkup(<SignatureCapture action={noop} eventId={eventId} initialStep="preview" />))).toEqual([]);
    expect(
      await violations(
        renderToStaticMarkup(
          <SignatureCapture action={noop} eventId={eventId} linkedGuest={linkedGuest} initialStep="preview" initialState={{ error: "Choose whether the signature may be shown. There is no default.", field: "permission" }} />,
        ),
      ),
    ).toEqual([]);
    expect(await violations(renderToStaticMarkup(<SignatureCapture action={noop} eventId={eventId} initialState={{ error: "Draw a signature first.", field: "payload" }} />))).toEqual([]);
  });

  it("signatures-only mode has no registration fields: no name, email, phone or guest choice", () => {
    document.body.innerHTML = renderToStaticMarkup(<SignatureCapture action={noop} eventId={eventId} initialStep="preview" />);
    expect(document.querySelectorAll('input[name="name"], input[type="email"], input[type="tel"], select[name="guestId"]').length).toBe(0);
    expect(document.body.textContent).not.toMatch(/email|phone|your name|RSVP/i);
  });

  it("visitors are never shown a list of guests; a link to a guest appears only when the organiser chose one, and names only that guest", () => {
    document.body.innerHTML = renderToStaticMarkup(<SignatureCapture action={noop} eventId={eventId} initialStep="preview" />);
    expect(document.querySelector("select")).toBeNull();
    expect(document.querySelector('input[name="guestId"]')).toBeNull();
    document.body.innerHTML = renderToStaticMarkup(
      <SignatureCapture action={noop} eventId={eventId} initialStep="preview" linkedGuest={{ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Alex Example" }} />,
    );
    expect(document.querySelector("select")).toBeNull();
    expect(document.querySelector<HTMLInputElement>('input[name="guestId"]')?.value).toBe("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(document.body.textContent).toContain("linked to Alex Example");
  });

  it("neither permission choice is preselected, and the wording says it is a demonstration, not consent", () => {
    document.body.innerHTML = renderToStaticMarkup(<SignatureCapture action={noop} eventId={eventId} initialStep="preview" />);
    const radios = [...document.querySelectorAll<HTMLInputElement>('input[name="permission"]')];
    expect(radios.map((r) => r.value)).toEqual(["granted", "denied"]);
    expect(radios.some((r) => r.checked || r.hasAttribute("checked"))).toBe(false);
    expect(document.body.textContent).toMatch(/Demonstration only/);
    expect(document.body.textContent).toMatch(/not real consent/);
    expect(document.querySelector("legend")?.textContent).toContain("you must choose");
  });

  it("the drawing area is keyboard reachable and labelled, with instructions linked to it", () => {
    document.body.innerHTML = renderToStaticMarkup(<SignatureCapture action={noop} eventId={eventId} />);
    const frame = document.querySelector<HTMLElement>(".pad-frame")!;
    expect(frame.getAttribute("tabindex")).toBe("0");
    expect(frame.getAttribute("aria-label")).toBe("Signature drawing area");
    expect(document.getElementById(frame.getAttribute("aria-describedby")!)?.textContent).toMatch(/Keyboard: tab to the box/);
  });

  it("modules form: built inputs are tick boxes, planned ones are plain text with no control, presets are buttons", async () => {
    const modules: ModuleView[] = MODULES.map((m) => ({ ...m, enabled: m.defaultEnabled }));
    expect(await violations(renderToStaticMarkup(<ModulesForm action={noop} eventId={eventId} modules={modules} />))).toEqual([]);
    expect([...document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')].map((c) => c.name)).toEqual(["module_guest_registration", "module_attendance", "module_signature"]);
    expect(document.querySelector('input[name="module_photograph"], input[name="module_video"], input[name="module_drawing"], input[name="module_text_message"], input[name="module_consent"]')).toBeNull();
    expect(document.body.textContent).toContain("Planned, not available yet");
    expect(document.body.textContent).toContain("Photograph capture or upload");
    expect([...document.querySelectorAll<HTMLButtonElement>('button[name="preset"]')].map((b) => b.value)).toEqual(["signatures-only", "guest-list", "guest-list-and-signatures"]);
    expect(document.querySelector<HTMLInputElement>("#module-guest_registration")!.hasAttribute("checked")).toBe(true);
    expect(document.querySelector<HTMLInputElement>("#module-signature")!.hasAttribute("checked")).toBe(false);
  });

  it("modules form shows an error with an alert role", () => {
    const modules: ModuleView[] = MODULES.map((m) => ({ ...m, enabled: false }));
    document.body.innerHTML = renderToStaticMarkup(<ModulesForm action={noop} eventId={eventId} modules={modules} initialState={{ error: "Attendance needs Guest details." }} />);
    expect(document.querySelector('[role="alert"]')?.textContent).toContain("needs");
  });

  it("contribution list: shows each signature with time, anonymity and permission, offers withdrawal only while permission is given", async () => {
    const view = (id: string, status: ContributionView["status"], linked = false): ContributionView => ({
      id,
      kind: "signature",
      createdAt: "2027-06-18T13:05:00.000Z",
      linkedToGuest: linked,
      status,
      statusChangedAt: "2027-06-18T13:06:00.000Z",
      strokes: STROKES,
    });
    const items = [view("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "granted"), view("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "revoked", true), view("cccccccc-cccc-4ccc-8ccc-cccccccccccc", "denied")];
    expect(await violations(renderToStaticMarkup(<ContributionList items={items} eventId={eventId} revokeAction={noAction} />))).toEqual([]);
    expect(document.querySelectorAll("form").length).toBe(1); // only the granted one can be withdrawn
    expect(document.querySelector("form button")?.textContent).toContain("Withdraw display permission");
    expect(document.body.textContent).toContain("Display permission withdrawn");
    expect(document.body.textContent).toContain("Display permission not given");
    expect(document.body.textContent).toContain("No (anonymous)");
    expect(document.querySelectorAll("svg.signature-image").length).toBe(3);
    expect(await violations(renderToStaticMarkup(<ContributionList items={[]} eventId={eventId} revokeAction={noAction} />))).toEqual([]);
    expect(document.body.textContent).toContain("No signatures have been collected");
  });

  it("a signature is drawn only from numbers: hostile stroke data cannot put markup on the page", () => {
    const evil = [[["<img src=x onerror=alert(1)>", 1], [2, 3]]] as unknown as Strokes;
    const html = renderToStaticMarkup(<SignatureImage strokes={evil} label="x" />);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("onerror");
    expect(html).toContain("could not be shown");
    const ok = renderToStaticMarkup(<SignatureImage strokes={STROKES} label="A signature" />);
    expect(ok).toContain("<path");
    expect(ok).not.toMatch(/<script|<image|href=|onload/i);
    expect(renderToStaticMarkup(<SignatureImage strokes={null} label="x" />)).toContain("could not be shown");
  });
});

describe("drawing in the browser (jsdom)", () => {
  let root: Root | null = null;
  let host: HTMLElement | null = null;
  afterEach(async () => {
    if (root) await act(async () => root!.unmount());
    host?.remove();
    root = null;
    host = null;
    vi.restoreAllMocks();
  });

  async function mount(props: Partial<React.ComponentProps<typeof SignatureCapture>> = {}) {
    host = document.createElement("div");
    document.body.innerHTML = "";
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root!.render(<SignatureCapture action={noop} eventId={eventId} {...props} />);
    });
    const pad = host.querySelector<SVGSVGElement>('[data-testid="pad"]')!;
    pad.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 240, right: 600, bottom: 240, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    (pad as unknown as { setPointerCapture: () => void }).setPointerCapture = () => undefined;
    (pad as unknown as { releasePointerCapture: () => void }).releasePointerCapture = () => undefined;
    return { host, pad };
  }
  const fire = async (el: Element, type: string, init: Record<string, unknown>) => {
    const ev = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(ev, { pointerId: 1, pointerType: "mouse", button: 0, ...init });
    await act(async () => {
      el.dispatchEvent(ev);
    });
  };
  const stroke = async (pad: Element, points: [number, number][], pointerType = "mouse") => {
    await fire(pad, "pointerdown", { clientX: points[0][0], clientY: points[0][1], pointerType });
    for (const [x, y] of points.slice(1)) await fire(pad, "pointermove", { clientX: x, clientY: y, pointerType });
    await fire(pad, "pointerup", { clientX: points.at(-1)![0], clientY: points.at(-1)![1], pointerType });
  };
  const button = (h: HTMLElement, text: string) => [...h.querySelectorAll("button")].find((b) => b.textContent === text) as HTMLButtonElement;
  const payload = (h: HTMLElement) => (h.querySelector('input[name="payload"]') as HTMLInputElement).value;
  const status = (h: HTMLElement) => h.querySelector('[data-testid="pad-status"]')!.textContent;

  it("starts empty with Undo, Clear and Preview disabled, and an empty payload that the server would refuse", async () => {
    const { host } = await mount();
    expect(status(host)).toBe("Nothing drawn yet.");
    for (const label of ["Undo last stroke", "Clear", "Preview signature"]) expect(button(host, label).disabled, label).toBe(true);
    expect(parseSignaturePayload(payload(host)).ok).toBe(false);
  });

  it("draws with a mouse: strokes appear, the count updates, and the payload is a valid signature", async () => {
    const { host, pad } = await mount();
    await stroke(pad, [[10, 10], [60, 50], [120, 20], [200, 90]]);
    await stroke(pad, [[220, 30], [260, 80]]);
    expect(status(host)).toBe("2 strokes drawn.");
    expect(host.querySelectorAll('[data-testid="pad"] path').length).toBe(2);
    const parsed = parseSignaturePayload(payload(host));
    expect(parsed.ok && parsed.strokes.length).toBe(2);
  });

  it("draws with touch and pen in the same way (pointer events)", async () => {
    const { host, pad } = await mount();
    await stroke(pad, [[10, 10], [60, 50], [120, 20]], "touch");
    await stroke(pad, [[130, 30], [200, 80]], "pen");
    expect(status(host)).toBe("2 strokes drawn.");
  });

  it("ignores the right mouse button, and movement when no stroke has started", async () => {
    const { host, pad } = await mount();
    await fire(pad, "pointerdown", { clientX: 10, clientY: 10, button: 2 });
    await fire(pad, "pointermove", { clientX: 50, clientY: 50 });
    expect(status(host)).toBe("Nothing drawn yet.");
  });

  it("scales pointer positions to the drawing area when the box is displayed smaller", async () => {
    const { host, pad } = await mount();
    pad.getBoundingClientRect = () => ({ left: 100, top: 50, width: 300, height: 120, right: 400, bottom: 170, x: 100, y: 50, toJSON: () => ({}) }) as DOMRect;
    await stroke(pad, [[100, 50], [250, 110], [400, 170]]); // top-left, centre, bottom-right of a half-size box
    const parsed = parseSignaturePayload(payload(host));
    expect(parsed.ok && parsed.strokes[0]).toEqual([[0, 0], [300, 120], [600, 240]]);
  });

  it("keeps points inside the drawing area even when the pointer leaves the box", async () => {
    const { host, pad } = await mount();
    await stroke(pad, [[-50, -50], [300, 120], [900, 400]]);
    const parsed = parseSignaturePayload(payload(host));
    expect(parsed.ok && parsed.strokes[0]).toEqual([[0, 0], [300, 120], [600, 240]]);
  });

  it("Undo removes the last stroke only; Clear removes everything and announces it", async () => {
    const { host, pad } = await mount();
    await stroke(pad, [[10, 10], [60, 50], [120, 20]]);
    await stroke(pad, [[130, 30], [200, 80]]);
    await act(async () => button(host, "Undo last stroke").click());
    expect(status(host)).toBe("Last stroke removed.");
    expect(host.querySelectorAll('[data-testid="pad"] path').length).toBe(1);
    await act(async () => button(host, "Clear").click());
    expect(status(host)).toBe("Signature cleared.");
    expect(host.querySelectorAll('[data-testid="pad"] path').length).toBe(0);
    expect(button(host, "Preview signature").disabled).toBe(true);
  });

  it("previews the drawing, goes back to edit it, and keeps the strokes", async () => {
    const { host, pad } = await mount();
    await stroke(pad, [[10, 10], [60, 50], [120, 20], [200, 90]]);
    await act(async () => button(host, "Preview signature").click());
    expect(host.querySelector("#preview-title")).not.toBeNull();
    expect(host.querySelector("svg.signature-image path")).not.toBeNull();
    expect(host.querySelector('[data-testid="pad"]')).toBeNull();
    expect(button(host, "Submit signature")).toBeDefined();
    await act(async () => button(host, "Back to drawing").click());
    expect(host.querySelector('[data-testid="pad"] path')).not.toBeNull();
    expect(status(host)).toBe("1 stroke drawn.");
  });

  it("a mark that is too small is explained when previewing, and the visitor stays on the drawing step", async () => {
    const { host, pad } = await mount();
    await stroke(pad, [[100, 100], [103, 101], [104, 103]]);
    await act(async () => button(host, "Preview signature").click());
    expect(status(host)).toContain("too small");
    expect(host.querySelector('[data-testid="pad"]')).not.toBeNull();
    expect(host.querySelector("#preview-title")).toBeNull();
  });

  it("keyboard alternative: Space puts the pen down, arrows draw, Space lifts it", async () => {
    const { host } = await mount();
    const frame = host.querySelector<HTMLElement>(".pad-frame")!;
    const key = async (k: string, extra: Record<string, unknown> = {}) => {
      const ev = new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...extra });
      await act(async () => {
        frame.dispatchEvent(ev);
      });
      return ev;
    };
    expect((await key(" ")).defaultPrevented).toBe(true);
    expect(status(host)).toBe("Pen down. Use the arrow keys to draw.");
    for (const k of ["ArrowRight", "ArrowRight", "ArrowDown", "ArrowDown", "ArrowRight"]) await key(k);
    await key("ArrowRight", { shiftKey: true });
    await key(" ");
    expect(status(host)).toBe("Pen up.");
    await key("ArrowLeft"); // moving with the pen up draws nothing
    const parsed = parseSignaturePayload(payload(host));
    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.strokes.length).toBe(1);
    expect(parsed.ok && parsed.strokes[0].length).toBeGreaterThanOrEqual(6);
  });

  it("limits how long a signature can get, and says so", async () => {
    const { host, pad } = await mount();
    for (let i = 0; i < 55; i++) await stroke(pad, [[10 + i, 10], [60 + i, 50], [120, 20 + (i % 100)]]);
    expect(host.querySelectorAll('[data-testid="pad"] path').length).toBeLessThanOrEqual(50);
    expect(status(host)).toContain("as long as it can be");
    expect(parseSignaturePayload(payload(host)).ok).toBe(true);
  });
});
