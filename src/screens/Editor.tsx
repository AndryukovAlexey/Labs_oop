import { useState, useRef, useEffect } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, MousePointer2, Square, Circle } from "lucide-react";
import CanvasScene, { type CanvasSceneRef } from "./CanvasScene";
import LayersPanel from "./LayersPanel";
import { type LineAlg } from "../lib/raster/RasterRenderer";
import {
  loadProject,
  saveProject,
  projectShapes,
  type ProjectMeta,
} from "../lib/projectStorage";

const tools = [
  { icon: MousePointer2, label: "Выбор" },
  { icon: Square, label: "Квадрат" },
  { icon: Circle, label: "Круг" },
];

function Editor() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [lineAlg, setLineAlg] = useState<LineAlg>("bresenham");
  const canvasRef = useRef<CanvasSceneRef | null>(null);
  const [editorState, setEditorState] = useState<any>(null);
  const metaRef = useRef<ProjectMeta | null>(null);
  const [projectName, setProjectName] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const interval = setInterval(() => {
      if (canvasRef.current) {
        setEditorState(canvasRef.current.getState());
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      let data = null;
      try {
        data = await loadProject(id);
      } catch (err) {
        console.error("Не удалось загрузить проект:", err);
      }
      if (cancelled) return;

      if (data) {
        metaRef.current = {
          id: data.id,
          name: data.name,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
        setProjectName(data.name);
        setLineAlg(data.lineAlg ?? "bresenham");
        canvasRef.current?.loadShapes(projectShapes(data));
      } else {
        const now = new Date().toISOString();
        const stateName = (location.state as { name?: string } | null)?.name;
        const name = stateName ?? "Новый проект";
        metaRef.current = {
          id,
          name,
          createdAt: now,
          updatedAt: now,
        };
        setProjectName(name);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!canvasRef.current || !metaRef.current) return;
    setSaveStatus("saving");
    try {
      const objects = canvasRef.current.getState().objects;
      const saved = await saveProject(metaRef.current, lineAlg, objects);
      metaRef.current = {
        id: saved.id,
        name: saved.name,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Не удалось сохранить проект:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const handleSelectLayer = (id: number) => {
    canvasRef.current?.selectLayer(id);
  };

  const handleMoveLayerUp = (id: number) => {
    canvasRef.current?.moveLayerUp(id);
  };

  const handleMoveLayerDown = (id: number) => {
    canvasRef.current?.moveLayerDown(id);
  };

  const handleDeleteLayer = (id: number) => {
    canvasRef.current?.deleteLayer(id);
  };

  const handleDuplicateLayer = (id: number) => {
    canvasRef.current?.duplicateLayer(id);
  };

  const layers = editorState?.objects?.map((obj: any, index: number) => ({
    id: obj.id,
    type: obj.constructor.name,
    index,
    selected: editorState.selectedId === obj.id,
  })) ?? [];

  return (
    <motion.div
      className="h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <header className="h-14 border-b border-slate-700 bg-slate-900 flex items-center justify-between px-4 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Назад
        </Link>
        <h2 className="text-lg font-semibold">
          {projectName || "Редактор"}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button
              type="button"
              onClick={() => setLineAlg("bresenham")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                lineAlg === "bresenham"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Брезенхем
            </button>
            <button
              type="button"
              onClick={() => setLineAlg("wu")}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors border-l border-slate-700 cursor-pointer ${
                lineAlg === "wu"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Сяолинь Ву
            </button>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white px-4 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <Save size={16} />
            {saveStatus === "saving"
              ? "Сохранение…"
              : saveStatus === "saved"
                ? "Сохранено"
                : saveStatus === "error"
                  ? "Ошибка"
                  : "Сохранить"}
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-16 border-r border-slate-700 bg-slate-900 flex flex-col items-center py-4 gap-2 shrink-0">
          {tools.map(({ icon: Icon, label }) => (
            <button
              key={label}
              title={label}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Icon size={20} />
            </button>
          ))}
        </aside>

        <main className="flex-1 bg-slate-800 flex items-center justify-center p-8 overflow-auto">
          <div className="w-full max-w-3xl aspect-[4/3] rounded-lg shadow-2xl border border-slate-700 bg-slate-900">
            <CanvasScene ref={canvasRef} lineAlg={lineAlg} />
          </div>
        </main>

        <aside className="w-64 border-l border-slate-700 bg-slate-900 p-4 shrink-0 overflow-y-auto">
          <LayersPanel
            layers={layers}
            selectedId={editorState?.selectedId ?? null}
            onSelectLayer={handleSelectLayer}
            onMoveLayerUp={handleMoveLayerUp}
            onMoveLayerDown={handleMoveLayerDown}
            onDeleteLayer={handleDeleteLayer}
            onDuplicateLayer={handleDuplicateLayer}
          />
        </aside>
      </div>
    </motion.div>
  );
}

export default Editor;
