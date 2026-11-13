const BLOCKED_PROTOCOLS = new Set([
  "about:",
  "chrome:",
  "chrome-extension:",
  "chrome-untrusted:",
  "devtools:",
  "edge:",
  "edge-untrusted:",
  "moz-extension:",
  "view-source:",
]);

const BLOCKED_MESSAGE =
  /chrome:\/\/|edge:\/\/|about:|view-source:|chrome-extension:|moz-extension:|devtools:|extensions gallery|webstore|addons\.mozilla\.org|cannot be scripted|scripting is not allowed/i;

export type PageAccess = "ok" | "blocked" | "file" | "unknown";

export function pageAccess(url: string | undefined): PageAccess {
  if (!url) return "unknown";
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return BLOCKED_MESSAGE.test(url) ? "blocked" : "unknown";
  }
  if (parsed.protocol === "file:") return "file";
  if (BLOCKED_PROTOCOLS.has(parsed.protocol)) return "blocked";
  if (isStore(parsed)) return "blocked";
  return "ok";
}

export function blockedMessage(error: unknown): boolean {
  return BLOCKED_MESSAGE.test(String(error));
}

function isStore(url: URL): boolean {
  const host = url.hostname;
  if (host === "chromewebstore.google.com" || host === "addons.mozilla.org") return true;
  if (host === "chrome.google.com" && url.pathname.startsWith("/webstore")) return true;
  return host === "microsoftedge.microsoft.com" && url.pathname.startsWith("/addons");
}
