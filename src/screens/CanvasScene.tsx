import { useEffect, useRef } from "react";
import { type LineAlg, type RGBA, RasterRenderer } from "../lib/raster/RasterRenderer";

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

  const polygon = [
    { x: w * 0.07, y: h * 0.12 },
    { x: w * 0.42, y: h * 0.12 },
    { x: w * 0.18, y: h * 0.48 },
  ];
  r.fillPolygon(polygon, red);
  r.strokePolygon(polygon, black, Math.max(2, Math.round(Math.min(w, h) * 0.006)));

  const sqX = w * 0.56;
  const sqY = h * 0.18;
  const sqSize = Math.min(w, h) * 0.2;
  r.fillPolygon(
    [
      { x: sqX, y: sqY },
      { x: sqX + sqSize, y: sqY },
      { x: sqX + sqSize, y: sqY + sqSize },
      { x: sqX, y: sqY + sqSize },
    ],
    blue,
  );
  r.fillCircle(sqX + sqSize * 0.55, sqY + sqSize * 0.6, sqSize * 0.35, translucentRed);

  const polylineWidth = Math.max(4, Math.round(Math.min(w, h) * 0.015));
  const p0 = { x: w * 0.1, y: h * 0.65 };
  const p1 = { x: w * 0.28, y: h * 0.78 };
  const p2 = { x: w * 0.44, y: h * 0.6 };
  const p3 = { x: w * 0.62, y: h * 0.73 };
  r.strokeLine(p0.x, p0.y, p1.x, p1.y, cyan, polylineWidth);
  r.strokeLine(p1.x, p1.y, p2.x, p2.y, cyan, polylineWidth);
  r.strokeLine(p2.x, p2.y, p3.x, p3.y, cyan, polylineWidth);

  r.drawLine(w * 0.08, h * 0.9, w * 0.92, h * 0.84, white);
  r.drawLine(w * 0.08, h * 0.94, w * 0.92, h * 0.88, white);
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