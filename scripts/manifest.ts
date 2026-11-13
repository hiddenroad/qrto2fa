import pkg from "../package.json";

export type Target = "chrome" | "firefox";

export const ICON_SIZES = [16, 32, 48, 128] as const;

const icons = Object.fromEntries(ICON_SIZES.map((size) => [String(size), `icons/${size}.png`]));

const PERMISSIONS = ["activeTab", "scripting", "clipboardWrite"];

const base = {
  manifest_version: 3,
  name: "QR to 2FA",
  version: pkg.version,
  description: "Sayfadaki QR kodu fareyle seç, içeriğini ve 2FA anahtarını tek tıkla kopyala.",
  icons,
  action: { default_title: "QR to 2FA", default_icon: icons },
};

const perTarget: Record<Target, object> = {
  chrome: {
    permissions: [...PERMISSIONS, "sidePanel"],
    side_panel: { default_path: "panel.html" },
    background: { service_worker: "background.js" },
    minimum_chrome_version: "116",
  },
  firefox: {
    permissions: PERMISSIONS,
    sidebar_action: { default_panel: "panel.html", default_title: "QR to 2FA", default_icon: icons, open_at_install: false },
    background: { scripts: ["background.js"] },
    browser_specific_settings: {
      gecko: {
        id: "qrto2fa@hiddenroad.github.io",
        strict_min_version: "142.0",
        data_collection_permissions: { required: ["none"] },
      },
    },
  },
};

export function manifestFor(target: Target): object {
  return { ...base, ...perTarget[target] };
}
