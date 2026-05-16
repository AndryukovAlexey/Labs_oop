import type { RasterRenderer } from "../raster/RasterRenderer";
import { Shape, type Bounds, boundsFromPoints } from "./Shape";

export class Rect extends Shape {
  w: number;
  h: number;

  constructor(w: number, h: number) {
    super();
    this.w = w;
    this.h = h;
  }

  drawRaster(r: RasterRenderer) {
    const points = this.getDeviceCorners();
    const fill = this.getFillColor();
    if (fill) {
      r.fillPolygon(points, fill);
    }

    const stroke = this.getStrokeColor();
    if (stroke && this.strokeWidth > 0) {
      r.strokePolygon(points, stroke, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const local = this.transformPointToLocal(px, py);
    const hw = Math.abs(this.w) / 2;
    const hh = Math.abs(this.h) / 2;
    return local.x >= -hw && local.x <= hw && local.y >= -hh && local.y <= hh;
  }

  getBounds(): Bounds {
    return boundsFromPoints(this.getDeviceCorners());
  }

  getLocalBounds(): Bounds {
    const hw = Math.abs(this.w) / 2;
    const hh = Math.abs(this.h) / 2;
    return { minX: -hw, minY: -hh, maxX: hw, maxY: hh };
  }

  clone(): Rect {
    const copy = new Rect(this.w, this.h);
    return this.cloneBaseTo(copy);
  }

  toJSON() {
    return { type: "rect", w: this.w, h: this.h, ...this.serializeBase() };
  }

  private getDeviceCorners() {
    const hw = Math.abs(this.w) / 2;
    const hh = Math.abs(this.h) / 2;
    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];
    return corners.map((p) => this.transformPointToDevice(p.x, p.y));
  }
}
