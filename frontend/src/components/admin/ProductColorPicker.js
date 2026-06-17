import React, { useState } from 'react';
import { PRESET_COLORS } from '../../utils/colorUtils';

const ProductColorPicker = ({ colors = [], onChange }) => {
  const [customName, setCustomName] = useState('');
  const [customCode, setCustomCode] = useState('#2563eb');

  const isSelected = (name) =>
    colors.some((c) => c.name.toLowerCase() === name.toLowerCase());

  const togglePreset = (preset) => {
    if (isSelected(preset.name)) {
      onChange(colors.filter((c) => c.name.toLowerCase() !== preset.name.toLowerCase()));
      return;
    }
    onChange([...colors, { name: preset.name, code: preset.code }]);
  };

  const addCustomColor = () => {
    const name = customName.trim();
    if (!name) return;
    if (isSelected(name)) return;

    onChange([...colors, { name, code: customCode }]);
    setCustomName('');
  };

  const removeColor = (name) => {
    onChange(colors.filter((c) => c.name !== name));
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-600 mb-3">
          Couleurs proposées au client (obligatoire à la commande). Sur chaque variante, la couleur reste optionnelle.
        </p>
        <div className="flex flex-wrap gap-3">
          {PRESET_COLORS.map((preset) => {
            const selected = isSelected(preset.name);
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => togglePreset(preset)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                  selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-400'
                }`}
                title={preset.name}
              >
                <span
                  className="w-8 h-8 rounded-full border border-gray-300"
                  style={{ backgroundColor: preset.code }}
                />
                <span className="text-xs text-gray-700">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border">
        <div className="flex-1 min-w-[140px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">Nom personnalisé</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Ex: Corail"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Couleur</label>
          <input
            type="color"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value)}
            className="w-12 h-10 border rounded cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={addCustomColor}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Ajouter
        </button>
      </div>

      {colors.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Couleurs sélectionnées ({colors.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <span
                key={color.name}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border rounded-full text-sm"
              >
                <span
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.code }}
                />
                {color.name}
                <button
                  type="button"
                  onClick={() => removeColor(color.name)}
                  className="text-red-500 hover:text-red-700 font-bold ml-1"
                  aria-label={`Retirer ${color.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductColorPicker;
