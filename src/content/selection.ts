import { el } from "../lib/dom";
import type { Rect } from "../lib/types";
import { mountLayer } from "./layer";
import { selectionCss } from "./styles";

const MIN_SIDE = 8;

type Point = { x: number; y: number };

function between(a: Point, event: PointerEvent): Rect {
  const x = Math.min(a.x, event.clientX);
  const y = Math.min(a.y, event.clientY);
  return { x, y, width: Math.abs(event.clientX - a.x), height: Math.abs(event.clientY - a.y) };
}

function draw(box: HTMLElement, rect: Rect): void {
  box.hidden = false;
  box.style.left = `${rect.x}px`;
  box.style.top = `${rect.y}px`;
  box.style.width = `${rect.width}px`;
  box.style.height = `${rect.height}px`;
}

export function selectRegion(signal: AbortSignal): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (signal.aborted) return resolve(null);
    const layer = mountLayer(selectionCss);
    const box = el("div", { className: "box" });
    const hint = el("div", { className: "hint" }, "QR kodun çevresini sürükleyerek seç · İptal: Esc veya sağ tık");
    const overlay = el("div", { className: "overlay" }, box, hint);
    box.hidden = true;
    layer.root.append(overlay);
    let origin: Point | null = null;
    let settled = false;

    const finish = (result: Rect | null) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("keydown", onKey, true);
      signal.removeEventListener("abort", onAbort);
      resolve(result);
      requestAnimationFrame(() => layer.remove());
    };

    const onAbort = () => finish(null);

    const reset = () => {
      origin = null;
      box.hidden = true;
      hint.hidden = false;
      overlay.classList.remove("dragging");
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      finish(null);
    };

    const swallow = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    const surface = layer.host;

    surface.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      swallow(event);
      surface.setPointerCapture(event.pointerId);
      origin = { x: event.clientX, y: event.clientY };
      hint.hidden = true;
      overlay.classList.add("dragging");
    });

    surface.addEventListener("pointermove", (event) => {
      if (origin) draw(box, between(origin, event));
    });

    surface.addEventListener("pointerup", (event) => {
      if (event.button !== 0) return;
      swallow(event);
      if (!origin) return;
      const rect = between(origin, event);
      if (rect.width < MIN_SIDE || rect.height < MIN_SIDE) return reset();
      finish(rect);
    });

    surface.addEventListener("pointercancel", () => reset());
    surface.addEventListener("click", swallow);
    surface.addEventListener("contextmenu", (event) => {
      swallow(event);
      finish(null);
    });

    window.addEventListener("keydown", onKey, true);
    signal.addEventListener("abort", onAbort);
  });
}
