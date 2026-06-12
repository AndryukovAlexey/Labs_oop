import { describe, expect, test } from "vitest";
import { Rect } from "./Rect";
import { Line } from "./Line";
import { Oval } from "./Oval";
import { Triangle } from "./Triangle";
import { QuadraticBezier } from "./QuadraticBezier";
import { CubicBezier } from "./CubicBezier";
import { PathBezier } from "./PathBezier";
import { shapeFromJSON } from "./shapeFromJSON";
import type { Shape } from "./Shape";

function roundTrip(shape: Shape): Shape {
  const json = JSON.parse(JSON.stringify(shape.toJSON()));
  const restored = shapeFromJSON(json);
  expect(restored).not.toBeNull();
  return restored as Shape;
}

function expectBaseEqual(a: Shape, b: Shape) {
  expect(b.id).toBe(a.id);
  expect(b.transform).toEqual(a.transform);
  expect(b.fillStyle).toEqual(a.fillStyle);
  expect(b.fillOpacity).toBe(a.fillOpacity);
  expect(b.strokeStyle).toEqual(a.strokeStyle);
  expect(b.strokeWidth).toBe(a.strokeWidth);
  expect(b.strokeOpacity).toBe(a.strokeOpacity);
}

describe("shapeFromJSON round-trip", () => {
  test("rect preserves all parameters", () => {
    const rect = new Rect(120, 60);
    rect.transform = { x: 30, y: 40, rotation: 0.5, scaleX: 1.5, scaleY: 2 };
    rect.fillStyle = { r: 10, g: 20, b: 30, a: 200 };
    rect.fillOpacity = 0.8;
    rect.strokeStyle = { r: 1, g: 2, b: 3, a: 255 };
    rect.strokeWidth = 4;
    rect.strokeOpacity = 0.5;

    const restored = roundTrip(rect) as Rect;
    expect(restored).toBeInstanceOf(Rect);
    expect(restored.w).toBe(120);
    expect(restored.h).toBe(60);
    expectBaseEqual(rect, restored);
  });

  test("line preserves endpoints", () => {
    const line = new Line(10, 20, 110, 220);
    line.strokeWidth = 3;
    const restored = roundTrip(line) as Line;
    expect(restored).toBeInstanceOf(Line);
    expect(restored.a).toEqual(line.a);
    expect(restored.b).toEqual(line.b);
    expectBaseEqual(line, restored);
  });

  test("oval preserves radii", () => {
    const oval = new Oval(70, 35);
    oval.transform.x = 200;
    oval.transform.y = 150;
    const restored = roundTrip(oval) as Oval;
    expect(restored).toBeInstanceOf(Oval);
    expect(restored.rx).toBe(70);
    expect(restored.ry).toBe(35);
    expectBaseEqual(oval, restored);
  });

  test("triangle preserves vertices", () => {
    const tri = new Triangle(0, -50, -50, 50, 50, 50);
    const restored = roundTrip(tri) as Triangle;
    expect(restored).toBeInstanceOf(Triangle);
    expect(restored.p0).toEqual(tri.p0);
    expect(restored.p1).toEqual(tri.p1);
    expect(restored.p2).toEqual(tri.p2);
    expectBaseEqual(tri, restored);
  });

  test("quadratic bezier preserves control points", () => {
    const curve = new QuadraticBezier(0, 0, 50, 100, 100, 0);
    curve.flatness = 0.25;
    const restored = roundTrip(curve) as QuadraticBezier;
    expect(restored).toBeInstanceOf(QuadraticBezier);
    expect(restored.p0).toEqual(curve.p0);
    expect(restored.p1).toEqual(curve.p1);
    expect(restored.p2).toEqual(curve.p2);
    expect(restored.flatness).toBe(0.25);
    expectBaseEqual(curve, restored);
  });

  test("cubic bezier preserves control points", () => {
    const curve = new CubicBezier(0, 0, 30, 100, 70, -100, 100, 0);
    const restored = roundTrip(curve) as CubicBezier;
    expect(restored).toBeInstanceOf(CubicBezier);
    expect(restored.p0).toEqual(curve.p0);
    expect(restored.p1).toEqual(curve.p1);
    expect(restored.p2).toEqual(curve.p2);
    expect(restored.p3).toEqual(curve.p3);
    expectBaseEqual(curve, restored);
  });

  test("path preserves anchors, mode and closed", () => {
    const path = new PathBezier(
      [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
      ],
      "catmull",
      true
    );
    const restored = roundTrip(path) as PathBezier;
    expect(restored).toBeInstanceOf(PathBezier);
    expect(restored.anchors).toEqual(path.anchors);
    expect(restored.mode).toBe("catmull");
    expect(restored.closed).toBe(true);
    expectBaseEqual(path, restored);
  });

  test("canonical type aliases are accepted", () => {
    expect(shapeFromJSON({ type: "cubic", p0: {}, p1: {}, p2: {}, p3: {} })).toBeInstanceOf(
      CubicBezier
    );
    expect(shapeFromJSON({ type: "quad", p0: {}, p1: {}, p2: {} })).toBeInstanceOf(
      QuadraticBezier
    );
    expect(shapeFromJSON({ type: "path", anchors: [] })).toBeInstanceOf(PathBezier);
  });

  test("unknown type returns null", () => {
    expect(shapeFromJSON({ type: "weird" })).toBeNull();
    expect(shapeFromJSON(null)).toBeNull();
    expect(shapeFromJSON({})).toBeNull();
  });
});
