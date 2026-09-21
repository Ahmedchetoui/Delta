import React from 'react';

const formatPrice = (value) => {
  const amount = Number(value || 0);
  return Number.isInteger(amount) ? amount : amount.toFixed(2);
};

// Sélecteur client pour les produits dont l'admin a activé « Vente par pack ».
// Les valeurs affichées viennent du produit, mais le backend les revalide lors
// de la commande afin qu'une remise ne puisse pas être falsifiée côté client.
const ProductPackSelector = ({ packs = [], selectedPackId, onSelectPack, currency = 'DT' }) => {
  if (!packs.length) return null;

  return (
    <section className="space-y-3" aria-label="Choisissez votre offre">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-gray-800 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          Choisissez votre offre
        </h3>
        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
          Offres économiques
        </span>
      </div>

      <div className="space-y-2.5">
        {packs.map((pack, index) => {
          const key = pack._id ? String(pack._id) : `pack-${index}`;
          const isSelected = selectedPackId
            ? String(selectedPackId) === key || String(selectedPackId) === String(pack.title)
            : index === 0;
          const hasDiscount = Number(pack.discount) > 0 || Number(pack.originalPrice) > Number(pack.price);
          const badge = pack.badge || (Number(pack.discount) > 0 ? `${Math.round(pack.discount)}% REMISE !` : '');

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectPack?.(pack)}
              className={`relative flex w-full items-center justify-between rounded-[22px] border-2 px-5 py-3.5 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-gray-900 bg-gray-400 text-gray-950 shadow-md -translate-y-0.5'
                  : 'border-transparent bg-gray-200 text-gray-900 hover:border-gray-300 hover:bg-gray-300'
              }`}
              aria-pressed={isSelected}
            >
              <span className="flex flex-col items-start gap-1.5">
                <span className={`text-lg font-extrabold sm:text-xl ${isSelected ? 'text-white drop-shadow-sm' : ''}`}>
                  {pack.title}
                </span>
                {badge && (
                  <span className="rounded-lg bg-emerald-500 px-2.5 py-0.5 text-xs font-extrabold tracking-wide text-white shadow-sm">
                    {badge}
                  </span>
                )}
                {pack.description && <span className="text-xs font-medium text-gray-700">{pack.description}</span>}
              </span>

              <span className="flex flex-col items-end">
                {hasDiscount && pack.originalPrice != null && (
                  <span className="text-sm font-semibold text-gray-500 line-through sm:text-base">
                    {formatPrice(pack.originalPrice)} {currency}
                  </span>
                )}
                <span className="text-xl font-black tracking-tight sm:text-2xl">
                  {formatPrice(pack.price)} {currency}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ProductPackSelector;
