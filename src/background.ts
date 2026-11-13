import { api } from "./lib/api";

type SidebarBrowser = { sidebarAction?: { open: () => Promise<void> } };

const firefox = (globalThis as { browser?: SidebarBrowser }).browser;

function report(error: unknown): void {
  console.error(error);
}

api.action.onClicked.addListener((tab) => {
  if (firefox?.sidebarAction) {
    void firefox.sidebarAction.open().catch(report);
    return;
  }
  void api.sidePanel.open({ windowId: tab.windowId }).catch(report);
});
