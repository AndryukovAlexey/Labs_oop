import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Save, MousePointer2, Square, Circle } from "lucide-react";

const tools = [
  { icon: MousePointer2, label: "Выбор" },
  { icon: Square, label: "Квадрат" },
  { icon: Circle, label: "Круг" },
];

function Editor() {
  const { id } = useParams<{ id: string }>();

  return (
    <motion.div
      className="h-screen flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Toolbar */}
      <header className="h-14 border-b border-slate-700 bg-slate-900 flex items-center justify-between px-4 shrink-0">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          Назад
        </Link>
        <h2 className="text-lg font-semibold">
          Редактирование проекта №{id}
        </h2>
        <button className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded-lg transition-colors cursor-pointer">
          <Save size={16} />
          Сохранить
        </button>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Left panel — Tools */}
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

        {/* Canvas */}
        <main className="flex-1 bg-slate-800 flex items-center justify-center p-8 overflow-auto">
          <div className="w-full max-w-3xl aspect-[4/3] bg-white rounded-lg shadow-2xl" />
        </main>

        {/* Right panel — Properties */}
        <aside className="w-64 border-l border-slate-700 bg-slate-900 p-4 shrink-0">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Свойства
          </h3>
          <p className="text-sm text-slate-500">
            Выберите объект на холсте для редактирования свойств.
          </p>
        </aside>
      </div>
    </motion.div>
  );
}

export default Editor;
