import { ChevronUp, ChevronDown, Trash2, Copy } from "lucide-react";

interface Layer {
  id: number;
  type: string;
  index: number;
  selected: boolean;
}

interface LayersPanelProps {
  layers: Layer[];
  selectedId: number | null;
  onSelectLayer: (id: number) => void;
  onMoveLayerUp: (id: number) => void;
  onMoveLayerDown: (id: number) => void;
  onDeleteLayer: (id: number) => void;
  onDuplicateLayer: (id: number) => void;
}

function LayersPanel({
  layers,
  selectedId,
  onSelectLayer,
  onMoveLayerUp,
  onMoveLayerDown,
  onDeleteLayer,
  onDuplicateLayer,
}: LayersPanelProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Слои</h3>
      <div className="bg-slate-800 rounded-lg border border-slate-700 max-h-64 overflow-y-auto">
        {layers.length === 0 ? (
          <div className="p-3 text-sm text-slate-500">Нет объектов</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                  selectedId === layer.id
                    ? "bg-blue-900 text-white"
                    : "hover:bg-slate-700 text-slate-300"
                }`}
                onClick={() => onSelectLayer(layer.id)}
              >
                <span className="text-sm flex-1">{layer.type}</span>
                <div className="flex gap-1">
                  <button
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayerUp(layer.id);
                    }}
                    title="Вверх"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayerDown(layer.id);
                    }}
                    title="Вниз"
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateLayer(layer.id);
                    }}
                    title="Дублировать"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="p-1 hover:bg-red-600 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLayer(layer.id);
                    }}
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LayersPanel;
