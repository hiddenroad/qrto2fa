import { deflateSync } from "node:zlib";

const PATTERN = [
  "###.#.###",
  "#.#..##.#",
  "###.#.###",
  "..#.##...",
  "#.##..#.#",
  ".#..#.##.",
  "###.#..#.",
  "#.#..###.",
  "###.#..##",
];

const BACKGROUND = [15, 23, 42];
const FINDER = [74, 222, 128];
const MODULE = [226, 232, 240];

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function encodePng(size: number, rgba: Uint8Array): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) raw.set(rgba.subarray(y * size * 4, (y + 1) * size * 4), y * (size * 4 + 1) + 1);
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", new Uint8Array()),
  ]);
}

function insideRounded(u: number, v: number, radius: number): boolean {
  const dx = Math.max(radius - u, 0, u - (1 - radius));
  const dy = Math.max(radius - v, 0, v - (1 - radius));
  return dx * dx + dy * dy <= radius * radius;
}

function isFinder(col: number, row: number): boolean {
  const corner = (c: number, r: number) => col >= c && col < c + 3 && row >= r && row < r + 3;
  return corner(0, 0) || corner(6, 0) || corner(0, 6);
}

function colorAt(u: number, v: number): number[] | null {
  if (!insideRounded(u, v, 0.2)) return null;
  const cells = PATTERN.length + 2;
  const col = Math.floor(u * cells) - 1;
  const row = Math.floor(v * cells) - 1;
  if (PATTERN[row]?.[col] !== "#") return BACKGROUND;
  return isFinder(col, row) ? FINDER : MODULE;
}

export function renderIcon(size: number): Buffer {
  const rgba = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const color = colorAt((x + 0.5) / size, (y + 0.5) / size);
      if (color) rgba.set([...color, 255], (y * size + x) * 4);
    }
  }
  return encodePng(size, rgba);
}
