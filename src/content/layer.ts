import { el } from "../lib/dom";

export type Layer = { host: HTMLElement; root: ShadowRoot; remove: () => void };

function mountParent(): HTMLElement {
  if (document.fullscreenElement instanceof HTMLElement) return document.fullscreenElement;
  let dialogs: HTMLDialogElement[] = [];
  try {
    dialogs = [...document.querySelectorAll("dialog")].filter((dialog) => dialog.matches(":modal"));
  } catch {
    return document.documentElement;
  }
  for (let index = dialogs.length - 1; index >= 0; index -= 1) {
    const dialog = dialogs[index];
    if (dialog && !dialog.inert) return dialog;
  }
  return dialogs.at(-1) ?? document.documentElement;
}

const HOST_STYLE = [
  "display:block",
  "position:fixed",
  "inset:0",
  "width:100%",
  "height:100%",
  "margin:0",
  "padding:0",
  "border:0",
  "background:transparent",
  "overflow:visible",
  "pointer-events:auto",
  "max-width:none",
  "max-height:none",
  "z-index:2147483647",
].join(";");

function openTopLayer(host: HTMLElement): void {
  try {
    host.popover = "manual";
    host.showPopover();
  } catch {
    host.removeAttribute("popover");
  }
}

export function mountLayer(css: string): Layer {
  const host = document.createElement("qr-to-2fa");
  host.style.cssText = HOST_STYLE;
  host.setAttribute("role", "dialog");
  host.setAttribute("aria-modal", "true");
  host.setAttribute("aria-label", "QR alanı seç");
  const root = host.attachShadow({ mode: "closed" });
  root.append(el("style", {}, css));
  mountParent().append(host);
  openTopLayer(host);
  return {
    host,
    root,
    remove: () => {
      try {
        if (host.matches(":popover-open")) host.hidePopover();
      } catch {
        host.removeAttribute("popover");
      }
      host.remove();
    },
  };
}
