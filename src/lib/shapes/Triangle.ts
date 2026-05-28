import type { Point2D } from "../math/mat3";
import type { RasterRenderer } from "../raster/RasterRenderer";
import { Shape, type Bounds, boundsFromPoints } from "./Shape";

export class Triangle extends Shape {
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;

  constructor(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
    super();
    // Вычисляем центр треугольника
    const cx = (x0 + x1 + x2) / 3;
    const cy = (y0 + y1 + y2) / 3;

    // Устанавливаем центр как трансформацию
    this.transform.x = cx;
    this.transform.y = cy;

    // Переводим вершины в локальную систему координат
    this.p0 = { x: x0 - cx, y: y0 - cy };
    this.p1 = { x: x1 - cx, y: y1 - cy };
    this.p2 = { x: x2 - cx, y: y2 - cy };
  }

  drawRaster(r: RasterRenderer) {
    const points = this.getDeviceVertices();
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
    
    // Используем метод знаков для проверки попадания в треугольник
    const sign1 = this.sign(local, this.p0, this.p1);
    const sign2 = this.sign(local, this.p1, this.p2);
    const sign3 = this.sign(local, this.p2, this.p0);

    // Если все знаки одинаковые, точка внутри треугольника
    const allPositive = sign1 >= 0 && sign2 >= 0 && sign3 >= 0;
    const allNegative = sign1 <= 0 && sign2 <= 0 && sign3 <= 0;
    
    return allPositive || allNegative;
  }

  getBounds(): Bounds {
    return boundsFromPoints(this.getDeviceVertices());
  }

  getLocalBounds(): Bounds {
    return boundsFromPoints([this.p0, this.p1, this.p2]);
  }

  clone(): Triangle {
    const copy = new Triangle(0, 0, 0, 0, 0, 0);
    this.cloneBaseTo(copy);
    copy.p0 = { ...this.p0 };
    copy.p1 = { ...this.p1 };
    copy.p2 = { ...this.p2 };
    return copy;
  }

  toJSON() {
    return {
      type: "triangle",
      p0: { ...this.p0 },
      p1: { ...this.p1 },
      p2: { ...this.p2 },
      ...this.serializeBase(),
    };
  }

  getControlPoints(): Point2D[] {
    return [this.p0, this.p1, this.p2];
  }

  setControlPoint(index: number, point: Point2D) {
    switch (index) {
      case 0:
        this.p0 = { ...point };
        break;
      case 1:
        this.p1 = { ...point };
        break;
      case 2:
        this.p2 = { ...point };
        break;
    }
  }

  private getDeviceVertices(): Point2D[] {
    return [
      this.transformPointToDevice(this.p0.x, this.p0.y),
      this.transformPointToDevice(this.p1.x, this.p1.y),
      this.transformPointToDevice(this.p2.x, this.p2.y),
    ];
  }

  private sign(p: Point2D, a: Point2D, b: Point2D): number {
    return (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
  }
}
