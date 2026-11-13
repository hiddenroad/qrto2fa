import type { OtpInfo } from "./otpauth";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const MIGRATION = /^otpauth-migration:\/\//i;

const ALGORITHMS = new Map<number, string>([
  [0, "SHA1"],
  [1, "SHA1"],
  [2, "SHA256"],
  [3, "SHA512"],
  [4, "MD5"],
]);

export type MigrationRead = { ok: true; accounts: OtpInfo[]; batchSize: number; batchIndex: number } | { ok: false };

type AccountRead = { ok: true; account: OtpInfo | null } | { ok: false };

export function encodeBase32(bytes: Uint8Array): string {
  let output = "";
  let buffer = 0;
  let bits = 0;
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += ALPHABET[(buffer >> bits) & 31];
    }
  }
  if (bits > 0) output += ALPHABET[(buffer << (5 - bits)) & 31];
  return output;
}

export function readMigration(text: string): MigrationRead | null {
  const trimmed = text.trim();
  if (!MIGRATION.test(trimmed)) return null;
  try {
    const data = queryValue(trimmed, "data");
    if (data === null) return { ok: false };
    const bytes = decodeBase64(data);
    if (!bytes) return { ok: false };
    const payload = readPayload(bytes);
    if (!payload || payload.accounts.length === 0) return { ok: false };
    return { ok: true, ...payload };
  } catch {
    return { ok: false };
  }
}

function queryValue(uri: string, name: string): string | null {
  const query = uri.split("?")[1]?.split("#")[0];
  if (!query) return null;
  for (const part of query.split("&")) {
    const eq = part.indexOf("=");
    const key = eq === -1 ? part : part.slice(0, eq);
    let decodedKey: string;
    try {
      decodedKey = decodeURIComponent(key);
    } catch {
      return null;
    }
    if (decodedKey !== name) continue;
    const raw = eq === -1 ? "" : part.slice(eq + 1);
    try {
      return decodeURIComponent(raw.replace(/\+/g, "%2B"));
    } catch {
      return null;
    }
  }
  return null;
}

function decodeBase64(input: string): Uint8Array | null {
  const cleaned = input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  if (!cleaned) return null;
  const pad = cleaned.length % 4 === 0 ? "" : "=".repeat(4 - (cleaned.length % 4));
  try {
    const binary = atob(cleaned + pad);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
  } catch {
    return null;
  }
}

class Reader {
  private offset = 0;

  constructor(private readonly data: Uint8Array) {}

  done(): boolean {
    return this.offset >= this.data.length;
  }

  varint(): bigint | null {
    let result = 0n;
    let shift = 0n;
    while (this.offset < this.data.length && shift <= 63n) {
      const byte = this.data[this.offset];
      if (byte === undefined) return null;
      this.offset += 1;
      result |= BigInt(byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) return result;
      shift += 7n;
    }
    return null;
  }

  chunk(): Uint8Array | null {
    const length = this.varint();
    if (length === null || length > BigInt(this.data.length - this.offset)) return null;
    return this.take(Number(length));
  }

  skip(length: number): boolean {
    return this.take(length) !== null;
  }

  private take(length: number): Uint8Array | null {
    if (length < 0 || this.offset + length > this.data.length) return null;
    const slice = this.data.subarray(this.offset, this.offset + length);
    this.offset += length;
    return slice;
  }
}

function readPayload(bytes: Uint8Array): { accounts: OtpInfo[]; batchSize: number; batchIndex: number } | null {
  const reader = new Reader(bytes);
  const accounts: OtpInfo[] = [];
  let batchSize = 1;
  let batchIndex = 0;
  while (!reader.done()) {
    const tag = reader.varint();
    if (tag === null) return null;
    const field = Number(tag >> 3n);
    const wire = Number(tag & 7n);
    if (wire === 0) {
      const value = reader.varint();
      if (value === null) return null;
      if (field === 3) batchSize = count(value);
      if (field === 4) batchIndex = count(value);
      continue;
    }
    if (wire === 2) {
      const chunk = reader.chunk();
      if (!chunk) return null;
      if (field !== 1) continue;
      const read = readAccount(chunk);
      if (!read.ok) return null;
      if (read.account) accounts.push(read.account);
      continue;
    }
    if (wire === 5 && reader.skip(4)) continue;
    if (wire === 1 && reader.skip(8)) continue;
    return null;
  }
  return { accounts, batchSize: Math.max(1, batchSize), batchIndex };
}

function readAccount(bytes: Uint8Array): AccountRead {
  const reader = new Reader(bytes);
  let secret: Uint8Array | null = null;
  let name = "";
  let issuer = "";
  let algorithm = 1;
  let digits = 1;
  let type = 2;
  let counter = 0;
  while (!reader.done()) {
    const tag = reader.varint();
    if (tag === null) return { ok: false };
    const field = Number(tag >> 3n);
    const wire = Number(tag & 7n);
    if (wire === 0) {
      const value = reader.varint();
      if (value === null) return { ok: false };
      const numeric = count(value);
      if (field === 4) algorithm = numeric;
      if (field === 5) digits = numeric;
      if (field === 6) type = numeric;
      if (field === 7) counter = numeric;
      continue;
    }
    if (wire === 2) {
      const chunk = reader.chunk();
      if (!chunk) return { ok: false };
      if (field === 1) secret = chunk;
      if (field === 2) name = new TextDecoder().decode(chunk);
      if (field === 3) issuer = new TextDecoder().decode(chunk);
      continue;
    }
    if (wire === 5 && reader.skip(4)) continue;
    if (wire === 1 && reader.skip(8)) continue;
    return { ok: false };
  }
  if (!secret?.byteLength) return { ok: true, account: null };
  const label = splitName(name);
  const otpType = type === 1 ? "HOTP" : "TOTP";
  return {
    ok: true,
    account: {
      type: otpType,
      issuer: issuer.trim() || label.issuer,
      account: label.account,
      secret: encodeBase32(secret),
      algorithm: ALGORITHMS.get(algorithm) ?? `#${algorithm}`,
      digits: digits === 2 ? "8" : "6",
      period: otpType === "HOTP" ? `sayaç ${counter}` : "30 sn",
    },
  };
}

function splitName(name: string): { issuer: string; account: string } {
  const index = name.indexOf(":");
  if (index === -1) return { issuer: "", account: name.trim() };
  return { issuer: name.slice(0, index).trim(), account: name.slice(index + 1).trim() };
}

function count(value: bigint): number {
  if (value < 0n || value > 100000n) return 0;
  return Number(value);
}
