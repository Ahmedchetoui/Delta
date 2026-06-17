import React from 'react';
import { colorNameToHex } from '../../utils/colorUtils';

const VariantColorSelect = ({ value, colors = [], onChange, className = '' }) => {
  if (colors.length === 0) {
    return (
      <input
        type="text"
        placeholder="Couleur (ajoutez des couleurs ci-dessus)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className || 'border rounded px-3 py-2'}
      />
    );
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className || 'border rounded px-3 py-2 w-full'}
      >
        <option value="">Choisir une couleur</option>
        {colors.map((color) => (
          <option key={color.name} value={color.name}>
            {color.name}
          </option>
        ))}
      </select>
      {value && (
        <span
          className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-gray-300 pointer-events-none"
          style={{ backgroundColor: colors.find((c) => c.name === value)?.code || colorNameToHex(value) }}
        />
      )}
    </div>
  );
};

export default VariantColorSelect;
