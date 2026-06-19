import React from 'react';
import { resolveImageUrl } from '../../utils/imageUtils';

/**
 * Gestion des images produit avec couleur associée (admin).
 * Chaque image peut être liée à une couleur pour l'affichage client.
 */
const ProductImageManager = ({
  images = [],
  productColors = [],
  onChange,
  onAddFiles,
}) => {
  const updateImageColor = (index, color) => {
    onChange(
      images.map((img, i) => (i === index ? { ...img, color } : img))
    );
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleFileInput = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    onAddFiles(files);
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Associez chaque image à une couleur. Quand le client choisit une couleur, l&apos;image correspondante s&apos;affiche.
        Laissez « Galerie générale » pour une image visible pour toutes les couleurs.
      </p>

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div key={`${image.url || image.preview}-${index}`} className="border rounded-lg p-3 bg-gray-50 space-y-3">
              <div className="relative">
                <img
                  src={image.preview || resolveImageUrl(image.url)}
                  alt={`Produit ${index + 1}`}
                  className="w-full h-36 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600"
                  aria-label="Supprimer l'image"
                >
                  ×
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Couleur de l&apos;image
                </label>
                <select
                  value={image.color || ''}
                  onChange={(e) => updateImageColor(index, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Galerie générale</option>
                  {productColors.map((color) => (
                    <option key={color.name} value={color.name}>
                      {color.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-medium">
          + Ajouter des images
          <input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </label>
      </div>
    </div>
  );
};

export default ProductImageManager;
