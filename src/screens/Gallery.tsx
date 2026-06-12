import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, FolderOpen } from "lucide-react";
import { loadProjectIndex, type ProjectMeta } from "../lib/projectStorage";

function newProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("ru-RU");
}

function Gallery() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const index = await loadProjectIndex();
        if (!cancelled) setProjects(index);
      } catch (err) {
        console.error("Не удалось загрузить список проектов:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addProject = () => {
    const id = newProjectId();
    const name = `Проект ${projects.length + 1}`;
    navigate(`/editor/${id}`, { state: { name } });
  };

  return (
    <motion.div
      className="p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Мои проекты</h1>
        <button
          onClick={addProject}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Создать проект
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-slate-500">
          <FolderOpen size={64} strokeWidth={1} />
          <p className="mt-4 text-lg">Нет проектов. Создайте первый!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/editor/${project.id}`)}
            >
              <motion.div
                className="bg-slate-800 hover:bg-slate-700 rounded-xl p-6 border border-slate-700 transition-colors cursor-pointer"
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-full h-32 bg-slate-700 rounded-lg mb-4" />
                <h2 className="text-lg font-semibold">{project.name}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {formatDate(project.updatedAt)}
                </p>
              </motion.div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default Gallery;
