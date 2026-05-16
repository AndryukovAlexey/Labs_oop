import { useEffect, useRef } from "react";
import { type LineAlg, type RGBA, RasterRenderer } from "../lib/raster/RasterRenderer";
import { Line, Oval, Rect, Triangle, QuadraticBezier, CubicBezier, PathBezier } from "../lib/shapes";

interface CanvasSceneProps {
  lineAlg: LineAlg;
}

function drawDemoScene(r: RasterRenderer) {
  const w = r.width;
  const h = r.height;

  const red: RGBA = { r: 220, g: 50, b: 50, a: 255 };
  const black: RGBA = { r: 10, g: 10, b: 10, a: 255 };
  const blue: RGBA = { r: 40, g: 90, b: 255, a: 255 };
  const translucentRed: RGBA = { r: 255, g: 40, b: 40, a: 140 };
  const white: RGBA = { r: 240, g: 245, b: 255, a: 255 };
  const cyan: RGBA = { r: 30, g: 190, b: 220, a: 255 };
  const green: RGBA = { r: 50, g: 200, b: 100, a: 255 };
  const magenta: RGBA = { r: 255, g: 50, b: 180, a: 255 };
  const orange: RGBA = { r: 255, g: 140, b: 30, a: 255 };
  const purple: RGBA = { r: 150, g: 100, b: 255, a: 255 };
  const yellow: RGBA = { r: 255, g: 220, b: 30, a: 255 };

  const strokeWidth = Math.max(2, Math.round(Math.min(w, h) * 0.006));

  // Rect
  const rotRect = new Rect(w * 0.28, h * 0.16);
  rotRect.transform.x = w * 0.15;
  rotRect.transform.y = h * 0.12;
  rotRect.transform.rotation = Math.PI / 12;
  rotRect.fillStyle = red;
  rotRect.strokeStyle = black;
  rotRect.strokeWidth = strokeWidth;
  rotRect.drawRaster(r);

  // Square
  const sqX = w * 0.55;
  const sqY = h * 0.05;
  const sqSize = Math.min(w, h) * 0.14;
  const square = new Rect(sqSize, sqSize);
  square.transform.x = sqX + sqSize / 2;
  square.transform.y = sqY + sqSize / 2;
  square.fillStyle = blue;
  square.strokeStyle = black;
  square.strokeWidth = strokeWidth;
  square.drawRaster(r);

  // Oval
  const circle = new Oval(sqSize * 0.35, sqSize * 0.35);
  circle.transform.x = sqX + sqSize * 0.55;
  circle.transform.y = sqY + sqSize * 0.55;
  circle.fillStyle = translucentRed;
  circle.strokeOpacity = 0;
  circle.strokeWidth = 0;
  circle.drawRaster(r);

  // Triangle
  const triangle = new Triangle(
    w * 0.8,
    h * 0.02,
    w * 0.98,
    h * 0.18,
    w * 0.62,
    h * 0.18
  );
  triangle.fillStyle = green;
  triangle.strokeStyle = black;
  triangle.strokeWidth = strokeWidth;
  triangle.drawRaster(r);

  // QuadraticBezier
  const quadBezier = new QuadraticBezier(
    w * 0.05,
    h * 0.35,
    w * 0.15,
    h * 0.12,
    w * 0.25,
    h * 0.35
  );
  quadBezier.fillStyle = magenta;
  quadBezier.strokeStyle = magenta;
  quadBezier.strokeWidth = Math.max(4, Math.round(Math.min(w, h) * 0.015));
  quadBezier.drawRaster(r);

  // CubicBezier
  const cubicBezier = new CubicBezier(
    w * 0.45,
    h * 0.25,
    w * 0.55,
    h * 0.1,
    w * 0.7,
    h * 0.45,
    w * 0.8,
    h * 0.25
  );
  cubicBezier.fillStyle = yellow;
  cubicBezier.strokeStyle = yellow;
  cubicBezier.strokeWidth = Math.max(3, Math.round(Math.min(w, h) * 0.01));
  cubicBezier.drawRaster(r);

  // PathBezier with Catmull-Rom mode (closed) - сложная волнистая фигура
  const pathBezier = new PathBezier(
    [
      { x: w * 0.15, y: h * 0.35 },   // верхняя левая часть
      { x: w * 0.25, y: h * 0.25 },   // верхний выступ слева
      { x: w * 0.4, y: h * 0.32 },    // верхний переход
      { x: w * 0.55, y: h * 0.28 },   // верхняя правая часть
      { x: w * 0.65, y: h * 0.35 },   // правый выступ вверх
      { x: w * 0.68, y: h * 0.52 },   // правая часть
      { x: w * 0.58, y: h * 0.68 },   // нижняя правая часть
      { x: w * 0.42, y: h * 0.65 },   // нижний центр
      { x: w * 0.28, y: h * 0.72 },   // нижняя левая часть
      { x: w * 0.12, y: h * 0.58 },   // левая часть
    ],
    "catmull",
    true
  );
  pathBezier.fillStyle = purple;
  pathBezier.strokeStyle = purple;
  pathBezier.strokeWidth = Math.max(2, Math.round(Math.min(w, h) * 0.008));
  pathBezier.drawRaster(r);

  // Polyline
  const polylineWidth = Math.max(4, Math.round(Math.min(w, h) * 0.015));
  const p0 = { x: w * 0.5, y: h * 0.55 };
  const p1 = { x: w * 0.65, y: h * 0.65 };
  const p2 = { x: w * 0.8, y: h * 0.5 };
  const p3 = { x: w * 0.9, y: h * 0.75 };
  const segments = [
    new Line(p0.x, p0.y, p1.x, p1.y),
    new Line(p1.x, p1.y, p2.x, p2.y),
    new Line(p2.x, p2.y, p3.x, p3.y),
  ];
  for (const segment of segments) {
    segment.strokeStyle = cyan;
    segment.strokeWidth = polylineWidth;
    segment.drawRaster(r);
  }

  const edge0 = new Line(w * 0.05, h * 0.95, w * 0.95, h * 0.92);
  edge0.strokeStyle = white;
  edge0.strokeWidth = 1;
  edge0.drawRaster(r);

  const edge1 = new Line(w * 0.05, h * 0.98, w * 0.95, h * 0.96);
  edge1.strokeStyle = white;
  edge1.strokeWidth = 1;
  edge1.drawRaster(r);
}

function CanvasScene({ lineAlg }: CanvasSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setLineAlgorithm(lineAlg);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const renderer = new RasterRenderer(canvas);
    renderer.setLineAlgorithm(lineAlg);
    rendererRef.current = renderer;

    const ro = new ResizeObserver(() => {
      renderer.resize();
    });

    if (containerRef.current) {
      ro.observe(containerRef.current);
    } else {
      ro.observe(canvas);
    }

    let raf = 0;
    const frame = () => {
      const currentRenderer = rendererRef.current;
      if (currentRenderer) {
        currentRenderer.beginFrame(true);
        drawDemoScene(currentRenderer);
        currentRenderer.commit();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.dispose();
      rendererRef.current = null;
    };
  }, [lineAlg]);

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block bg-slate-950" />
    </div>
  );
}

export default CanvasScene;