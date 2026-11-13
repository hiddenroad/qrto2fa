import { selectRegion } from "./content/selection";
import type { RegionPick } from "./lib/types";

let active: AbortController | null = null;

function nextPaint(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 30))));
}

async function select(): Promise<RegionPick | null> {
  active?.abort();
  const controller = new AbortController();
  active = controller;
  const rect = await selectRegion(controller.signal);
  if (active === controller) active = null;
  if (!rect) return null;
  await nextPaint();
  return { rect, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight };
}

function bind(): void {
  window.__qrTo2faCancel?.();
  window.__qrTo2faSelect = select;
  window.__qrTo2faCancel = () => active?.abort();
}

bind();
