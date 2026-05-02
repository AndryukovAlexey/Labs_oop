import { describe, expect, test } from "vitest";
import { Rect } from "./Rect";
import { Line } from "./Line";
import { Oval } from "./Oval";

describe("Rect", () => {
  test("hitTest uses local bounds", () => {
    const rect = new Rect(80, 40);
    expect(rect.hitTest(10, -5)).toBe(true);
    expect(rect.hitTest(50, 0)).toBe(false);
  });

  test("bounds reflect translation", () => {
    const rect = new Rect(80, 40);
    rect.transform.x = 10;
    rect.transform.y = 20;
    const b = rect.getBounds();
    expect(b.minX).toBeCloseTo(-30);
    expect(b.maxX).toBeCloseTo(50);
    expect(b.minY).toBeCloseTo(0);
    expect(b.maxY).toBeCloseTo(40);
  });
});

describe("Line", () => {
  test("hitTest checks distance", () => {
    const line = new Line(0, 0, 100, 0);
    line.strokeWidth = 4;
    expect(line.hitTest(50, 2)).toBe(true);
    expect(line.hitTest(50, 20)).toBe(false);
  });

  test("bounds reflect endpoints", () => {
    const line = new Line(0, 0, 100, 0);
    const b = line.getBounds();
    expect(b.minX).toBeCloseTo(0);
    expect(b.maxX).toBeCloseTo(100);
    expect(b.minY).toBeCloseTo(0);
    expect(b.maxY).toBeCloseTo(0);
  });
});

describe("Oval", () => {
  test("hitTest uses ellipse equation", () => {
    const oval = new Oval(60, 30);
    oval.transform.x = 200;
    oval.transform.y = 100;
    expect(oval.hitTest(230, 115)).toBe(true);
    expect(oval.hitTest(320, 160)).toBe(false);
  });

  test("bounds reflect radii", () => {
    const oval = new Oval(60, 30);
    oval.transform.x = 200;
    oval.transform.y = 100;
    const b = oval.getBounds();
    expect(b.minX).toBeCloseTo(140, 6);
    expect(b.maxX).toBeCloseTo(260, 6);
    expect(b.minY).toBeCloseTo(70, 6);
    expect(b.maxY).toBeCloseTo(130, 6);
  });
});
