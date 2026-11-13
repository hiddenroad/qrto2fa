import { describe, expect, test } from "bun:test";
import { blockedMessage, pageAccess } from "./page";

describe("page access", () => {
  test("classifies browser pages, stores and files before falling back to the error text", () => {
    expect(pageAccess("https://example.com/setup")).toBe("ok");
    expect(pageAccess("about:blank")).toBe("blocked");
    expect(pageAccess("chrome://settings")).toBe("blocked");
    expect(pageAccess("edge://newtab")).toBe("blocked");
    expect(pageAccess("https://chromewebstore.google.com/detail/x")).toBe("blocked");
    expect(pageAccess("https://chrome.google.com/webstore/category/extensions")).toBe("blocked");
    expect(pageAccess("https://addons.mozilla.org/firefox/")).toBe("blocked");
    expect(pageAccess("https://microsoftedge.microsoft.com/addons/detail/x")).toBe("blocked");
    expect(pageAccess("https://microsoftedge.microsoft.com/help")).toBe("ok");
    expect(pageAccess("file:///C:/qr.png")).toBe("file");
    expect(pageAccess(undefined)).toBe("unknown");
  });

  test("still recognizes a blocked page from the browser's error text", () => {
    expect(blockedMessage(new Error("Cannot access a chrome:// URL"))).toBe(true);
    expect(blockedMessage(new Error("Scripting is not allowed on this page"))).toBe(true);
    expect(blockedMessage(new Error("Missing host permission for the tab"))).toBe(false);
  });
});
