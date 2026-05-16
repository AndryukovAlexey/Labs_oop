import type { Point2D } from "../math/mat3";

/**
 * Вычисляет точку на квадратичной кривой Безье
 * B(t) = (1-t)^2 * p0 + 2(1-t)t * p1 + t^2 * p2
 */
export function evalQuadraticBezier(t: number, p0: Point2D, p1: Point2D, p2: Point2D): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  const w0 = mt2;
  const w1 = 2 * mt * t;
  const w2 = t2;

  return {
    x: w0 * p0.x + w1 * p1.x + w2 * p2.x,
    y: w0 * p0.y + w1 * p1.y + w2 * p2.y,
  };
}

/**
 * Вычисляет производную квадратичной кривой Безье
 * B'(t) = 2(1-t)(p1-p0) + 2t(p2-p1)
 */
export function evalQuadraticBezierDerivative(t: number, p0: Point2D, p1: Point2D, p2: Point2D): Point2D {
  const mt = 1 - t;
  const d0x = p1.x - p0.x;
  const d0y = p1.y - p0.y;
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;

  return {
    x: 2 * (mt * d0x + t * d1x),
    y: 2 * (mt * d0y + t * d1y),
  };
}

/**
 * Вычисляет точку на кубической кривой Безье
 * B(t) = (1-t)^3 * p0 + 3(1-t)^2*t * p1 + 3(1-t)*t^2 * p2 + t^3 * p3
 */
export function evalCubicBezier(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  const w0 = mt3;
  const w1 = 3 * mt2 * t;
  const w2 = 3 * mt * t2;
  const w3 = t3;

  return {
    x: w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x,
    y: w0 * p0.y + w1 * p1.y + w2 * p2.y + w3 * p3.y,
  };
}

/**
 * Вычисляет производную кубической кривой Безье
 * B'(t) = 3(1-t)^2(p1-p0) + 6(1-t)t(p2-p1) + 3t^2(p3-p2)
 */
export function evalCubicBezierDerivative(t: number, p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D): Point2D {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;

  const d0x = p1.x - p0.x;
  const d0y = p1.y - p0.y;
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p3.x - p2.x;
  const d2y = p3.y - p2.y;

  return {
    x: 3 * (mt2 * d0x + 2 * mt * t * d1x + t2 * d2x),
    y: 3 * (mt2 * d0y + 2 * mt * t * d1y + t2 * d2y),
  };
}

/**
 * Аппроксимирует квадратичную кривую Безье набором точек
 */
export function flattenQuadraticBezier(p0: Point2D, p1: Point2D, p2: Point2D, flatness = 0.5): Point2D[] {
  const points: Point2D[] = [];
  return flattenQuadraticBezierRecursive(p0, p1, p2, flatness, points, 0, 1);
}

function flattenQuadraticBezierRecursive(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  flatness: number,
  points: Point2D[],
  t0: number,
  t1: number,
  depth = 0
): Point2D[] {
  if (depth > 20) {
    // Максимальная глубина рекурсии
    points.push(p2);
    return points;
  }

  const mid = evalQuadraticBezier(0.5, p0, p1, p2);
  const chord = { x: p2.x - p0.x, y: p2.y - p0.y };
  const chordLen2 = chord.x * chord.x + chord.y * chord.y;

  if (chordLen2 < 0.0001) {
    points.push(p2);
    return points;
  }

  // Вычисляем расстояние от середины кривой до линии (chord)
  const dist = Math.abs(chord.x * (p0.y - mid.y) - chord.y * (p0.x - mid.x)) / Math.sqrt(chordLen2);

  if (dist <= flatness) {
    points.push(p2);
  } else {
    // Рекурсивно разбиваем кривую
    const tm = (t0 + t1) / 2;
    const p0m = evalQuadraticBezier(0.5, p0, p1, p2);
    flattenQuadraticBezierRecursive(p0, p1, p0m, flatness, points, t0, tm, depth + 1);
    flattenQuadraticBezierRecursive(p0m, p1, p2, flatness, points, tm, t1, depth + 1);
  }

  return points;
}

/**
 * Аппроксимирует кубическую кривую Безье набором точек
 */
