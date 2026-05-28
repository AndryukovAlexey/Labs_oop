import type { RasterRenderer } from "../raster/RasterRenderer";
import { Shape, type Bounds, boundsFromPoints } from "./Shape";

export class Oval extends Shape {
  rx: number;
  ry: number;

  constructor(rx: number, ry: number) {
    super();
    this.rx = rx;
    this.ry = ry;
  }

  drawRaster(r: RasterRenderer) {
    const points = this.getDevicePoints();
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
    const rx = Math.abs(this.rx);
    const ry = Math.abs(this.ry);
    if (rx === 0 || ry === 0) {
      return false;
    }

    // Add margin for easier selection
    const marginX = Math.max(4, rx * 0.1);
    const marginY = Math.max(4, ry * 0.1);
    const nx = local.x / (rx + marginX);
    const ny = local.y / (ry + marginY);
    return nx * nx + ny * ny <= 1;
  }

  getBounds(): Bounds {
    return boundsFromPoints(this.getDevicePoints());
  }

  getLocalBounds(): Bounds {
    const rx = Math.abs(this.rx);
    const ry = Math.abs(this.ry);
    return { minX: -rx, minY: -ry, maxX: rx, maxY: ry };
  }

  clone(): Oval {
    const copy = new Oval(this.rx, this.ry);
    return this.cloneBaseTo(copy);
  }

  toJSON() {
    return { type: "oval", rx: this.rx, ry: this.ry, ...this.serializeBase() };
  }

  private getDevicePoints(segments = 64) {
    const rx = Math.abs(this.rx);
    const ry = Math.abs(this.ry);
    const points = [] as { x: number; y: number }[];
    if (rx === 0 || ry === 0) {
      points.push(this.transformPointToDevice(0, 0));
      return points;
    }

    for (let i = 0; i < segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = rx * Math.cos(t);
      const y = ry * Math.sin(t);
      points.push(this.transformPointToDevice(x, y));
    }

    return points;
  }
}
