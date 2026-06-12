import { describe, expect, test } from "vitest";
import { Rect } from "./Rect";
import { Line } from "./Line";
import { Oval } from "./Oval";
import { Triangle } from "./Triangle";
import { QuadraticBezier } from "./QuadraticBezier";
import { CubicBezier } from "./CubicBezier";
import { PathBezier } from "./PathBezier";

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

describe("Triangle", () => {
  test("hitTest point inside triangle", () => {
    const triangle = new Triangle(0, -50, -50, 50, 50, 50);
    expect(triangle.hitTest(0, 0)).toBe(true);
  });

  test("hitTest point outside triangle", () => {
    const triangle = new Triangle(0, -50, -50, 50, 50, 50);
    expect(triangle.hitTest(100, 100)).toBe(false);
  });

  test("bounds reflect vertices", () => {
    const triangle = new Triangle(0, 0, 100, 0, 50, 86.6);
    const b = triangle.getBounds();
    expect(b.minX).toBeCloseTo(0);
    expect(b.maxX).toBeCloseTo(100);
  });

  test("clone creates independent copy", () => {
    const triangle = new Triangle(0, 0, 100, 0, 50, 86.6);
    const originalP0 = { ...triangle.p0 };
    const copy = triangle.clone();
    copy.setControlPoint(0, { x: 10, y: 10 });
    expect(triangle.p0.x).toBeCloseTo(originalP0.x);
  });

  test("toJSON preserves type", () => {
    const triangle = new Triangle(0, 0, 100, 0, 50, 86.6);
    const json = triangle.toJSON() as any;
    expect(json.type).toBe("triangle");
  });
});

describe("QuadraticBezier", () => {
  test("evalLocal computes point on curve at t=0", () => {
    const curve = new QuadraticBezier(0, 0, 50, 100, 100, 0);
    const pt = curve.evalLocal(0);
    // After centering, p0 should be at approximately the centered point
    expect(pt.x).toBeCloseTo(curve.p0.x);
    expect(pt.y).toBeCloseTo(curve.p0.y);
  });

  test("evalLocal computes point on curve at t=1", () => {
    const curve = new QuadraticBezier(0, 0, 50, 100, 100, 0);
    const pt = curve.evalLocal(1);
    // At t=1, should be at p2
    expect(pt.x).toBeCloseTo(curve.p2.x);
    expect(pt.y).toBeCloseTo(curve.p2.y);
  });

  test("hitTest checks distance to curve", () => {
    const curve = new QuadraticBezier(0, 0, 100, 50, 200, 0);
    curve.strokeWidth = 20;
    // Center of curve should be hit
    expect(curve.hitTest(100, 30)).toBe(true);
  });

  test("toJSON preserves type", () => {
    const curve = new QuadraticBezier(0, 0, 50, 100, 100, 0);
    const json = curve.toJSON() as any;
    expect(json.type).toBe("quadraticBezier");
  });
});

describe("CubicBezier", () => {
  test("evalLocal computes point on curve at t=0", () => {
    const curve = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0);
    const pt = curve.evalLocal(0);
    // At t=0, should be at p0
    expect(pt.x).toBeCloseTo(curve.p0.x);
    expect(pt.y).toBeCloseTo(curve.p0.y);
  });

  test("evalLocal computes point on curve at t=1", () => {
    const curve = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0);
    const pt = curve.evalLocal(1);
    // At t=1, should be at p3
    expect(pt.x).toBeCloseTo(curve.p3.x);
    expect(pt.y).toBeCloseTo(curve.p3.y);
  });

  test("hitTest checks distance to curve", () => {
    const curve = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0);
    curve.strokeWidth = 20;
    // Point on or near the curve should be hit
    expect(curve.hitTest(50, 0)).toBe(true);
  });

  test("toJSON preserves type", () => {
    const curve = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0);
    const json = curve.toJSON() as any;
    expect(json.type).toBe("cubicBezier");
  });
});

describe("PathBezier", () => {
  test("polyline mode creates line segments", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      "polyline"
    );
    expect(path.anchors.length).toBe(3);
  });

  test("addPointLocal adds new anchor", () => {
    const path = new PathBezier([{ x: 0, y: 0 }], "polyline");
    path.addPointLocal({ x: 100, y: 100 });
    expect(path.anchors.length).toBe(2);
  });

  test("removePoint removes anchor", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 100 },
      ],
      "polyline"
    );
    path.removePoint(0);
    expect(path.anchors.length).toBe(1);
  });

  test("setControlPoint updates anchor", () => {
    const path = new PathBezier([{ x: 0, y: 0 }], "polyline");
    path.setControlPoint(0, { x: 50, y: 50 });
    expect(path.anchors[0].x).toBe(50);
  });

  test("toJSON preserves type and mode", () => {
    const path = new PathBezier([{ x: 0, y: 0 }], "catmull", true);
    const json = path.toJSON() as any;
    expect(json.type).toBe("pathBezier");
    expect(json.mode).toBe("catmull");
    expect(json.closed).toBe(true);
  });

  test("closed path is selectable by its interior", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      "polyline",
      true
    );
    const center = path.getCenter();
    expect(path.hitTest(center.x, center.y)).toBe(true);
  });

  test("open path is not selectable by its interior", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ],
      "polyline",
      false
    );
    const center = path.getCenter();
    expect(path.hitTest(center.x, center.y)).toBe(false);
  });

  test("closed path mode", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      "polyline",
      true
    );
    expect(path.closed).toBe(true);
  });
});