export function flattenCubicBezier(p0: Point2D, p1: Point2D, p2: Point2D, p3: Point2D, flatness = 0.5): Point2D[] {
  const points: Point2D[] = [];
  points.push(p0);
  return flattenCubicBezierRecursive(p0, p1, p2, p3, flatness, points, 0, 1);
}

function flattenCubicBezierRecursive(
  p0: Point2D,
  p1: Point2D,
  p2: Point2D,
  p3: Point2D,
  flatness: number,
  points: Point2D[],
  t0: number,
  t1: number,
  depth = 0
): Point2D[] {
  if (depth > 20) {
    // Максимальная глубина рекурсии
    points.push(p3);
    return points;
  }

  const mid = evalCubicBezier(0.5, p0, p1, p2, p3);
  const chord = { x: p3.x - p0.x, y: p3.y - p0.y };
  const chordLen2 = chord.x * chord.x + chord.y * chord.y;

  if (chordLen2 < 0.0001) {
    points.push(p3);
    return points;
  }

  // Вычисляем расстояние от середины кривой до линии (chord)
  const dist = Math.abs(chord.x * (p0.y - mid.y) - chord.y * (p0.x - mid.x)) / Math.sqrt(chordLen2);

  if (dist <= flatness) {
    points.push(p3);
  } else {
    // Рекурсивно разбиваем кривую
    const tm = (t0 + t1) / 2;
    const p01 = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const p12 = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const p23 = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
    const p012 = { x: (p01.x + p12.x) / 2, y: (p01.y + p12.y) / 2 };
    const p123 = { x: (p12.x + p23.x) / 2, y: (p12.y + p23.y) / 2 };
    const p0123 = { x: (p012.x + p123.x) / 2, y: (p012.y + p123.y) / 2 };

    flattenCubicBezierRecursive(p0, p01, p012, p0123, flatness, points, t0, tm, depth + 1);
    flattenCubicBezierRecursive(p0123, p123, p23, p3, flatness, points, tm, t1, depth + 1);
  }

  return points;
}

/**
 * Конвертирует Catmull-Rom сплайн в набор кубических кривых Безье
 * Каждый сегмент между точками Pi и Pi+1 использует Pi-1 и Pi+2 как управляющие точки
 */
export function catmullRomToCubicBeziers(points: Point2D[], closed = false): Point2D[][] {
  if (points.length < 2) return [];

  const segments: Point2D[][] = [];

  for (let i = 0; i < points.length - 1; i++) {
    // Определяем соседние точки
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];

    // Если путь открыт, используем логику "без соседей" в начале/конце
    if (!closed) {
      if (i === 0) {
        // Для первого сегмента: p0 = p1 (или используем направление)
        const cp1 = { x: p1.x + (p2.x - p1.x) / 6, y: p1.y + (p2.y - p1.y) / 6 };
        const cp2 = { x: p2.x - (p2.x - p1.x) / 6, y: p2.y - (p2.y - p1.y) / 6 };
        segments.push([p1, cp1, cp2, p2]);
        continue;
      }

      if (i === points.length - 2) {
        // Для последнего сегмента
        const p0_seg = points[i - 1];
        const p1_seg = points[i];
        const p2_seg = points[i + 1];

        const cp1 = { x: p1_seg.x + (p2_seg.x - p0_seg.x) / 6, y: p1_seg.y + (p2_seg.y - p0_seg.y) / 6 };
        const cp2 = { x: p2_seg.x - (p2_seg.x - p0_seg.x) / 6, y: p2_seg.y - (p2_seg.y - p0_seg.y) / 6 };
        segments.push([p1_seg, cp1, cp2, p2_seg]);
        continue;
      }
    }

    // Стандартная формула Catmull-Rom: кубическая кривая Безье
    // Управляющие точки:
    // cp1 = p1 + (p2 - p0) / 6
    // cp2 = p2 - (p3 - p1) / 6
    const cp1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    };

    segments.push([p1, cp1, cp2, p2]);
  }

  return segments;
}

/**
 * Вычисляет расстояние от точки до линейного сегмента
 */
export function distanceToLineSegment(point: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;

  let t = 0;
  if (len2 > 1e-10) {
    t = ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
  }

  const closestX = a.x + dx * t;
  const closestY = a.y + dy * t;
  return Math.hypot(point.x - closestX, point.y - closestY);
}
