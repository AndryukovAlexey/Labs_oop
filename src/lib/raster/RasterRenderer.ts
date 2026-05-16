export type RGBA = { r: number; g: number; b: number; a: number };
export type LineAlg = "bresenham" | "wu";

export function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function hexToRGBA(hex: string, alpha = 255): RGBA {
  const normalized = hex.trim();
  const valid = /^#([\da-fA-F]{3}|[\da-fA-F]{6})$/.test(normalized);
  if (!valid) {
    throw new Error(`Invalid HEX color: ${hex}`);
  }

  if (normalized.length === 4) {
    const r = parseInt(normalized[1] + normalized[1], 16);
    const g = parseInt(normalized[2] + normalized[2], 16);
    const b = parseInt(normalized[3] + normalized[3], 16);
    return { r, g, b, a: clampByte(alpha) };
  }

  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return { r, g, b, a: clampByte(alpha) };
}

export class RasterRenderer {
  private ctx: CanvasRenderingContext2D;
  private imageData: ImageData | null = null;
  private buf: Uint8ClampedArray = new Uint8ClampedArray(0);
  width = 0;
  height = 0;
  dpr = 1;
  private canvas: HTMLCanvasElement;
  private _onWindowResize: () => void;
  private lineAlg: LineAlg = "bresenham";

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("No 2D context");
    }
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
    this._onWindowResize = () => this.resize();
    window.addEventListener("resize", this._onWindowResize);
    this.resize();
  }

  dispose() {
    window.removeEventListener("resize", this._onWindowResize);
  }

  setLineAlgorithm(a: LineAlg) {
    this.lineAlg = a;
  }

  getLineAlgorithm(): LineAlg {
    return this.lineAlg;
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
    if (this.lineAlg === "wu") {
      this.drawLineWu(x0, y0, x1, y1, color);
    } else {
      this.drawLineBrassenham(x0, y0, x1, y1, color);
    }
  }

  private idx(x: number, y: number): number {
    return (y * this.width + x) * 4;
  }

  setPixel(x: number, y: number, color: RGBA) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) {
      return;
    }
    const i = this.idx(ix, iy);
    this.buf[i] = clampByte(color.r);
    this.buf[i + 1] = clampByte(color.g);
    this.buf[i + 2] = clampByte(color.b);
    this.buf[i + 3] = clampByte(color.a);
  }

  private blendPixel(x: number, y: number, color: RGBA, alphaFactor = 1) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || iy < 0 || ix >= this.width || iy >= this.height) {
      return;
    }

    const srcA = (clampByte(color.a) / 255) * Math.max(0, Math.min(1, alphaFactor));
    if (srcA <= 0) {
      return;
    }

    const srcR = clampByte(color.r) / 255;
    const srcG = clampByte(color.g) / 255;
    const srcB = clampByte(color.b) / 255;

    const i = this.idx(ix, iy);
    const dstR = this.buf[i] / 255;
    const dstG = this.buf[i + 1] / 255;
    const dstB = this.buf[i + 2] / 255;
    const dstA = this.buf[i + 3] / 255;

    const outA = srcA + dstA * (1 - srcA);
    if (outA <= 0) {
      this.buf[i] = 0;
      this.buf[i + 1] = 0;
      this.buf[i + 2] = 0;
      this.buf[i + 3] = 0;
      return;
    }

    const outR = (srcR * srcA + dstR * dstA * (1 - srcA)) / outA;
    const outG = (srcG * srcA + dstG * dstA * (1 - srcA)) / outA;
    const outB = (srcB * srcA + dstB * dstA * (1 - srcA)) / outA;

    this.buf[i] = clampByte(outR * 255);
    this.buf[i + 1] = clampByte(outG * 255);
    this.buf[i + 2] = clampByte(outB * 255);
    this.buf[i + 3] = clampByte(outA * 255);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width || this.canvas.clientWidth || 1));
    const cssH = Math.max(1, Math.round(rect.height || this.canvas.clientHeight || 1));
    this.dpr = Math.max(1, window.devicePixelRatio || 1);

    const physicalW = Math.max(1, Math.round(cssW * this.dpr));
    const physicalH = Math.max(1, Math.round(cssH * this.dpr));

    if (this.canvas.width !== physicalW) {
      this.canvas.width = physicalW;
    }
    if (this.canvas.height !== physicalH) {
      this.canvas.height = physicalH;
    }

    this.width = physicalW;
    this.height = physicalH;
    this.imageData = this.ctx.createImageData(this.width, this.height);
    this.buf = this.imageData.data;
  }

  beginFrame(clear = true) {
    if (!this.imageData) {
      this.resize();
    }
    if (clear) {
      this.buf.fill(0);
    }
  }

  commit() {
    if (!this.imageData) {
      return;
    }
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  drawLineBrassenham(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
    let xStart = Math.round(x0);
    let yStart = Math.round(y0);
    const xEnd = Math.round(x1);
    const yEnd = Math.round(y1);

    const dx = Math.abs(xEnd - xStart);
    const sx = xStart < xEnd ? 1 : -1;
    const dy = -Math.abs(yEnd - yStart);
    const sy = yStart < yEnd ? 1 : -1;
    let err = dx + dy;

    while (true) {
      this.setPixel(xStart, yStart, color);
      if (xStart === xEnd && yStart === yEnd) {
        break;
      }
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        xStart += sx;
      }
      if (e2 <= dx) {
        err += dx;
        yStart += sy;
      }
    }
  }

  drawLineWu(x0: number, y0: number, x1: number, y1: number, color: RGBA) {
    const ipart = (x: number) => Math.floor(x);
    const fpart = (x: number) => x - Math.floor(x);
    const rfpart = (x: number) => 1 - fpart(x);

    const p0x = Number.isFinite(x0) ? x0 : 0;
    const p0y = Number.isFinite(y0) ? y0 : 0;
    const p1x = Number.isFinite(x1) ? x1 : 0;
    const p1y = Number.isFinite(y1) ? y1 : 0;

    if (Math.round(p0x) === Math.round(p1x) && Math.round(p0y) === Math.round(p1y)) {
      this.setPixel(p0x, p0y, color);
      return;
    }

    let aX = p0x;
    let aY = p0y;
    let bX = p1x;
    let bY = p1y;

    const steep = Math.abs(bY - aY) > Math.abs(bX - aX);
    if (steep) {
      [aX, aY] = [aY, aX];
      [bX, bY] = [bY, bX];
    }
    if (aX > bX) {
      [aX, bX] = [bX, aX];
      [aY, bY] = [bY, aY];
    }

    const dx = bX - aX;
    const dy = bY - aY;
    const gradient = dx === 0 ? 0 : dy / dx;

    const plot = (x: number, y: number, alpha: number) => {
      if (steep) {
        this.blendPixel(y, x, color, alpha);
      } else {
        this.blendPixel(x, y, color, alpha);
      }
    };

    const xEnd1 = Math.round(aX);
    const yEnd1 = aY + gradient * (xEnd1 - aX);
    const xGap1 = rfpart(aX + 0.5);
    const xPx1 = xEnd1;
    const yPx1 = ipart(yEnd1);
    plot(xPx1, yPx1, rfpart(yEnd1) * xGap1);
    plot(xPx1, yPx1 + 1, fpart(yEnd1) * xGap1);

    let intery = yEnd1 + gradient;

    const xEnd2 = Math.round(bX);
    const yEnd2 = bY + gradient * (xEnd2 - bX);
    const xGap2 = fpart(bX + 0.5);
    const xPx2 = xEnd2;
    const yPx2 = ipart(yEnd2);

    for (let x = xPx1 + 1; x < xPx2; x++) {
      plot(x, ipart(intery), rfpart(intery));
      plot(x, ipart(intery) + 1, fpart(intery));
      intery += gradient;
    }

    plot(xPx2, yPx2, rfpart(yEnd2) * xGap2);
    plot(xPx2, yPx2 + 1, fpart(yEnd2) * xGap2);
  }

  private drawHSpan(y: number, x0: number, x1: number, color: RGBA) {
    const iy = Math.round(y);
    if (iy < 0 || iy >= this.height) {
      return;
    }

    const start = Math.max(0, Math.min(x0, x1));
    const end = Math.min(this.width - 1, Math.max(x0, x1));
    if (start > end) {
      return;
    }

    const alpha = clampByte(color.a);
    if (alpha < 255) {
      for (let x = start; x <= end; x++) {
        this.blendPixel(x, iy, color);
      }
      return;
    }

    let i = this.idx(start, iy);
    const r = clampByte(color.r);
    const g = clampByte(color.g);
    const b = clampByte(color.b);
    for (let x = start; x <= end; x++) {
      this.buf[i] = r;
      this.buf[i + 1] = g;
      this.buf[i + 2] = b;
      this.buf[i + 3] = 255;
      i += 4;
    }
  }

  fillPolygon(points: { x: number; y: number }[], color: RGBA) {
    if (points.length < 3) {
      return;
    }

    let minY = points[0].y;
    let maxY = points[0].y;
    for (let i = 1; i < points.length; i++) {
      minY = Math.min(minY, points[i].y);
      maxY = Math.max(maxY, points[i].y);
    }

    const yStart = Math.ceil(minY);
    const yEnd = Math.floor(maxY);

    for (let y = yStart; y <= yEnd; y++) {
      const scanY = y + 0.5;
      const intersections: number[] = [];

      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];

        if (p1.y === p2.y) {
          continue;
        }

        const minEdgeY = Math.min(p1.y, p2.y);
        const maxEdgeY = Math.max(p1.y, p2.y);
        if (scanY < minEdgeY || scanY >= maxEdgeY) {
          continue;
        }

        const t = (scanY - p1.y) / (p2.y - p1.y);
        const x = p1.x + t * (p2.x - p1.x);
        intersections.push(x);
      }

      intersections.sort((a, b) => a - b);
      for (let i = 0; i + 1 < intersections.length; i += 2) {
        this.drawHSpan(y, Math.ceil(intersections[i]), Math.floor(intersections[i + 1]), color);
      }
    }
  }

  fillCircle(cx: number, cy: number, radius: number, color: RGBA) {
    if (radius <= 0) {
      return;
    }

    const r2 = radius * radius;
    const yStart = Math.ceil(cy - radius);
    const yEnd = Math.floor(cy + radius);

    for (let y = yStart; y <= yEnd; y++) {
      const dy = y - cy;
      const dx = Math.sqrt(Math.max(0, r2 - dy * dy));
      const x0 = Math.ceil(cx - dx);
      const x1 = Math.floor(cx + dx);
      this.drawHSpan(y, x0, x1, color);
    }
  }

  strokeLine(x0: number, y0: number, x1: number, y1: number, color: RGBA, width = 1) {
    if (width <= 1) {
      this.drawLine(x0, y0, x1, y1, color);
      return;
    }

    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len === 0) {
      this.fillCircle(x0, y0, width / 2, color);
      return;
    }

    const half = width / 2;
    const nx = -dy / len;
    const ny = dx / len;

    const quad = [
      { x: x0 + nx * half, y: y0 + ny * half },
      { x: x0 - nx * half, y: y0 - ny * half },
      { x: x1 - nx * half, y: y1 - ny * half },
      { x: x1 + nx * half, y: y1 + ny * half },
    ];

    this.fillPolygon(quad, color);
    this.fillCircle(x0, y0, half, color);
    this.fillCircle(x1, y1, half, color);
  }

  strokePolygon(points: { x: number; y: number }[], color: RGBA, width = 1) {
    if (points.length < 2) {
      return;
    }

    if (points.length === 2) {
      const a = points[0];
      const b = points[1];
      this.strokeLine(a.x, a.y, b.x, b.y, color, width);
      return;
    }

    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      this.strokeLine(a.x, a.y, b.x, b.y, color, width);
    }

    if (width > 1) {
      const half = width / 2;
      for (const p of points) {
        this.fillCircle(p.x, p.y, half, color);
      }
    }
  }
}