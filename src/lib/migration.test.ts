import { describe, expect, test } from "bun:test";
import { encodeBase32, readMigration } from "./migration";

function varint(value: number): number[] {
  const bytes: number[] = [];
  let rest = value;
  while (rest > 127) {
    bytes.push((rest & 0x7f) | 0x80);
    rest >>>= 7;
  }
  bytes.push(rest);
  return bytes;
}

function tag(field: number, wire: number): number[] {
  return varint((field << 3) | wire);
}

function delimited(field: number, data: number[]): number[] {
  return [...tag(field, 2), ...varint(data.length), ...data];
}

function textBytes(value: string): number[] {
  return [...new TextEncoder().encode(value)];
}

function otpMessage(
  name: string,
  secret: string,
  extra?: { algorithm?: number; digits?: number; type?: number; counter?: number; issuer?: string },
): number[] {
  const parts = [...delimited(1, textBytes(secret)), ...delimited(2, textBytes(name))];
  if (extra?.issuer) parts.push(...delimited(3, textBytes(extra.issuer)));
  if (extra?.algorithm !== undefined) parts.push(...tag(4, 0), ...varint(extra.algorithm));
  if (extra?.digits !== undefined) parts.push(...tag(5, 0), ...varint(extra.digits));
  if (extra?.type !== undefined) parts.push(...tag(6, 0), ...varint(extra.type));
  if (extra?.counter !== undefined) parts.push(...tag(7, 0), ...varint(extra.counter));
  parts.push(...delimited(15, [1, 2, 3]));
  return parts;
}

function payload(accounts: number[][], batchSize = 0, batchIndex = 0): Uint8Array {
  const parts = accounts.flatMap((account) => delimited(1, account));
  if (batchSize) parts.push(...tag(3, 0), ...varint(batchSize));
  if (batchIndex) parts.push(...tag(4, 0), ...varint(batchIndex));
  return Uint8Array.from(parts);
}

function uri(bytes: Uint8Array, encode = false): string {
  const data = Buffer.from(bytes).toString("base64");
  return `otpauth-migration://offline?data=${encode ? encodeURIComponent(data) : data}`;
}

describe("migration", () => {
  test("encodes base32 without padding", () => {
    const text = new TextEncoder();
    expect(encodeBase32(text.encode("foo"))).toBe("MZXW6");
    expect(encodeBase32(text.encode("foobar"))).toBe("MZXW6YTBOI");
  });

  test("reads accounts from a migration payload, including a plus in base64", () => {
    const bytes = payload(
      [otpMessage("ACME:ada@ex.com", "foo", { issuer: "ACME" }), otpMessage("bob", "foobar", { algorithm: 2, digits: 2, type: 1, counter: 4 })],
      2,
      1,
    );
    const raw = uri(bytes);
    expect(raw.includes("+") || raw.includes("%2B") || raw.includes("/")).toBe(true);
    const read = readMigration(raw);
    expect(read?.ok).toBe(true);
    if (!read?.ok) return;
    expect(read.batchSize).toBe(2);
    expect(read.batchIndex).toBe(1);
    expect(read.accounts.map((account) => account.secret)).toEqual(["MZXW6", "MZXW6YTBOI"]);
    expect(read.accounts[0]).toMatchObject({ issuer: "ACME", account: "ada@ex.com", type: "TOTP", algorithm: "SHA1", digits: "6" });
    expect(read.accounts[1]).toMatchObject({ account: "bob", type: "HOTP", algorithm: "SHA256", digits: "8", period: "sayaç 4" });
    expect(readMigration(uri(bytes, true))).toEqual(read);
  });

  test("returns a failed read for a migration uri that does not decode", () => {
    expect(readMigration("otpauth-migration://offline?data=%%%")?.ok).toBe(false);
    expect(readMigration("otpauth-migration://offline")).toEqual({ ok: false });
    expect(() => readMigration("otpauth-migration://offline?data=%%%")).not.toThrow();
  });

  test("ignores ordinary qr text", () => {
    expect(readMigration("otpauth://totp/Ex:ada?secret=JBSWY3DPEHPK3PXP")).toBeNull();
    expect(readMigration("hello")).toBeNull();
  });
});
