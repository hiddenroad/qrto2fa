import jsQR from "jsqr";
import type { Rect } from "./types";

const SMALL_SIDE = 240;
const MAX_SIDE = 1200;

type BarcodeHit = { rawValue?: string };

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmap) => Promise<BarcodeHit[]>;
};

type BarcodeDetectorConstructor = {
  new (options?: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?: () => Promise<string[]>;
};

type Size = { width: number; height: number };

export function selectionToSource(rect: Rect, viewport: Size, image: Size): Rect | null {
  if (viewport.width <= 0 || viewport.height <= 0 || image.width <= 0 || image.height <= 0) return null;
  if (![rect.x, rect.y, rect.width, rect.height].every(Number.isFinite)) return null;
  const scaleX = image.width / viewport.width;
  const scaleY = image.height / viewport.height;
  const left = clamp(Math.floor(rect.x * scaleX), 0, image.width);
  const top = clamp(Math.floor(rect.y * scaleY), 0, image.height);
  const right = clamp(Math.ceil((rect.x + rect.width) * scaleX), 0, image.width);
  const bottom = clamp(Math.ceil((rect.y + rect.height) * scaleY), 0, image.height);
  const width = right - left;
  const height = bottom - top;
  if (width < 4 || height < 4) return null;
  return { x: left, y: top, width, height };
}

export function decodeScales(width: number, height: number): number[] {
  const pad = quietPad(width, height);
  const paddedMax = Math.max(width, height) + pad * 2;
  const paddedMin = Math.min(width, height) + pad * 2;
  if (paddedMax > MAX_SIDE) return [MAX_SIDE / paddedMax];
  if (paddedMin < SMALL_SIDE) return [1, 2, 3];
  return [1];
}

function quietPad(width: number, height: number): number {
  return Math.round(Math.max(width, height) * 0.08) + 8;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function renderPadded(bitmap: ImageBitmap, source: Rect, factor: number): { canvas: OffscreenCanvas; image: ImageData } | null {
  const pad = quietPad(source.width, source.height);
  const destPad = Math.max(1, Math.round(pad * factor));
  const destW = Math.max(1, Math.round(source.width * factor));
  const destH = Math.max(1, Math.round(source.height * factor));
  const width = destW + destPad * 2;
  const height = destH + destPad * 2;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(bitmap, source.x, source.y, source.width, source.height, destPad, destPad, destW, destH);
  return { canvas, image: ctx.getImageData(0, 0, width, height) };
}

function detectorConstructor(): BarcodeDetectorConstructor | null {
  const ctor = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return ctor ?? null;
}

async function detectNative(canvas: OffscreenCanvas): Promise<string | null> {
  const Detector = detectorConstructor();
  if (!Detector) return null;
  let bitmap: ImageBitmap | null = null;
  try {
    const formats = await Detector.getSupportedFormats?.();
    if (formats && !formats.includes("qr_code")) return null;
    bitmap = await createImageBitmap(canvas);
    const codes = await new Detector({ formats: ["qr_code"] }).detect(bitmap);
    return codes.find((code) => code.rawValue)?.rawValue ?? null;
  } catch {
    return null;
  } finally {
    bitmap?.close();
  }
}

function bitmapSource(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const header = comma === -1 ? "" : dataUrl.slice(0, comma);
  const payload = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
  const mime = /data:([^;,]+)/.exec(header)?.[1] ?? "image/png";
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index) & 0xff;
  return new Blob([bytes], { type: mime });
}

export async function decodeQr(dataUrl: string, rect: Rect, viewportWidth: number, viewportHeight: number): Promise<string | null> {
  const bitmap = await createImageBitmap(bitmapSource(dataUrl));
  try {
    const source = selectionToSource(rect, { width: viewportWidth, height: viewportHeight }, bitmap);
    if (!source) return null;
    for (const factor of decodeScales(source.width, source.height)) {
      const rendered = renderPadded(bitmap, source, factor);
      if (!rendered) return null;
      const native = await detectNative(rendered.canvas);
      if (native) return native;
      const code = jsQR(rendered.image.data, rendered.image.width, rendered.image.height, { inversionAttempts: "attemptBoth" });
      if (code?.data) return code.data;
    }
    return null;
  } finally {
    bitmap.close();
  }
}
