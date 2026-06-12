import type { Point2D } from "../math/mat3";
import type { RasterRenderer } from "../raster/RasterRenderer";
import { Shape, type Bounds, boundsFromPoints } from "./Shape";

export class Line extends Shape {
  a: Point2D;
  b: Point2D;

  constructor(x0: number, y0: number, x1: number, y1: number) {
    super();
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    this.transform.x = cx;
    this.transform.y = cy;
    this.a = { x: x0 - cx, y: y0 - cy };
    this.b = { x: x1 - cx, y: y1 - cy };
  }

  drawRaster(r: RasterRenderer) {
    const stroke = this.getStrokeColor();
    if (!stroke || this.strokeWidth <= 0) {
      return;
    }

    const [p0, p1] = this.getDeviceEndpoints();
    r.strokeLine(p0.x, p0.y, p1.x, p1.y, stroke, this.strokeWidth);
  }

  hitTest(px: number, py: number): boolean {
    const local = this.transformPointToLocal(px, py);
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const len2 = dx * dx + dy * dy;

    let t = 0;
    if (len2 > 0) {
      t = ((local.x - this.a.x) * dx + (local.y - this.a.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
    }

    const closestX = this.a.x + dx * t;
    const closestY = this.a.y + dy * t;
    const dist = Math.hypot(local.x - closestX, local.y - closestY);
    const threshold = Math.max(1, this.strokeWidth) / 2;
    return dist <= threshold;
  }

  getBounds(): Bounds {
    return boundsFromPoints(this.getDeviceEndpoints());
  }

  getLocalBounds(): Bounds {
    return boundsFromPoints([this.a, this.b]);
  }

  clone(): Line {
    const copy = new Line(0, 0, 0, 0);
    this.cloneBaseTo(copy);
    copy.a = { ...this.a };
    copy.b = { ...this.b };
    return copy;
  }

  toJSON() {
    return {
      type: "line",
      a: { ...this.a },
      b: { ...this.b },
      ...this.serializeBase(),
    };
  }

  private getDeviceEndpoints() {
    return [
      this.transformPointToDevice(this.a.x, this.a.y),
      this.transformPointToDevice(this.b.x, this.b.y),
    ];
  }
}
