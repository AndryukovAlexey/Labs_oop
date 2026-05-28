import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { type LineAlg, type RGBA, RasterRenderer } from "../lib/raster/RasterRenderer";
import { Shape, Rect, Oval, PathBezier } from "../lib/shapes";

interface CanvasSceneProps {
  lineAlg: LineAlg;
}

export interface CanvasSceneRef {
  getState: () => EditorState;
  selectLayer: (id: number) => void;
  moveLayerUp: (id: number) => void;
  moveLayerDown: (id: number) => void;
  deleteLayer: (id: number) => void;
  duplicateLayer: (id: number) => void;
}

type InteractionMode = "idle" | "move" | "resize" | "rotate" | "edit_point";

interface EditorState {
  objects: Shape[];
  selectedId: number | null;
  hoveredId: number | null;
  mode: InteractionMode;
  mouseX: number;
  mouseY: number;
  startMouseX: number;
  startMouseY: number;
  startState: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  } | null;
  dragHandle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w" | "rotate" | null;
  editPointIndex: number | null;
  editPointStartX: number;
  editPointStartY: number;
}

const HANDLE_SIZE = 8;
const MIN_SIZE = 20;
const CONTROL_POINT_RADIUS = 6;

function findObjectAt(objects: Shape[], x: number, y: number): Shape | null {
  for (let i = objects.length - 1; i >= 0; i--) {
    if (objects[i].hitTest(x, y)) {
      return objects[i];
    }
  }
  return null;
}

function getHandleAtPoint(bounds: any, x: number, y: number): string | null {
  const minX = bounds.minX;
  const maxX = bounds.maxX;
  const minY = bounds.minY;
  const maxY = bounds.maxY;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const rotHandleOffset = 20;
  const rotX = midX;
  const rotY = minY - rotHandleOffset;

  const checkDist = (px: number, py: number) => {
    const dx = x - px;
    const dy = y - py;
    return Math.sqrt(dx * dx + dy * dy) <= HANDLE_SIZE * 1.5;
  };

  if (checkDist(rotX, rotY)) return "rotate";
  if (checkDist(minX, minY)) return "nw";
  if (checkDist(maxX, minY)) return "ne";
  if (checkDist(minX, maxY)) return "sw";
  if (checkDist(maxX, maxY)) return "se";
  if (checkDist(midX, minY)) return "n";
  if (checkDist(midX, maxY)) return "s";
  if (checkDist(minX, midY)) return "w";
  if (checkDist(maxX, midY)) return "e";
  return null;
}

function drawSelectionUI(renderer: RasterRenderer, obj: Shape, isHovered: boolean) {
  const bounds = obj.getBounds();
  const handleColor: RGBA = isHovered
    ? { r: 100, g: 200, b: 255, a: 255 }
    : { r: 80, g: 180, b: 255, a: 255 };
  const lineColor: RGBA = { r: 100, g: 150, b: 255, a: 200 };

  const minX = Math.round(bounds.minX);
  const maxX = Math.round(bounds.maxX);
  const minY = Math.round(bounds.minY);
  const maxY = Math.round(bounds.maxY);
  const midX = Math.round((minX + maxX) / 2);
  const midY = Math.round((minY + maxY) / 2);

  renderer.strokeLine(minX, minY, maxX, minY, lineColor, 1);
  renderer.strokeLine(maxX, minY, maxX, maxY, lineColor, 1);
  renderer.strokeLine(maxX, maxY, minX, maxY, lineColor, 1);
  renderer.strokeLine(minX, maxY, minX, minY, lineColor, 1);

  const drawHandle = (px: number, py: number) => {
    renderer.fillCircle(px, py, HANDLE_SIZE / 2, handleColor);
  };

  drawHandle(minX, minY);
  drawHandle(maxX, minY);
  drawHandle(minX, maxY);
  drawHandle(maxX, maxY);
  drawHandle(midX, minY);
  drawHandle(midX, maxY);
  drawHandle(minX, midY);
  drawHandle(maxX, midY);

  const rotHandleOffset = 20;
  const rotX = midX;
  const rotY = minY - rotHandleOffset;
  const rotLineColor: RGBA = { r: 255, g: 150, b: 50, a: 200 };
  renderer.strokeLine(midX, minY, rotX, rotY, rotLineColor, 1);
  drawHandle(rotX, rotY);
}

