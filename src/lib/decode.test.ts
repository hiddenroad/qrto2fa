import { describe, expect, test } from "bun:test";
import { decodeScales, selectionToSource } from "./decode";

describe("selection geometry", () => {
  test("scales x and y independently and clamps to the image", () => {
    const source = selectionToSource(
      { x: 10, y: 10, width: 100, height: 10 },
      { width: 1000, height: 500 },
      { width: 1000, height: 1000 },
    );
    expect(source).toEqual({ x: 10, y: 20, width: 100, height: 20 });
  });

  test("drops the part of the selection that falls outside the image", () => {
    expect(selectionToSource({ x: -10, y: 0, width: 30, height: 20 }, { width: 100, height: 100 }, { width: 100, height: 100 })).toEqual({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
    });
    expect(selectionToSource({ x: 90, y: 0, width: 30, height: 20 }, { width: 100, height: 100 }, { width: 100, height: 100 })).toEqual({
      x: 90,
      y: 0,
      width: 10,
      height: 20,
    });
  });

  test("rejects a selection that is too small to contain a qr", () => {
    expect(selectionToSource({ x: 0, y: 0, width: 2, height: 2 }, { width: 100, height: 100 }, { width: 100, height: 100 })).toBeNull();
    expect(selectionToSource({ x: 0, y: 0, width: 10, height: 10 }, { width: 0, height: 10 }, { width: 10, height: 10 })).toBeNull();
  });

  test("upsamples a small crop and downsamples a large one", () => {
    expect(decodeScales(100, 100)).toEqual([1, 2, 3]);
    expect(decodeScales(400, 400)).toEqual([1]);
    const [factor] = decodeScales(2000, 1000);
    expect(factor).toBeDefined();
    expect(factor!).toBeLessThan(1);
    expect(decodeScales(100, 3000)).toHaveLength(1);
    expect(decodeScales(100, 3000)[0]!).toBeLessThan(1);
  });
});
