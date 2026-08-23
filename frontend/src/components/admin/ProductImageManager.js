import React, { useState, useRef, useEffect, useCallback } from 'react';
import { resolveImageUrl } from '../../utils/imageUtils';
import { colorNameToHex } from '../../utils/colorUtils';
import { ScissorIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

function ColorSwatch({ color }) {
  const hex = color?.code || colorNameToHex(color?.name || '');
  return (
    <span
      className="w-6 h-6 rounded-full border border-gray-300 shrink-0"
      style={{ backgroundColor: hex }}
    />
  );
}

/**
 * Modal interactif de redimensionnement et cadrage d'image canvas.
 */
function ImageCropModal({ imageUrl, onSave, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [imgObj, setImgObj] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => setImgObj(img);
  }, [imageUrl]);

  const drawCanvas = useCallback(() => {
    if (!imgObj || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const targetWidth = 600;
    const targetHeight = 800;
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Calcul de l'échelle initiale (cover)
    const scaleCover = Math.max(targetWidth / imgObj.width, targetHeight / imgObj.height);
    const finalScale = scaleCover * zoom;

    const drawW = imgObj.width * finalScale;
    const drawH = imgObj.height * finalScale;

    const baseDrawX = (targetWidth - drawW) / 2;
    const baseDrawY = (targetHeight - drawH) / 2;

    const finalX = baseDrawX + (offsetX * targetWidth) / 100;
    const finalY = baseDrawY + (offsetY * targetHeight) / 100;

    ctx.drawImage(imgObj, finalX, finalY, drawW, drawH);
  }, [imgObj, zoom, offsetX, offsetY]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleApply = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `cropped-${Date.now()}.jpg`, { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        onSave(file, previewUrl);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ScissorIcon className="h-5 w-5 text-blue-600" />
            Redimensionner & Cadrer la photo
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Ajustez le zoom et la position pour obtenir le meilleur rendu dans le cadre du produit (Format 3:4).
        </p>

        {/* Aperçu du cadre Canvas */}
        <div className="flex justify-center bg-gray-900 p-3 rounded-xl overflow-hidden shadow-inner">
          <canvas
            ref={canvasRef}
            className="w-48 h-64 rounded-lg shadow-lg border border-gray-700 object-contain bg-white"
          />
        </div>

        {/* Contrôles */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-xl text-xs font-semibold text-gray-700">
          <div>
            <div className="flex justify-between mb-1">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              min="1"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Position Horizontale (Gauche / Droite)</span>
              <span>{offsetX}%</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="1"
              value={offsetX}
              onChange={(e) => setOffsetX(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Position Verticale (Haut / Bas)</span>
              <span>{offsetY}%</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="1"
              value={offsetY}
              onChange={(e) => setOffsetY(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 font-medium"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center gap-1 shadow"
          >
            <CheckIcon className="h-4 w-4" />
            Appliquer le recadrage
          </button>
        </div>
      </div>
    </div>
  );
}

function ImagePreview({
  image,
  index,
  onRemove,
  onCrop,
  showColorSelect,
  productColors,
  onColorChange,
}) {
  const imgSrc = image.preview || resolveImageUrl(image.url);

  return (
    <div className="relative border rounded-xl overflow-hidden bg-white shadow-sm group">
      <div className="relative h-36 bg-gray-100">
        <img
          src={imgSrc}
          alt={`Produit ${index + 1}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => onCrop(index, imgSrc)}
            className="bg-blue-600 text-white p-2 rounded-lg text-xs font-bold hover:bg-blue-700 shadow flex items-center gap-1"
            title="Redimensionner et cadrer cette photo"
          >
            <ScissorIcon className="h-4 w-4" />
            Recadrer
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 shadow"
        aria-label="Supprimer l'image"
      >
        ×
      </button>

      {showColorSelect && (
        <div className="p-2 border-t bg-gray-50">
          <select
            value={image.color || ''}
            onChange={(e) => onColorChange(index, e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-2 py-1 text-xs"
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
 * Gestion des images produit avec recadrage interactif et association par couleur (admin).
 */
const ProductImageManager = ({
  images = [],
  productColors = [],
  variantColors = [],
  onChange,
  onAddFiles,
}) => {
  const [cropModalData, setCropModalData] = useState(null);

  const updateImageColor = (index, color) => {
    onChange(images.map((img, i) => (i === index ? { ...img, color } : img)));
  };

  const removeImage = (index) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const handleOpenCrop = (index, url) => {
    setCropModalData({ index, url });
  };

  const handleCropSave = (croppedFile, previewUrl) => {
    if (!cropModalData) return;
    const idx = cropModalData.index;
    onChange(
      images.map((img, i) =>
        i === idx
          ? {
              ...img,
              file: croppedFile,
              preview: previewUrl,
              isNew: true,
            }
          : img
      )
    );
    setCropModalData(null);
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

  return (
    <div className="space-y-6">
      {cropModalData && (
        <ImageCropModal
          imageUrl={cropModalData.url}
          onSave={handleCropSave}
          onClose={() => setCropModalData(null)}
        />
      )}

      {!hasColors ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ajoutez des images pour le produit. Survolez une image pour utiliser l'outil de <strong>recadrage et redimensionnement</strong>.
          </p>
          {images.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {images.map((image, index) => (
                <ImagePreview
                  key={`${image.url || image.preview}-${index}`}
                  image={image}
                  index={index}
                  onRemove={removeImage}
                  onCrop={handleOpenCrop}
                />
              ))}
            </div>
          )}
          <label className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-bold shadow">
            + Ajouter des images
            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileInput} />
          </label>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Ajoutez une photo pour chaque couleur. Survolez n'importe quelle photo pour la <strong>recadrer et ajuster</strong> son cadrage.
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
                    className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 cursor-pointer text-sm font-medium shadow"
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
                        onCrop={handleOpenCrop}
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
                <p className="text-xs text-gray-500">Optionnel — visible pour toutes les couleurs</p>
              </div>
              <label className="inline-flex items-center gap-1 border border-gray-300 bg-white px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer text-sm font-medium shadow-sm">
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
                    onCrop={handleOpenCrop}
                    showColorSelect
                    productColors={productColors}
                    onColorChange={updateImageColor}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageManager;