function drawHoverHighlight(renderer: RasterRenderer, obj: Shape) {
  const bounds = obj.getBounds();
  const lineColor: RGBA = { r: 100, g: 200, b: 100, a: 150 };

  const minX = Math.round(bounds.minX);
  const maxX = Math.round(bounds.maxX);
  const minY = Math.round(bounds.minY);
  const maxY = Math.round(bounds.maxY);

  renderer.strokeLine(minX, minY, maxX, minY, lineColor, 1);
  renderer.strokeLine(maxX, minY, maxX, maxY, lineColor, 1);
  renderer.strokeLine(maxX, maxY, minX, maxY, lineColor, 1);
  renderer.strokeLine(minX, maxY, minX, minY, lineColor, 1);
}

function drawControlPoints(renderer: RasterRenderer, obj: Shape) {
  if (obj instanceof PathBezier) {
    const controlPoints = obj.getControlPoints();
    const pointColor: RGBA = { r: 255, g: 100, b: 100, a: 255 };

    for (let i = 0; i < controlPoints.length; i++) {
      const p = obj.transformPointToDevice(controlPoints[i].x, controlPoints[i].y);
      renderer.fillCircle(Math.round(p.x), Math.round(p.y), CONTROL_POINT_RADIUS, pointColor);
    }
  }
}

