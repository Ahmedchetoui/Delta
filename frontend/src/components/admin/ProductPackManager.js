import React from 'react';
import ProductPackSelector from '../product/ProductPackSelector';

const roundMoney = (value) => Math.round(Number(value || 0) * 100) / 100;

const ProductPackManager = ({
  pricingMethod = 'standard',
  packs = [],
  productName = 'Article',
  productPrice = 0,
  onChangePricingMethod,
  onChangePacks,
}) => {
  const basePrice = Math.max(0, Number(productPrice) || 0);
  const itemName = String(productName || 'Article').trim() || 'Article';

  const generatePacks = () => {
    const tiers = [
      [1, 0, false],
      [2, 9, false],
      [3, 20, false],
      [4, 27, true],
    ];

    onChangePacks(tiers.map(([quantity, discount, isPopular]) => {
      const originalPrice = roundMoney(basePrice * quantity);
      return {
        quantity,
        title: `${quantity} ${itemName}`,
        originalPrice,
        discount,
        price: roundMoney(originalPrice * (1 - discount / 100)),
        badge: discount ? `${discount}% REMISE !` : '',
        isPopular,
        description: isPopular ? 'Offre la plus avantageuse' : '',
      };
    }));
  };

  const updatePack = (index, field, value) => {
    onChangePacks(packs.map((pack, packIndex) => {
      if (packIndex !== index) return pack;
      const next = { ...pack, [field]: value };
      const original = Number(next.originalPrice);

      if (field === 'discount' && Number.isFinite(original)) {
        const discount = Math.min(100, Math.max(0, Number(value) || 0));
        next.price = roundMoney(original * (1 - discount / 100));
        if (!next.badge || /remise/i.test(next.badge)) next.badge = discount ? `${Math.round(discount)}% REMISE !` : '';
      }
      if (field === 'originalPrice' && Number(next.discount) > 0) {
        next.price = roundMoney((Number(value) || 0) * (1 - Number(next.discount) / 100));
      }
      if (field === 'price' && Number.isFinite(original) && original > 0) {
        const discount = Math.round((1 - (Number(value) || 0) / original) * 100);
        next.discount = Math.min(100, Math.max(0, discount));
        if (!next.badge || /remise/i.test(next.badge)) next.badge = next.discount ? `${next.discount}% REMISE !` : '';
      }
      return next;
    }));
  };

  const addPack = () => {
    const nextQuantity = Math.max(0, ...packs.map((pack) => Number(pack.quantity) || 0)) + 1;
    const originalPrice = roundMoney(basePrice * nextQuantity);
    onChangePacks([...packs, {
      quantity: nextQuantity,
      title: `${nextQuantity} ${itemName}`,
      originalPrice,
      discount: 0,
      price: originalPrice,
      badge: '',
      isPopular: false,
      description: '',
    }]);
  };

  const choosePopular = (index) => onChangePacks(
    packs.map((pack, packIndex) => ({ ...pack, isPopular: packIndex === index }))
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Méthode de vente</h3>
          <p className="mt-1 text-sm text-slate-500">Choisissez une seule méthode pour ce produit.</p>
        </div>
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-sm font-bold">
          <button
            type="button"
            onClick={() => onChangePricingMethod('standard')}
            className={`rounded-lg px-3 py-2 transition ${pricingMethod === 'standard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            1. Quantité (+ / −)
          </button>
          <button
            type="button"
            onClick={() => {
              onChangePricingMethod('pack');
              if (!packs.length) generatePacks();
            }}
            className={`rounded-lg px-3 py-2 transition ${pricingMethod === 'pack' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            2. Packs avec remise
          </button>
        </div>
      </div>

      {pricingMethod === 'standard' ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
          <strong className="text-slate-800">Vente standard active.</strong> Le client utilise les boutons − / + et choisit comme avant la taille et la couleur. Rien ne change sur ce mode.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-blue-950">Vente par pack active</p>
              <p className="mt-1 text-xs text-blue-800">Configurez les quantités, titres, prix avant remise, remises et prix finaux. Le prix du pack est sécurisé lors de la commande.</p>
            </div>
            <button type="button" onClick={generatePacks} className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700">
              Générer 1 / 2 / 3 / 4 packs
            </button>
          </div>

          {!basePrice && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">Saisissez d’abord le prix unitaire du produit, puis régénérez les packs pour calculer leurs prix automatiquement.</p>
          )}

          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800">Offres configurées ({packs.length})</h4>
            <button type="button" onClick={addPack} className="text-sm font-bold text-blue-600 hover:text-blue-800">+ Ajouter une offre</button>
          </div>

          <div className="space-y-3">
            {packs.map((pack, index) => (
              <article key={pack._id || `${pack.quantity}-${index}`} className={`rounded-xl border p-4 ${pack.isPopular ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/10' : 'border-slate-200'}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-sm text-slate-900">Offre {index + 1}{pack.isPopular ? ' · sélectionnée par défaut' : ''}</strong>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => choosePopular(index)} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100">
                      {pack.isPopular ? '✓ Par défaut' : 'Définir par défaut'}
                    </button>
                    <button type="button" onClick={() => onChangePacks(packs.filter((_, packIndex) => packIndex !== index))} className="rounded-md px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50">
                      Supprimer
                    </button>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <label className="text-xs font-semibold text-slate-600">Quantité<input type="number" min="1" max="10" value={pack.quantity} onChange={(event) => updatePack(index, 'quantity', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900" /></label>
                  <label className="text-xs font-semibold text-slate-600 lg:col-span-2">Nom affiché<input value={pack.title || ''} onChange={(event) => updatePack(index, 'title', event.target.value)} placeholder="ex. 4 Pull" className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900" /></label>
                  <label className="text-xs font-semibold text-slate-600">Prix avant remise (DT)<input type="number" min="0" step="0.01" value={pack.originalPrice ?? ''} onChange={(event) => updatePack(index, 'originalPrice', event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900" /></label>
                  <label className="text-xs font-semibold text-slate-600">Prix final (DT)<input type="number" min="0" step="0.01" value={pack.price ?? ''} onChange={(event) => updatePack(index, 'price', event.target.value)} className="mt-1 w-full rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2 text-sm font-bold text-slate-900" /></label>
                  <label className="text-xs font-semibold text-slate-600">Remise (%)<input type="number" min="0" max="100" value={pack.discount ?? ''} onChange={(event) => updatePack(index, 'discount', event.target.value)} className="mt-1 w-full rounded-lg border border-emerald-300 px-2.5 py-2 text-sm font-bold text-emerald-700" /></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Badge vert<input value={pack.badge || ''} onChange={(event) => updatePack(index, 'badge', event.target.value)} placeholder="ex. 27% REMISE !" className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900" /></label>
                  <label className="text-xs font-semibold text-slate-600 sm:col-span-2">Avantage (facultatif)<input value={pack.description || ''} onChange={(event) => updatePack(index, 'description', event.target.value)} placeholder="ex. Offre la plus avantageuse" className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm text-slate-900" /></label>
                </div>
              </article>
            ))}
          </div>

          {packs.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Aperçu client</p>
              <ProductPackSelector packs={packs} selectedPackId={(packs.find((pack) => pack.isPopular) || packs[0])?.title} onSelectPack={(pack) => choosePopular(packs.indexOf(pack))} />
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default ProductPackManager;
