import { describe, expect, test } from "bun:test";
import { groupSecret, looksLikeOtpAuth, needsCustomSetup, normalizeSecret, parseOtpAuth } from "./otpauth";

describe("otpauth", () => {
  test("parses a non-default totp uri", () => {
    const info = parseOtpAuth(
      "otpauth://totp/ACME:ada@ex.com?secret=jbsw-y3dp%20ehpk3pxp=&issuer=ACME&algorithm=sha256&digits=8&period=60",
    );
    expect(info).toEqual({
      type: "TOTP",
      issuer: "ACME",
      account: "ada@ex.com",
      secret: "JBSWY3DPEHPK3PXP",
      algorithm: "SHA256",
      digits: "8",
      period: "60 sn",
    });
    expect(info && needsCustomSetup(info)).toBe(true);
  });

  test("parses hotp and groups the secret", () => {
    const info = parseOtpAuth("otpauth://hotp/Only?secret=mfrgg===&counter=7");
    expect(info?.type).toBe("HOTP");
    expect(info?.secret).toBe("MFRGG");
    expect(info?.period).toBe("sayaç 7");
    expect(info && needsCustomSetup(info)).toBe(true);
    expect(groupSecret("MFRGG")).toBe("MFRG G");
  });

  test("treats a standard totp as the authenticator default", () => {
    const info = parseOtpAuth("otpauth://totp/Ex:ada?secret=JBSWY3DPEHPK3PXP");
    expect(info && needsCustomSetup(info)).toBe(false);
  });

  test("returns null instead of throwing when the label is not valid percent-encoding", () => {
    const text = "otpauth://totp/100%?secret=JBSWY3DPEHPK3PXP";
    expect(() => parseOtpAuth(text)).not.toThrow();
    expect(parseOtpAuth(text)).toBeNull();
    expect(looksLikeOtpAuth(text)).toBe(true);
  });

  test("rejects an otpauth uri with an empty secret", () => {
    expect(parseOtpAuth("otpauth://totp/Label?secret=")).toBeNull();
    expect(parseOtpAuth("otpauth://totp/Label?secret=%3D")).toBeNull();
  });

  test("does not treat a migration uri as otpauth", () => {
    expect(looksLikeOtpAuth("otpauth-migration://offline?data=abc")).toBe(false);
    expect(parseOtpAuth("otpauth-migration://offline?data=abc")).toBeNull();
  });

  test("normalizes spaces, hyphens and padding", () => {
    expect(normalizeSecret(" ab-cd = ")).toBe("ABCD");
  });
});
