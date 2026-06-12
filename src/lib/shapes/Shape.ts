import { mat3, type Mat3, type Point2D } from "../math/mat3";
import type { RasterRenderer, RGBA } from "../raster/RasterRenderer";

export interface Transform {
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function boundsFromPoints(points: Point2D[]): Bounds {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return { minX, minY, maxX, maxY };
}

export abstract class Shape {
  private static nextId = 1;
  readonly id: number;
  transform: Transform;
  fillStyle: RGBA;
  fillOpacity: number;
  strokeStyle: RGBA;
  strokeWidth: number;
  strokeOpacity: number;

  constructor() {
    this.id = Shape.nextId++;
    this.transform = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 };
    this.fillStyle = { r: 200, g: 200, b: 200, a: 255 };
    this.fillOpacity = 1;
    this.strokeStyle = { r: 20, g: 20, b: 20, a: 255 };
    this.strokeWidth = 1;
    this.strokeOpacity = 1;
  }

  getLocalToDeviceMatrix(): Mat3 {
    const t = this.transform;
    return mat3.fromTransform(t.x, t.y, t.rotation, t.scaleX, t.scaleY);
  }

  getDeviceToLocalMatrix(): Mat3 {
    return mat3.invert(this.getLocalToDeviceMatrix()) ?? mat3.identity();
  }

  transformPointToDevice(px: number, py: number): Point2D {
    return mat3.transformPoint(this.getLocalToDeviceMatrix(), px, py);
  }

  transformPointToLocal(px: number, py: number): Point2D {
    return mat3.transformPoint(this.getDeviceToLocalMatrix(), px, py);
  }

  getCenter(): Point2D {
    const b = this.getBounds();
    return { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 };
  }

  resizeFromDeviceAABB(minX: number, minY: number, maxX: number, maxY: number) {
    const left = Math.min(minX, maxX);
    const right = Math.max(minX, maxX);
    const top = Math.min(minY, maxY);
    const bottom = Math.max(minY, maxY);

    const current = this.getBounds();
    const oldW = current.maxX - current.minX;
    const oldH = current.maxY - current.minY;
    const newW = right - left;
    const newH = bottom - top;

    this.transform.x = (left + right) / 2;
    this.transform.y = (top + bottom) / 2;

    if (oldW !== 0) {
      this.transform.scaleX *= newW / oldW;
    }
    if (oldH !== 0) {
      this.transform.scaleY *= newH / oldH;
    }
  }

  setBounds(minX: number, minY: number, maxX: number, maxY: number) {
    this.resizeFromDeviceAABB(minX, minY, maxX, maxY);
  }

  protected cloneBaseTo<T extends Shape>(target: T): T {
    target.transform = { ...this.transform };
    target.fillStyle = { ...this.fillStyle };
    target.fillOpacity = this.fillOpacity;
    target.strokeStyle = { ...this.strokeStyle };
    target.strokeWidth = this.strokeWidth;
    target.strokeOpacity = this.strokeOpacity;
    return target;
  }

  deserializeBase(data: any): this {
    if (typeof data.id === "number") {
      (this as { id: number }).id = data.id;
      if (data.id >= Shape.nextId) {
        Shape.nextId = data.id + 1;
      }
    }
    if (data.transform) {
      this.transform = {
        x: data.transform.x ?? 0,
        y: data.transform.y ?? 0,
        rotation: data.transform.rotation ?? 0,
        scaleX: data.transform.scaleX ?? 1,
        scaleY: data.transform.scaleY ?? 1,
      };
    }
    if (data.fillStyle) {
      this.fillStyle = { ...data.fillStyle };
    }
    if (typeof data.fillOpacity === "number") {
      this.fillOpacity = data.fillOpacity;
    }
    if (data.strokeStyle) {
      this.strokeStyle = { ...data.strokeStyle };
    }
    if (typeof data.strokeWidth === "number") {
      this.strokeWidth = data.strokeWidth;
    }
    if (typeof data.strokeOpacity === "number") {
      this.strokeOpacity = data.strokeOpacity;
    }
    return this;
  }

  protected serializeBase() {
    return {
      id: this.id,
      transform: { ...this.transform },
      fillStyle: { ...this.fillStyle },
      fillOpacity: this.fillOpacity,
      strokeStyle: { ...this.strokeStyle },
      strokeWidth: this.strokeWidth,
      strokeOpacity: this.strokeOpacity,
    };
  }

  protected getFillColor(): RGBA | null {
    return this.colorWithOpacity(this.fillStyle, this.fillOpacity);
  }

  protected getStrokeColor(): RGBA | null {
    return this.colorWithOpacity(this.strokeStyle, this.strokeOpacity);
  }

  private colorWithOpacity(color: RGBA, opacity: number): RGBA | null {
    const a = clampByte(color.a * clamp01(opacity));
    if (a <= 0) {
      return null;
    }
    return { ...color, a };
  }

  abstract clone(): Shape;
  abstract drawRaster(r: RasterRenderer): void;
  abstract hitTest(px: number, py: number): boolean;
  abstract getBounds(): Bounds;
  abstract getLocalBounds(): Bounds;
  abstract toJSON(): unknown;
}
