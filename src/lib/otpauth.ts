export type OtpInfo = {
  type: string;
  issuer: string;
  account: string;
  secret: string;
  algorithm: string;
  digits: string;
  period: string;
};

export function looksLikeOtpAuth(text: string): boolean {
  return /^otpauth:\/\//i.test(text.trim());
}

export function needsCustomSetup(info: OtpInfo): boolean {
  return info.type !== "TOTP" || info.algorithm !== "SHA1" || info.digits !== "6" || info.period !== "30 sn";
}

export function normalizeSecret(secret: string): string {
  return secret.replace(/[\s=-]/g, "").toUpperCase();
}

export function groupSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret;
}

function splitLabel(path: string): { issuer: string; account: string } | null {
  let label: string;
  try {
    label = decodeURIComponent(path.replace(/^\/+/, ""));
  } catch {
    return null;
  }
  const index = label.indexOf(":");
  if (index === -1) return { issuer: "", account: label.trim() };
  return { issuer: label.slice(0, index).trim(), account: label.slice(index + 1).trim() };
}

export function parseOtpAuth(text: string): OtpInfo | null {
  const trimmed = text.trim();
  if (!looksLikeOtpAuth(trimmed)) return null;
  try {
    const url = new URL(trimmed);
    const secret = normalizeSecret(url.searchParams.get("secret") ?? "");
    if (!secret) return null;
    const label = splitLabel(url.pathname);
    if (!label) return null;
    const type = url.host.toLowerCase() || "totp";
    return {
      type: type.toUpperCase(),
      issuer: url.searchParams.get("issuer")?.trim() || label.issuer,
      account: label.account,
      secret,
      algorithm: (url.searchParams.get("algorithm") ?? "SHA1").toUpperCase(),
      digits: url.searchParams.get("digits") ?? "6",
      period: type === "hotp" ? `sayaç ${url.searchParams.get("counter") ?? "0"}` : `${url.searchParams.get("period") ?? "30"} sn`,
    };
  } catch {
    return null;
  }
}
