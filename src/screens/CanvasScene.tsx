import { useEffect, useRef } from "react";
import { type LineAlg, type RGBA, RasterRenderer } from "../lib/raster/RasterRenderer";
import { Line, Oval, Rect } from "../lib/shapes";

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

  const strokeWidth = Math.max(2, Math.round(Math.min(w, h) * 0.006));

  const rotRect = new Rect(w * 0.28, h * 0.18);
  rotRect.transform.x = w * 0.22;
  rotRect.transform.y = h * 0.25;
  rotRect.transform.rotation = Math.PI / 12;
  rotRect.fillStyle = red;
  rotRect.strokeStyle = black;
  rotRect.strokeWidth = strokeWidth;
  rotRect.drawRaster(r);

  const sqX = w * 0.56;
  const sqY = h * 0.18;
  const sqSize = Math.min(w, h) * 0.2;
  const square = new Rect(sqSize, sqSize);
  square.transform.x = sqX + sqSize / 2;
  square.transform.y = sqY + sqSize / 2;
  square.fillStyle = blue;
  square.strokeStyle = black;
  square.strokeWidth = strokeWidth;
  square.drawRaster(r);

  const circle = new Oval(sqSize * 0.35, sqSize * 0.35);
  circle.transform.x = sqX + sqSize * 0.55;
  circle.transform.y = sqY + sqSize * 0.6;
  circle.fillStyle = translucentRed;
  circle.strokeOpacity = 0;
  circle.strokeWidth = 0;
  circle.drawRaster(r);

  const polylineWidth = Math.max(4, Math.round(Math.min(w, h) * 0.015));
  const p0 = { x: w * 0.1, y: h * 0.65 };
  const p1 = { x: w * 0.28, y: h * 0.78 };
  const p2 = { x: w * 0.44, y: h * 0.6 };
  const p3 = { x: w * 0.62, y: h * 0.73 };
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

  const edge0 = new Line(w * 0.08, h * 0.9, w * 0.92, h * 0.84);
  edge0.strokeStyle = white;
  edge0.strokeWidth = 1;
  edge0.drawRaster(r);

  const edge1 = new Line(w * 0.08, h * 0.94, w * 0.92, h * 0.88);
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