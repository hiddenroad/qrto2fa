import { copyText } from "../lib/clipboard";
import { el } from "../lib/dom";
import { readMigration, type MigrationRead } from "../lib/migration";
import { groupSecret, looksLikeOtpAuth, needsCustomSetup, parseOtpAuth, type OtpInfo } from "../lib/otpauth";
import type { ScanError } from "../lib/types";
import { GUIDANCE } from "./guidance";

const present = (node: HTMLElement | null): node is HTMLElement => node !== null;

function copyButton(label: string, value: string, primary = false): HTMLButtonElement {
  const button = el("button", { className: primary ? "copy primary" : "copy" }, label);
  let timer = 0;
  button.addEventListener("click", () => {
    window.clearTimeout(timer);
    void copyText(value).then((ok) => {
      button.textContent = ok ? "Kopyalandı" : "Kopyalanamadı, metni elle seç";
      button.classList.toggle("done", ok);
      timer = window.setTimeout(() => {
        button.textContent = label;
        button.classList.remove("done");
      }, 1500);
    });
  });
  return button;
}

function field(label: string, value: string): HTMLElement | null {
  if (!value) return null;
  return el("div", { className: "row" }, el("span", { className: "label" }, label), el("span", { className: "value" }, value));
}

function rawBlock(text: string): HTMLElement {
  return el("div", { className: "row" }, el("pre", { className: "raw" }, text), copyButton("Metni kopyala", text));
}

function setupHint(info: OtpInfo): string {
  const base = "Authenticator uygulamasında “Kurulum anahtarı gir” seçeneğine yapıştır.";
  if (!needsCustomSetup(info)) return base;
  return `${base} Uygulamada tür ${info.type}, algoritma ${info.algorithm}, ${info.digits} hane ve ${info.period} olarak ayarla.`;
}

function metaLine(info: OtpInfo): string {
  return `${info.type} · ${info.algorithm} · ${info.digits} hane · ${info.period}`;
}

function secretFields(info: OtpInfo): HTMLElement[] {
  return [
    ...[field("Servis", info.issuer), field("Hesap", info.account)].filter(present),
    el("div", { className: "row" }, el("span", { className: "label" }, "Anahtar"), el("div", { className: "secret" }, groupSecret(info.secret))),
    copyButton("Anahtarı kopyala", info.secret, true),
    el("div", { className: "meta" }, metaLine(info)),
    el("div", { className: "hint" }, setupHint(info)),
  ];
}

function accountCard(info: OtpInfo): HTMLElement {
  return el("section", { className: "account" }, ...secretFields(info));
}

function rawDetails(text: string): HTMLElement {
  return el("details", {}, el("summary", {}, "Ham metin"), rawBlock(text));
}

function otpView(info: OtpInfo, raw: string): HTMLElement[] {
  return [el("div", { className: "status ok" }, "2FA anahtarı okundu"), ...secretFields(info), rawDetails(raw)];
}

function migrationView(result: Extract<MigrationRead, { ok: true }>, raw: string): HTMLElement[] {
  const count = result.accounts.length;
  const nodes: HTMLElement[] = [el("div", { className: "status ok" }, count === 1 ? "2FA anahtarı okundu" : `${count} hesap okundu`)];
  if (result.batchSize > 1) {
    nodes.push(el("div", { className: "note" }, `Dışa aktarma ${result.batchSize} parçalı. Bu ${result.batchIndex + 1}. parça. Kalan QR kodlarını da tara.`));
  }
  for (const account of result.accounts) nodes.push(accountCard(account));
  nodes.push(rawDetails(raw));
  return nodes;
}

function invalidOtpView(text: string): HTMLElement[] {
  return [
    el("div", { className: "status error" }, "2FA kodu ayrışmadı"),
    el("div", { className: "note" }, "Bu QR bir otpauth bağlantısı içeriyor ama anahtar okunamadı. Sitede yeni bir QR oluşturup tekrar seç."),
    rawBlock(text),
  ];
}

function invalidMigrationView(text: string): HTMLElement[] {
  return [
    el("div", { className: "status error" }, "Dışa aktarma okunamadı"),
    el("div", { className: "note" }, "Bu bir Google Authenticator dışa aktarma kodu ama hesaplar ayrışmadı. Dışa aktarmayı yeniden oluşturup tekrar tara."),
    rawBlock(text),
  ];
}

function textView(text: string): HTMLElement[] {
  return [
    el("div", { className: "status" }, "QR içeriği"),
    el("div", { className: "note" }, "Bu QR bir 2FA anahtarı içermiyor. Sitenin 2FA kurulum ekranındaki QR'ı seçtiğinden emin ol."),
    rawBlock(text),
  ];
}

export function idleView(notice?: string): HTMLElement[] {
  const items: (HTMLElement | null)[] = [
    notice ? el("div", { className: "note" }, notice) : null,
    el("div", { className: "empty" }, "Henüz okunan kod yok."),
    el("div", { className: "hint" }, "QR tara'ya bas, sonra sayfada QR kodun çevresini fareyle sürükleyerek seç."),
  ];
  return items.filter(present);
}

export function scanningView(): HTMLElement[] {
  return [
    el("div", { className: "status" }, "Seçim bekleniyor"),
    el("div", { className: "hint" }, "Sayfada QR kodun çevresini fareyle sürükleyerek seç. Vazgeçmek için İptal'e bas."),
  ];
}

export function resultView(text: string): HTMLElement[] {
  const info = parseOtpAuth(text);
  if (info) return otpView(info, text);
  const migration = readMigration(text);
  if (migration?.ok) return migrationView(migration, text);
  if (migration) return invalidMigrationView(text);
  if (looksLikeOtpAuth(text)) return invalidOtpView(text);
  return textView(text);
}

export function errorView(error: ScanError): HTMLElement[] {
  const { title, steps } = GUIDANCE[error];
  return [el("div", { className: "status error" }, title), el("ol", { className: "steps" }, ...steps.map((step) => el("li", {}, step)))];
}
