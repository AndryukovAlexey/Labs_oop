import type { Point2D } from "../math/mat3";
import type { RasterRenderer } from "../raster/RasterRenderer";
import { Shape, type Bounds, boundsFromPoints } from "./Shape";
import { evalQuadraticBezier, flattenQuadraticBezier, distanceToLineSegment } from "./curveUtils";

export class QuadraticBezier extends Shape {
  p0: Point2D;
  p1: Point2D;
  p2: Point2D;
  flatness: number = 0.5;

  constructor(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
    super();
    // Вычисляем центр
    const cx = (x0 + x1 + x2) / 3;
    const cy = (y0 + y1 + y2) / 3;

    this.transform.x = cx;
    this.transform.y = cy;

    // Переводим в локальную систему координат
    this.p0 = { x: x0 - cx, y: y0 - cy };
    this.p1 = { x: x1 - cx, y: y1 - cy };
    this.p2 = { x: x2 - cx, y: y2 - cy };
  }

  drawRaster(r: RasterRenderer) {
    const points = this.getDevicePoints();
    
    // Рисуем как заполненный путь, если есть кисть
    const fill = this.getFillColor();
    if (fill && points.length > 2) {
      // Для кривой обычно не заливают, но оставим логику
      r.fillPolygon(points, fill);
    }

    // Рисуем обводку кривой
    const stroke = this.getStrokeColor();
    if (stroke && this.strokeWidth > 0 && points.length > 1) {
      r.strokePolygon(points, stroke, this.strokeWidth);
    }
  }

  hitTest(px: number, py: number): boolean {
    const devicePoints = this.getDevicePoints();
    if (devicePoints.length < 2) {
      return false;
    }

    // Проверяем расстояние до каждого сегмента аппроксимирующей ломаной
    const threshold = Math.max(1, this.strokeWidth);

    for (let i = 0; i < devicePoints.length - 1; i++) {
      const dist = distanceToLineSegment({ x: px, y: py }, devicePoints[i], devicePoints[i + 1]);
      if (dist <= threshold) {
        return true;
      }
    }

    return false;
  }

  getBounds(): Bounds {
    return boundsFromPoints(this.getDevicePoints());
  }

  getLocalBounds(): Bounds {
    // Вычисляем границы на основе аппроксимирующих точек
    const points = flattenQuadraticBezier(this.p0, this.p1, this.p2, this.flatness);
    return boundsFromPoints([this.p0, this.p1, this.p2, ...points]);
  }

  clone(): QuadraticBezier {
    const copy = new QuadraticBezier(0, 0, 0, 0, 0, 0);
    this.cloneBaseTo(copy);
    copy.p0 = { ...this.p0 };
    copy.p1 = { ...this.p1 };
    copy.p2 = { ...this.p2 };
    copy.flatness = this.flatness;
    return copy;
  }

  toJSON() {
    return {
      type: "quadraticBezier",
      p0: { ...this.p0 },
      p1: { ...this.p1 },
      p2: { ...this.p2 },
      flatness: this.flatness,
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

  /**
   * Вычисляет точку на кривой при параметре t [0, 1]
   */
  evalLocal(t: number): Point2D {
    return evalQuadraticBezier(t, this.p0, this.p1, this.p2);
  }

  /**
   * Получает аппроксимирующие точки кривой в экранных координатах
   */
  private getDevicePoints(): Point2D[] {
    const localPoints = flattenQuadraticBezier(this.p0, this.p1, this.p2, this.flatness);
    // Добавляем начальную точку
    const result: Point2D[] = [this.transformPointToDevice(this.p0.x, this.p0.y)];
    
    for (const p of localPoints) {
      result.push(this.transformPointToDevice(p.x, p.y));
    }

    return result;
  }
}
