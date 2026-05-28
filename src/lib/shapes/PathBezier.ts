import type { Point2D } from "../math/mat3";
import type { RasterRenderer } from "../raster/RasterRenderer";
import { Shape, type Bounds, boundsFromPoints } from "./Shape";
import { flattenCubicBezier, catmullRomToCubicBeziers, distanceToLineSegment } from "./curveUtils";

export type PathMode = "polyline" | "bezier" | "catmull";

export class PathBezier extends Shape {
  anchors: Point2D[] = [];
  mode: PathMode = "polyline";
  closed: boolean = false;
  flatness: number = 0.5;

  constructor(anchors: Point2D[] = [], mode: PathMode = "polyline", closed: boolean = false) {
    super();
    this.anchors = anchors.map((p) => ({ ...p }));
    this.mode = mode;
    this.closed = closed;

    // Вычисляем центр всех точек
    if (this.anchors.length > 0) {
      let cx = 0;
      let cy = 0;
      for (const p of this.anchors) {
        cx += p.x;
        cy += p.y;
      }
      cx /= this.anchors.length;
      cy /= this.anchors.length;

      this.transform.x = cx;
      this.transform.y = cy;

      // Переводим точки в локальную систему координат
      for (let i = 0; i < this.anchors.length; i++) {
        this.anchors[i].x -= cx;
        this.anchors[i].y -= cy;
      }
    }
  }

  drawRaster(r: RasterRenderer) {
    const points = this.getDevicePoints();
    
    const fill = this.getFillColor();
    if (fill && points.length > 2 && this.closed) {
      r.fillPolygon(points, fill);
    }

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

    const threshold = Math.max(8, this.strokeWidth + 4);

    for (let i = 0; i < devicePoints.length - 1; i++) {
      const dist = distanceToLineSegment({ x: px, y: py }, devicePoints[i], devicePoints[i + 1]);
      if (dist <= threshold) {
        return true;
      }
    }

    // Если путь замкнут, проверяем расстояние до последнего сегмента
    if (this.closed && devicePoints.length > 2) {
      const dist = distanceToLineSegment(
        { x: px, y: py },
        devicePoints[devicePoints.length - 1],
        devicePoints[0]
      );
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
    const points = this.getLocalPoints();
    return boundsFromPoints(points.length > 0 ? points : [{ x: 0, y: 0 }]);
  }

  clone(): PathBezier {
    const copy = new PathBezier(this.anchors, this.mode, this.closed);
    this.cloneBaseTo(copy);
    copy.flatness = this.flatness;
    return copy;
  }

  toJSON() {
    return {
      type: "pathBezier",
      anchors: this.anchors.map((p) => ({ ...p })),
      mode: this.mode,
      closed: this.closed,
      flatness: this.flatness,
      ...this.serializeBase(),
    };
  }

  getControlPoints(): Point2D[] {
    return this.anchors.map((p) => ({ ...p }));
  }

  setControlPoint(index: number, point: Point2D) {
    if (index >= 0 && index < this.anchors.length) {
      this.anchors[index] = { ...point };
    }
  }

  addPointLocal(point: Point2D, insertAtIndex?: number) {
    const idx = insertAtIndex ?? this.anchors.length;
    this.anchors.splice(idx, 0, { ...point });
  }

  removePoint(index: number) {
    if (index >= 0 && index < this.anchors.length) {
      this.anchors.splice(index, 1);
    }
  }

  /**
   * Получает все точки пути в локальной системе координат
   */
  private getLocalPoints(): Point2D[] {
    const points: Point2D[] = [];

    if (this.anchors.length === 0) {
      return points;
    }

    switch (this.mode) {
      case "polyline":
        return this.anchors.map((p) => ({ ...p }));

      case "bezier":
        // Интерпретируем anchors как сегменты Безье
        // Каждые 4 точки образуют один сегмент (p0, p1, p2, p3)
        for (let i = 0; i < this.anchors.length - 3; i += 3) {
          const p0 = this.anchors[i];
          const p1 = this.anchors[i + 1];
          const p2 = this.anchors[i + 2];
          const p3 = this.anchors[i + 3];

          if (i === 0) {
            points.push({ ...p0 });
          }

          const segmentPoints = flattenCubicBezier(p0, p1, p2, p3, this.flatness);
          for (const pt of segmentPoints) {
            points.push({ ...pt });
          }
        }
        break;

      case "catmull":
        // Конвертируем Catmull-Rom сплайн в Bezier сегменты
        const bezierSegments = catmullRomToCubicBeziers(this.anchors, this.closed);
        for (let i = 0; i < bezierSegments.length; i++) {
          const [p0, p1, p2, p3] = bezierSegments[i];

          if (i === 0) {
            points.push({ ...p0 });
          }

          const segmentPoints = flattenCubicBezier(p0, p1, p2, p3, this.flatness);
          for (const pt of segmentPoints) {
            points.push({ ...pt });
          }
        }
        break;
    }

    // Если путь замкнут, добавляем линию к первой точке
    if (this.closed && points.length > 0 && this.anchors.length > 0) {
      // Уже добавлено в алгоритмы выше, но убедимся
      // что последняя точка близка к первой
    }

    return points;
  }

  /**
   * Получает все точки пути в экранных координатах
   */
  private getDevicePoints(): Point2D[] {
    const localPoints = this.getLocalPoints();
    return localPoints.map((p) => this.transformPointToDevice(p.x, p.y));
  }
}
