import { api } from "../lib/api";
import { decodeQr } from "../lib/decode";
import { blockedMessage, pageAccess } from "../lib/page";
import type { RegionPick, ScanError, ScanOutcome } from "../lib/types";

class ScanFailure extends Error {
  constructor(readonly code: ScanError) {
    super(code);
  }
}

let scanningTabId: number | null = null;
let cancelRequested = false;

function stopRequested(): boolean {
  return cancelRequested;
}

async function inject(tabId: number): Promise<void> {
  await api.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
}

async function pickRegion(tabId: number): Promise<RegionPick | null> {
  const [frame] = await api.scripting.executeScript({
    target: { tabId },
    func: () => window.__qrTo2faSelect?.() ?? null,
  });
  return (frame?.result as RegionPick | null | undefined) ?? null;
}

async function release(tabId: number): Promise<void> {
  await api.scripting.executeScript({ target: { tabId }, func: () => window.__qrTo2faCancel?.() }).catch(() => undefined);
}

async function stillVisible(tabId: number, windowId: number): Promise<boolean> {
  const [current] = await api.tabs.query({ active: true, windowId });
  return current?.id === tabId;
}

async function captureText(windowId: number, pick: RegionPick): Promise<string | null> {
  const dataUrl = await api.tabs.captureVisibleTab(windowId, { format: "png" });
  return decodeQr(dataUrl, pick.rect, pick.viewportWidth, pick.viewportHeight);
}

function failureCode(error: unknown, url: string | undefined): ScanError {
  if (blockedMessage(error) || pageAccess(url) === "blocked") return "blocked";
  if (pageAccess(url) === "file") return "file";
  return "permission";
}

async function run(): Promise<ScanOutcome> {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (stopRequested()) return { kind: "cancelled" };
  if (tab?.id === undefined || tab.windowId === undefined) throw new ScanFailure("noTab");
  if (pageAccess(tab.url) === "blocked") throw new ScanFailure("blocked");
  scanningTabId = tab.id;
  try {
    await inject(tab.id);
  } catch (error) {
    throw new ScanFailure(failureCode(error, tab.url));
  }
  if (stopRequested()) {
    await release(tab.id);
    return { kind: "cancelled" };
  }
  let pick: RegionPick | null;
  try {
    pick = await pickRegion(tab.id);
  } catch {
    throw new ScanFailure("interrupted");
  }
  if (stopRequested() || !pick) return { kind: "cancelled" };
  let visible = false;
  try {
    visible = await stillVisible(tab.id, tab.windowId);
  } catch {
    throw new ScanFailure("interrupted");
  }
  if (!visible || stopRequested()) throw new ScanFailure("interrupted");
  try {
    const text = await captureText(tab.windowId, pick);
    if (stopRequested()) return { kind: "cancelled" };
    return text ? { kind: "text", text } : { kind: "error", error: "notFound" };
  } catch (error) {
    if (error instanceof ScanFailure) throw error;
    throw new ScanFailure("capture");
  }
}

export async function scan(): Promise<ScanOutcome> {
  cancelRequested = false;
  try {
    return await run();
  } catch (error) {
    if (stopRequested()) return { kind: "cancelled" };
    return { kind: "error", error: error instanceof ScanFailure ? error.code : "capture" };
  } finally {
    scanningTabId = null;
  }
}

export async function cancelScan(): Promise<void> {
  cancelRequested = true;
  const tabId = scanningTabId;
  if (tabId === null) return;
  await release(tabId);
}