function CanvasSceneComponent({ lineAlg }: CanvasSceneProps, ref: React.Ref<CanvasSceneRef>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<RasterRenderer | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [state, setState] = useState<EditorState>(() => {
    const rect = new Rect(100, 80);
    rect.transform.x = 150;
    rect.transform.y = 100;
    rect.fillStyle = { r: 220, g: 50, b: 50, a: 255 };

    const oval = new Oval(60, 80);
    oval.transform.x = 350;
    oval.transform.y = 150;
    oval.fillStyle = { r: 40, g: 150, b: 255, a: 255 };

    const path = new PathBezier(
      [
        { x: -30, y: -30 },
        { x: 0, y: -50 },
        { x: 30, y: -30 },
        { x: 40, y: 0 },
        { x: 30, y: 30 },
        { x: 0, y: 50 },
        { x: -30, y: 30 },
        { x: -40, y: 0 },
      ],
      "catmull",
      true
    );
    path.transform.x = 150;
    path.transform.y = 300;
    path.fillStyle = { r: 150, g: 100, b: 255, a: 255 };

    return {
      objects: [rect, oval, path],
      selectedId: null,
      hoveredId: null,
      mode: "idle",
      mouseX: 0,
      mouseY: 0,
      startMouseX: 0,
      startMouseY: 0,
      startState: null,
      dragHandle: null,
      editPointIndex: null,
      editPointStartX: 0,
      editPointStartY: 0,
    };
  });

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // setPointerCapture only if pointerId is available
    try {
      if ((e as any).pointerId !== undefined) {
        canvas.setPointerCapture((e as any).pointerId);
      }
    } catch (err) {
      // Ignore pointer capture errors (e.g., in testing environments)
    }
    const rect = canvas.getBoundingClientRect();
    const dpr = rendererRef.current?.dpr ?? 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    const prev = stateRef.current;

    if (prev.selectedId !== null) {
      const selected = prev.objects.find((o) => o.id === prev.selectedId);
      if (selected) {
        const bounds = selected.getBounds();
        const handle = getHandleAtPoint(bounds, x, y);
        if (handle) {
          setState({
            ...prev,
            mode: handle === "rotate" ? "rotate" : "resize",
            dragHandle: handle as any,
            startMouseX: x,
            startMouseY: y,
            startState: {
              x: selected.transform.x,
              y: selected.transform.y,
              scaleX: selected.transform.scaleX,
              scaleY: selected.transform.scaleY,
              rotation: selected.transform.rotation,
            },
          });
          return;
        }

        if (selected instanceof PathBezier) {
          const controlPoints = selected.getControlPoints();
          for (let i = 0; i < controlPoints.length; i++) {
            const p = selected.transformPointToDevice(controlPoints[i].x, controlPoints[i].y);
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) <= CONTROL_POINT_RADIUS * 2) {
              setState({
                ...prev,
                mode: "edit_point",
                editPointIndex: i,
                editPointStartX: controlPoints[i].x,
                editPointStartY: controlPoints[i].y,
                startMouseX: x,
                startMouseY: y,
              });
              return;
            }
          }
        }
      }
    }

    const clicked = findObjectAt(prev.objects, x, y);
    if (clicked) {
      setState({
        ...prev,
        selectedId: clicked.id,
        mode: "move",
        startMouseX: x,
        startMouseY: y,
        startState: {
          x: clicked.transform.x,
          y: clicked.transform.y,
          scaleX: clicked.transform.scaleX,
          scaleY: clicked.transform.scaleY,
          rotation: clicked.transform.rotation,
        },
      });
    } else {
      setState({ ...prev, selectedId: null, mode: "idle" });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = rendererRef.current?.dpr ?? 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    const prev = stateRef.current;

    if (prev.mode === "idle") {
      const hovered = findObjectAt(prev.objects, x, y);
      setState((s) => ({ ...s, hoveredId: hovered?.id ?? null }));
      return;
    }

    if (prev.mode === "move" && prev.selectedId !== null && prev.startState) {
      const selected = prev.objects.find((o) => o.id === prev.selectedId);
      if (selected) {
        const dx = x - prev.startMouseX;
        const dy = y - prev.startMouseY;
        selected.transform.x = prev.startState.x + dx;
        selected.transform.y = prev.startState.y + dy;
        setState((s) => ({ ...s }));
      }
      return;
    }

    if (prev.mode === "resize" && prev.selectedId !== null && prev.startState && prev.dragHandle) {
      const selected = prev.objects.find((o) => o.id === prev.selectedId);
      if (selected) {
        const bounds = selected.getBounds();
        const dx = x - prev.startMouseX;
        const dy = y - prev.startMouseY;

        let newMinX = bounds.minX;
        let newMaxX = bounds.maxX;
        let newMinY = bounds.minY;
        let newMaxY = bounds.maxY;

        if (prev.dragHandle.includes("w")) newMinX += dx;
        if (prev.dragHandle.includes("e")) newMaxX += dx;
        if (prev.dragHandle.includes("n")) newMinY += dy;
        if (prev.dragHandle.includes("s")) newMaxY += dy;

        if (newMaxX - newMinX >= MIN_SIZE && newMaxY - newMinY >= MIN_SIZE) {
          selected.resizeFromDeviceAABB(newMinX, newMinY, newMaxX, newMaxY);
          setState((s) => ({ ...s }));
        }
      }
      return;
    }

    if (prev.mode === "rotate" && prev.selectedId !== null && prev.startState) {
      const selected = prev.objects.find((o) => o.id === prev.selectedId);
      if (selected) {
        const center = selected.getCenter();
        const angle1 = Math.atan2(prev.startMouseY - center.y, prev.startMouseX - center.x);
        const angle2 = Math.atan2(y - center.y, x - center.x);
        const deltaAngle = angle2 - angle1;
        selected.transform.rotation = prev.startState.rotation + deltaAngle;
        setState((s) => ({ ...s }));
      }
      return;
    }

    if (prev.mode === "edit_point" && prev.selectedId !== null && prev.editPointIndex !== null) {
      const selected = prev.objects.find((o) => o.id === prev.selectedId);
      if (selected instanceof PathBezier && prev.startState) {
        // Transform current mouse position to local coordinates
        const localCurrent = selected.transformPointToLocal(x, y);
        // Transform start mouse position to local coordinates
        const localStart = selected.transformPointToLocal(prev.startMouseX, prev.startMouseY);
        // Calculate delta in local space
        const dx = localCurrent.x - localStart.x;
        const dy = localCurrent.y - localStart.y;
        const newX = prev.editPointStartX + dx;
        const newY = prev.editPointStartY + dy;
        selected.setControlPoint(prev.editPointIndex, { x: newX, y: newY });
        setState((s) => ({ ...s }));
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && (e as any).pointerId !== undefined) {
      try {
        canvas.releasePointerCapture((e as any).pointerId);
      } catch (err) {
        // ignore
      }
    }
    setState((prev) => ({
      ...prev,
      mode: "idle",
      dragHandle: null,
      editPointIndex: null,
    }));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const prev = stateRef.current;

    if (e.key === "Delete" || e.key === "Backspace") {
      setState((s) => ({
        ...s,
        objects: s.objects.filter((o) => o.id !== prev.selectedId),
        selectedId: null,
      }));
    }

    if (e.key === "d" && e.ctrlKey) {
      e.preventDefault();
      const selected = prev.objects.find((o) => o.id === prev.selectedId);
      if (selected) {
        const clone = selected.clone();
        clone.transform.x += 20;
        clone.transform.y += 20;
        setState((s) => ({
          ...s,
          objects: [...s.objects, clone],
          selectedId: clone.id,
        }));
      }
    }

    if (e.key === "ArrowUp" && e.ctrlKey) {
      e.preventDefault();
      const idx = prev.objects.findIndex((o) => o.id === prev.selectedId);
      if (idx >= 0 && idx < prev.objects.length - 1) {
        const newObjects = [...prev.objects];
        [newObjects[idx], newObjects[idx + 1]] = [newObjects[idx + 1], newObjects[idx]];
        setState((s) => ({ ...s, objects: newObjects }));
      }
    }

    if (e.key === "ArrowDown" && e.ctrlKey) {
      e.preventDefault();
      const idx = prev.objects.findIndex((o) => o.id === prev.selectedId);
      if (idx > 0) {
        const newObjects = [...prev.objects];
        [newObjects[idx], newObjects[idx - 1]] = [newObjects[idx - 1], newObjects[idx]];
        setState((s) => ({ ...s, objects: newObjects }));
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = rendererRef.current?.dpr ?? 1;
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    const clicked = findObjectAt(stateRef.current.objects, x, y);
    if (clicked instanceof PathBezier) {
      const localPos = clicked.transformPointToLocal(x, y);
      const closestDist = 50;
      let closestIdx = -1;
      let minDist = closestDist;

      for (let i = 0; i < clicked.anchors.length; i++) {
        const dx = localPos.x - clicked.anchors[i].x;
        const dy = localPos.y - clicked.anchors[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }

      if (closestIdx >= 0) {
        const menu = document.createElement("div");
        menu.style.position = "fixed";
        menu.style.left = e.clientX + "px";
        menu.style.top = e.clientY + "px";
        menu.style.background = "#1e293b";
        menu.style.border = "1px solid #475569";
        menu.style.borderRadius = "4px";
        menu.style.zIndex = "10000";
        menu.style.minWidth = "150px";

        const deleteItem = document.createElement("div");
        deleteItem.textContent = "Удалить точку";
        deleteItem.style.padding = "8px 12px";
        deleteItem.style.cursor = "pointer";
        deleteItem.style.color = "#e2e8f0";
        deleteItem.style.fontSize = "12px";
        deleteItem.style.borderBottom = "1px solid #334155";
        deleteItem.onmouseenter = () => (deleteItem.style.background = "#334155");
        deleteItem.onmouseleave = () => (deleteItem.style.background = "");
        deleteItem.onclick = () => {
          if (clicked instanceof PathBezier) {
            clicked.removePoint(closestIdx);
            setState((s) => ({ ...s }));
          }
          if (document.body.contains(menu)) {
            document.body.removeChild(menu);
          }
        };

        const insertItem = document.createElement("div");
        insertItem.textContent = "Вставить точку";
        insertItem.style.padding = "8px 12px";
        insertItem.style.cursor = "pointer";
        insertItem.style.color = "#e2e8f0";
        insertItem.style.fontSize = "12px";
        insertItem.onmouseenter = () => (insertItem.style.background = "#334155");
        insertItem.onmouseleave = () => (insertItem.style.background = "");
        insertItem.onclick = () => {
          if (clicked instanceof PathBezier) {
            clicked.addPointLocal(localPos, closestIdx + 1);
            setState((s) => ({ ...s }));
          }
          if (document.body.contains(menu)) {
            document.body.removeChild(menu);
          }
        };

        menu.appendChild(deleteItem);
        menu.appendChild(insertItem);
        document.body.appendChild(menu);

        setTimeout(() => {
          const handler = () => {
            if (document.body.contains(menu)) {
              document.body.removeChild(menu);
            }
            document.removeEventListener("click", handler);
          };
          document.addEventListener("click", handler);
        }, 0);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setLineAlgorithm(lineAlg);
    }
  }, [lineAlg]);

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

        for (const obj of state.objects) {
          obj.drawRaster(currentRenderer);
        }

        if (state.hoveredId !== null && state.hoveredId !== state.selectedId) {
          const hovered = state.objects.find((o) => o.id === state.hoveredId);
          if (hovered) {
            drawHoverHighlight(currentRenderer, hovered);
          }
        }

        if (state.selectedId !== null) {
          const selected = state.objects.find((o) => o.id === state.selectedId);
          if (selected) {
            drawSelectionUI(currentRenderer, selected, state.hoveredId === state.selectedId);
            drawControlPoints(currentRenderer, selected);
          }
        }

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
  }, [lineAlg, state]);

  useImperativeHandle(ref, () => ({
    getState: () => state,
    selectLayer: (id: number) => {
      setState((prev) => ({ ...prev, selectedId: id }));
    },
    moveLayerUp: (id: number) => {
      setState((prev) => {
        const idx = prev.objects.findIndex((o) => o.id === id);
        if (idx >= 0 && idx < prev.objects.length - 1) {
          const newObjects = [...prev.objects];
          [newObjects[idx], newObjects[idx + 1]] = [newObjects[idx + 1], newObjects[idx]];
          return { ...prev, objects: newObjects };
        }
        return prev;
      });
    },
    moveLayerDown: (id: number) => {
      setState((prev) => {
        const idx = prev.objects.findIndex((o) => o.id === id);
        if (idx > 0) {
          const newObjects = [...prev.objects];
          [newObjects[idx], newObjects[idx - 1]] = [newObjects[idx - 1], newObjects[idx]];
          return { ...prev, objects: newObjects };
        }
        return prev;
      });
    },
    deleteLayer: (id: number) => {
      setState((prev) => ({
        ...prev,
        objects: prev.objects.filter((o) => o.id !== id),
        selectedId: prev.selectedId === id ? null : prev.selectedId,
      }));
    },
    duplicateLayer: (id: number) => {
      setState((prev) => {
        const selected = prev.objects.find((o) => o.id === id);
        if (selected) {
          const clone = selected.clone();
          clone.transform.x += 20;
          clone.transform.y += 20;
          return {
            ...prev,
            objects: [...prev.objects, clone],
            selectedId: clone.id,
          };
        }
        return prev;
      });
    },
  }));

  return (
    <div ref={containerRef} className="w-full h-full rounded-lg overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-full block bg-slate-950 cursor-default"
        onMouseDown={handleMouseDown as any}
        onMouseMove={handleMouseMove as any}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu as any}
      />
    </div>
  );
}

const CanvasScene = forwardRef(CanvasSceneComponent);
export default CanvasScene;