import React from 'react';
import { resolveImageUrl } from '../../utils/imageUtils';
import { colorNameToHex } from '../../utils/colorUtils';

function ColorSwatch({ color }) {
  const hex = color?.code || colorNameToHex(color?.name || '');
  return (
    <span
      className="w-6 h-6 rounded-full border border-gray-300 shrink-0"
      style={{ backgroundColor: hex }}
    />
  );
}

function ImagePreview({ image, index, onRemove, showColorSelect, productColors, onColorChange }) {
  return (
    <div className="relative border rounded-lg overflow-hidden bg-white">
      <img
        src={image.preview || resolveImageUrl(image.url)}
        alt={`Produit ${index + 1}`}
        className="w-full h-32 object-cover"
      />
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600"
        aria-label="Supprimer l'image"
      >
        ×
      </button>
      {showColorSelect && (
        <div className="p-2 border-t">
          <select
            value={image.color || ''}
            onChange={(e) => onColorChange(index, e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
          >
            <option value="">Galerie générale</option>
            {productColors.map((color) => (
              <option key={color.name} value={color.name}>
                {color.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

/**
 * Gestion des images produit avec association par couleur (admin).
 */
const ProductImageManager = ({
  images = [],
  productColors = [],
  variantColors = [],
  onChange,
  onAddFiles,
}) => {
  const updateImageColor = (index, color) => {
    onChange(images.map((img, i) => (i === index ? { ...img, color } : img)));
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleFileInput = (event, color = '') => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    onAddFiles(files, color);
    event.target.value = '';
  };

  const generalImages = images
    .map((img, index) => ({ img, index }))
    .filter(({ img }) => !img.color);

  const hasColors = productColors.length > 0;

  if (!hasColors) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Ajoutez d&apos;abord des couleurs au produit pour associer une photo à chaque couleur
          (ex. photo bleue quand le client choisit Bleu).
        </p>
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((image, index) => (
              <ImagePreview
                key={`${image.url || image.preview}-${index}`}
                image={image}
                index={index}
                onRemove={removeImage}
              />
            ))}
          </div>
        )}
        <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-medium">
          + Ajouter des images
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileInput} />
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Ajoutez une photo pour chaque couleur. Quand le client choisit <strong>Bleu</strong>, il verra
        l&apos;image associée au Bleu.
      </p>

      {productColors.map((color) => {
        const colorEntries = images
          .map((img, index) => ({ img, index }))
          .filter(({ img }) => img.color === color.name);
        const usedInVariant = variantColors.includes(color.name);
        const missingPhoto = usedInVariant && colorEntries.length === 0;

        return (
          <div
            key={color.name}
            className={`rounded-xl border p-4 space-y-3 ${
              missingPhoto ? 'border-amber-400 bg-amber-50/40' : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ColorSwatch color={color} />
                <span className="font-semibold text-gray-900">{color.name}</span>
                {usedInVariant && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    Variante
                  </span>
                )}
              </div>
              <label
                htmlFor={`color-upload-${color.name}`}
                className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-medium"
              >
                + Photo {color.name}
              </label>
              <input
                id={`color-upload-${color.name}`}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFileInput(e, color.name)}
              />
            </div>

            {missingPhoto && (
              <p className="text-sm text-amber-700">
                Cette couleur est utilisée dans une variante — ajoutez sa photo pour l&apos;afficher aux clients.
              </p>
            )}

            {colorEntries.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {colorEntries.map(({ img, index }) => (
                  <ImagePreview
                    key={`${img.url || img.preview}-${index}`}
                    image={img}
                    index={index}
                    onRemove={removeImage}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic py-2">Aucune photo pour cette couleur</div>
            )}
          </div>
        );
      })}

      <div className="rounded-xl border border-dashed border-gray-300 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium text-gray-800">Galerie générale</p>
            <p className="text-xs text-gray-500">Optionnel — visible pour toutes les couleurs si aucune photo spécifique</p>
          </div>
          <label className="inline-flex items-center gap-1 border border-gray-300 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-sm">
            + Ajouter
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileInput(e, '')} />
          </label>
        </div>
        {generalImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {generalImages.map(({ img, index }) => (
              <ImagePreview
                key={`${img.url || img.preview}-${index}`}
                image={img}
                index={index}
                onRemove={removeImage}
                showColorSelect
                productColors={productColors}
                onColorChange={updateImageColor}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageManager;
