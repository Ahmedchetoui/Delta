import React from 'react';

/**
 * Composant de sélection de pack promotionnel
 * Reproduit fidèlement le design moderne demandé :
 * - Cartes aux bords arrondis (pill/card)
 * - Titre de l'offre (ex: "4 Pull")
 * - Badge promotionnel vert éclatant ("27% REMISE!")
 * - Prix barré d'origine (ex: "132 DT")
 * - Prix final après remise en grand et gras (ex: "97 DT")
 * - Mise en valeur nette du pack sélectionné (contour noir élégant)
 */
const ProductPackSelector = ({
  packs = [],
  selectedPackId,
  onSelectPack,
  currency = 'DT',
}) => {
  if (!packs || packs.length === 0) return null;

  return (
    <div className="space-y-3 my-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-gray-800 uppercase tracking-wide flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          Choisissez votre offre
        </span>
        <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full">
          Offres économiques
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {packs.map((pack, index) => {
          const packKey = pack._id ? String(pack._id) : `pack-${index}`;
          const isSelected = selectedPackId
            ? String(selectedPackId) === packKey || String(pack._id) === String(selectedPackId)
            : index === 0;

          const discountBadge = pack.badge || (pack.discount && pack.discount > 0 ? `${pack.discount}% REMISE!` : '');
          const hasDiscount = (pack.originalPrice && pack.originalPrice > pack.price) || (pack.discount && pack.discount > 0);

          return (
            <button
              key={packKey}
              type="button"
              onClick={() => onSelectPack && onSelectPack(pack)}
              className={`w-full text-left transition-all duration-200 relative px-5 py-3.5 rounded-[22px] flex items-center justify-between cursor-pointer select-none ${
                isSelected
                  ? 'bg-gray-400/90 text-gray-950 border-[2.5px] border-gray-900 shadow-md transform -translate-y-0.5'
                  : 'bg-gray-200/90 hover:bg-gray-300/80 text-gray-800 border-2 border-transparent hover:border-gray-300'
              }`}
            >
              {/* Colonne gauche : Nom de l'article & Badge remise */}
              <div className="flex flex-col items-start gap-1.5">
                <span
                  className={`text-lg sm:text-xl font-bold tracking-tight ${
                    isSelected ? 'text-white drop-shadow-sm' : 'text-gray-900'
                  }`}
                >
                  {pack.title}
                </span>

                {discountBadge && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#22c55e] text-white shadow-sm tracking-wide">
                    {discountBadge}
                  </span>
                )}

                {pack.description && (
                  <span className="text-xs text-gray-600 font-medium">
                    {pack.description}
                  </span>
                )}
              </div>

              {/* Colonne droite : Prix barré & Prix final après remise */}
              <div className="flex flex-col items-end justify-center">
                {hasDiscount && pack.originalPrice != null && (
                  <span className="text-sm sm:text-base font-semibold text-gray-500 line-through tracking-tight">
                    {pack.originalPrice % 1 === 0 ? pack.originalPrice : pack.originalPrice.toFixed(2)} {currency}
                  </span>
                )}
                <span
                  className={`text-xl sm:text-2xl font-black tracking-tight ${
                    isSelected ? 'text-gray-950' : 'text-gray-900'
                  }`}
                >
                  {pack.price % 1 === 0 ? pack.price : pack.price.toFixed(2)} {currency}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductPackSelector;
