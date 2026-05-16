import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Layers } from "lucide-react";
import Gallery from "./screens/Gallery";
import Editor from "./screens/Editor";
import "./App.css";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Gallery />} />
        <Route path="/editor/:id" element={<Editor />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <nav className="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-6 gap-4">
          <Layers size={20} className="text-blue-400" />
          <Link
            to="/"
            className="text-sm font-semibold hover:text-blue-400 transition-colors"
          >
            VectorEngine — Галерея
          </Link>
        </nav>
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}

export default App;
