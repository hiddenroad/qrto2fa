import type { ScanOutcome } from "../lib/types";
import { cancelScan, scan } from "./scan";
import { errorView, idleView, resultView, scanningView } from "./view";

const area = document.querySelector<HTMLElement>("#result");
const button = document.querySelector<HTMLButtonElement>("#scan");
let scanning = false;

function show(nodes: HTMLElement[]): void {
  area?.replaceChildren(...nodes);
}

function viewFor(outcome: ScanOutcome): HTMLElement[] {
  if (outcome.kind === "text") return resultView(outcome.text);
  if (outcome.kind === "cancelled") return idleView("Seçim iptal edildi.");
  return errorView(outcome.error);
}

function setScanning(value: boolean): void {
  scanning = value;
  if (!button) return;
  button.textContent = value ? "İptal" : "QR tara";
  button.classList.toggle("primary", !value);
}

async function startScan(): Promise<void> {
  setScanning(true);
  show(scanningView());
  try {
    show(viewFor(await scan()));
  } catch {
    show(errorView("capture"));
  } finally {
    setScanning(false);
  }
}

window.addEventListener("pagehide", () => {
  void cancelScan();
});

button?.addEventListener("click", () => {
  if (scanning) void cancelScan();
  else void startScan();
});

show(idleView());
