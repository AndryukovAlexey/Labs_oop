import type { Point2D } from "../math/mat3";
import { Shape } from "./Shape";
import { Rect } from "./Rect";
import { Line } from "./Line";
import { Oval } from "./Oval";
import { Triangle } from "./Triangle";
import { QuadraticBezier } from "./QuadraticBezier";
import { CubicBezier } from "./CubicBezier";
import { PathBezier, type PathMode } from "./PathBezier";

const point = (p: any): Point2D => ({ x: p?.x ?? 0, y: p?.y ?? 0 });

export function shapeFromJSON(data: any): Shape | null {
  if (!data || typeof data.type !== "string") {
    return null;
  }

  switch (data.type) {
    case "rect": {
      const rect = new Rect(data.w ?? 0, data.h ?? 0);
      return rect.deserializeBase(data);
    }

    case "line": {
      const line = new Line(0, 0, 0, 0);
      line.a = point(data.a);
      line.b = point(data.b);
      return line.deserializeBase(data);
    }

    case "oval": {
      const oval = new Oval(data.rx ?? 0, data.ry ?? 0);
      return oval.deserializeBase(data);
    }

    case "triangle": {
      const triangle = new Triangle(0, 0, 0, 0, 0, 0);
      triangle.p0 = point(data.p0);
      triangle.p1 = point(data.p1);
      triangle.p2 = point(data.p2);
      return triangle.deserializeBase(data);
    }

    case "quad":
    case "quadraticBezier": {
      const curve = new QuadraticBezier(0, 0, 0, 0, 0, 0);
      curve.p0 = point(data.p0);
      curve.p1 = point(data.p1);
      curve.p2 = point(data.p2);
      if (typeof data.flatness === "number") curve.flatness = data.flatness;
      return curve.deserializeBase(data);
    }

    case "cubic":
    case "cubicBezier": {
      const curve = new CubicBezier(0, 0, 0, 0, 0, 0, 0, 0);
      curve.p0 = point(data.p0);
      curve.p1 = point(data.p1);
      curve.p2 = point(data.p2);
      curve.p3 = point(data.p3);
      if (typeof data.flatness === "number") curve.flatness = data.flatness;
      return curve.deserializeBase(data);
    }

    case "path":
    case "pathBezier": {
      const path = new PathBezier([], (data.mode as PathMode) ?? "polyline", !!data.closed);
      path.anchors = Array.isArray(data.anchors) ? data.anchors.map(point) : [];
      if (typeof data.flatness === "number") path.flatness = data.flatness;
      return path.deserializeBase(data);
    }

    default:
      return null;
  }
}
