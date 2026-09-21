import React from 'react';
import {
  PlusIcon,
  TrashIcon,
  SparklesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import ProductPackSelector from '../product/ProductPackSelector';

/**
 * Composant d'administration pour configurer les deux méthodes de vente :
 * 1. Standard (choix libre de la quantité et de la taille...)
 * 2. Pack (offres par lot comme sur l'image : 1 pull, 2 pull, 3 pull, 4 pull avec remises)
 */
const ProductPackManager = ({
  pricingMethod = 'standard',
  packs = [],
  productName = 'Article',
  productPrice = 0,
  onChangePricingMethod,
  onChangePacks,
}) => {
  // Générer automatiquement les packs 1, 2, 3, 4 basés sur le nom et le prix
  const handleGenerateDefaultPacks = () => {
    const basePrice = parseFloat(productPrice) || 30;
    const cleanName = (productName || 'Article').trim() || 'Article';

    // Règle de calcul inspirée de l'exemple utilisateur (1: 33 DT, 2: 60 DT (-9%), 3: 79 DT (-20%), 4: 97 DT (-27%))
    const defaultTiers = [
      {
        quantity: 1,
        title: `1 ${cleanName}`,
        originalPrice: basePrice,
        discount: 0,
        price: basePrice,
        badge: '',
        isPopular: false,
        description: '',
      },
      {
        quantity: 2,
        title: `2 ${cleanName.toLowerCase()}`,
        originalPrice: basePrice * 2,
        discount: 9,
        price: Math.round(basePrice * 2 * 0.91),
        badge: '9% REMISE!',
        isPopular: false,
        description: '',
      },
      {
        quantity: 3,
        title: `3 ${cleanName.toLowerCase()}`,
        originalPrice: basePrice * 3,
        discount: 20,
        price: Math.round(basePrice * 3 * 0.8),
        badge: '20% REMISE!',
        isPopular: false,
        description: '',
      },
      {
        quantity: 4,
        title: `4 ${cleanName}`,
        originalPrice: basePrice * 4,
        discount: 27,
        price: Math.round(basePrice * 4 * 0.73),
        badge: '27% REMISE!',
        isPopular: true,
        description: 'Offre la plus populaire',
      },
    ];

    onChangePacks(defaultTiers);
  };

  const handleAddPack = () => {
    const nextQty = packs.length > 0 ? Math.max(...packs.map((p) => p.quantity || 1)) + 1 : 1;
    const basePrice = parseFloat(productPrice) || 30;
    const cleanName = (productName || 'Article').trim() || 'Article';
    const orig = basePrice * nextQty;

    const newPack = {
      quantity: nextQty,
      title: `${nextQty} ${cleanName}`,
      originalPrice: orig,
      discount: 10,
      price: Math.round(orig * 0.9),
      badge: '10% REMISE!',
      isPopular: false,
      description: '',
    };

    onChangePacks([...packs, newPack]);
  };

  const handleUpdatePack = (index, field, value) => {
    const updated = packs.map((pack, i) => {
      if (i !== index) return pack;
      const copy = { ...pack, [field]: value };

      // Recalcul intelligent automatique
      if (field === 'discount') {
        const disc = Math.min(100, Math.max(0, parseFloat(value) || 0));
        copy.discount = disc;
        if (copy.originalPrice) {
          copy.price = Math.round(copy.originalPrice * (1 - disc / 100) * 100) / 100;
        }
        if (disc > 0 && (!copy.badge || copy.badge.includes('% REMISE!'))) {
          copy.badge = `${Math.round(disc)}% REMISE!`;
        }
      } else if (field === 'price') {
        const finalP = Math.max(0, parseFloat(value) || 0);
        copy.price = finalP;
        if (copy.originalPrice && copy.originalPrice > finalP) {
          const disc = Math.round((1 - finalP / copy.originalPrice) * 100);
          copy.discount = disc;
          if (disc > 0 && (!copy.badge || copy.badge.includes('% REMISE!'))) {
            copy.badge = `${disc}% REMISE!`;
          }
        }
      } else if (field === 'originalPrice') {
        const origP = Math.max(0, parseFloat(value) || 0);
        copy.originalPrice = origP;
        if (copy.discount > 0) {
          copy.price = Math.round(origP * (1 - copy.discount / 100) * 100) / 100;
        }
      }

      return copy;
    });

    onChangePacks(updated);
  };

  const handleSetPopular = (index) => {
    const updated = packs.map((pack, i) => ({
      ...pack,
      isPopular: i === index,
    }));
    onChangePacks(updated);
  };

  const handleRemovePack = (index) => {
    onChangePacks(packs.filter((_, i) => i !== index));
  };

  const handleMovePack = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= packs.length) return;
    const copy = [...packs];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    onChangePacks(copy);
  };

  const selectedPreviewPack = packs.find((p) => p.isPopular) || packs[0] || null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-6">
      {/* Sélecteur de méthode de vente */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span>🏷️</span> Méthode de vente & Tarification
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Choisissez comment les clients achètent ce produit sur votre boutique.
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-gray-100 p-1 border border-gray-200">
            <button
              type="button"
              onClick={() => onChangePricingMethod('standard')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                pricingMethod === 'standard'
                  ? 'bg-white text-blue-700 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              1. Vente Standard (+/-)
            </button>
            <button
              type="button"
              onClick={() => {
                onChangePricingMethod('pack');
                if (!packs || packs.length === 0) {
                  handleGenerateDefaultPacks();
                }
              }}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                pricingMethod === 'pack'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>🎁</span>
              2. Vente par Pack (Offres par lot)
            </button>
          </div>
        </div>

        {pricingMethod === 'standard' ? (
          <div className="p-4 mt-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-xs text-gray-600 flex items-start gap-3">
            <span className="text-lg">ℹ️</span>
            <div>
              <p className="font-semibold text-gray-800">Mode Standard activé</p>
              <p className="mt-0.5 text-gray-500">
                L'acheteur choisit librement sa quantité via les boutons (+) et (-) et choisit ses tailles et couleurs. Le prix unitaire défini ci-dessus s'applique.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 mt-3 bg-blue-50/70 rounded-lg border border-blue-200 text-xs text-blue-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">✨</span>
              <div>
                <p className="font-bold text-blue-950">
                  Mode Pack activé (Offres promotionnelles par paliers)
                </p>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Les clients verront des cartes de sélection attractives (comme sur votre image) avec prix d'origine barré, remise en % et prix après remise.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateDefaultPacks}
              className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <SparklesIcon className="w-4 h-4" />
              Générer les packs (1, 2, 3, 4)
            </button>
          </div>
        )}
      </div>

      {/* Configuration détaillée des packs si mode Pack actif */}
      {pricingMethod === 'pack' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800">
                Paliers de packs configurés ({packs.length})
              </h4>
              <button
                type="button"
                onClick={handleAddPack}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                Ajouter un palier
              </button>
            </div>

            {packs.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Aucun palier de pack configuré.</p>
                <button
                  type="button"
                  onClick={handleGenerateDefaultPacks}
                  className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                >
                  ⚡ Cliquer ici pour générer les 4 packs recommandés
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {packs.map((pack, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition-all ${
                      pack.isPopular
                        ? 'border-gray-900 bg-gray-50/80 shadow-sm ring-1 ring-gray-900/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-gray-900">
                          {pack.title || `Pack #${idx + 1}`}
                        </span>
                        {pack.isPopular && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-900 text-white">
                            <CheckBadgeIcon className="w-3 h-3 text-yellow-400" />
                            Pack sélectionné par défaut
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleSetPopular(idx)}
                          className={`text-xs px-2.5 py-1 rounded-md font-semibold border transition-all ${
                            pack.isPopular
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {pack.isPopular ? '✓ Sélectionné' : 'Définir par défaut'}
                        </button>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMovePack(idx, -1)}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="Monter"
                        >
                          <ChevronUpIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === packs.length - 1}
                          onClick={() => handleMovePack(idx, 1)}
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          title="Descendre"
                        >
                          <ChevronDownIcon className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePack(idx)}
                          className="p-1 text-red-500 hover:text-red-700"
                          title="Supprimer ce palier"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Quantité d'articles *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={pack.quantity}
                          onChange={(e) =>
                            handleUpdatePack(idx, 'quantity', parseInt(e.target.value, 10) || 1)
                          }
                          className="w-full text-xs font-bold border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div className="col-span-1 sm:col-span-2">
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Nom / Titre du pack *
                        </label>
                        <input
                          type="text"
                          value={pack.title}
                          onChange={(e) => handleUpdatePack(idx, 'title', e.target.value)}
                          placeholder="ex: 4 Pull"
                          className="w-full text-xs font-bold border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Prix avant remise (DT)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={pack.originalPrice || ''}
                          onChange={(e) => handleUpdatePack(idx, 'originalPrice', e.target.value)}
                          placeholder="ex: 132"
                          className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500 text-gray-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Remise (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={pack.discount || ''}
                          onChange={(e) => handleUpdatePack(idx, 'discount', e.target.value)}
                          placeholder="ex: 27"
                          className="w-full text-xs font-bold text-green-700 border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-900 mb-1">
                          Prix final du pack (DT) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={pack.price}
                          onChange={(e) => handleUpdatePack(idx, 'price', e.target.value)}
                          placeholder="ex: 97"
                          className="w-full text-xs font-black text-gray-900 bg-yellow-50/50 border border-yellow-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Texte du badge promo vert
                        </label>
                        <input
                          type="text"
                          value={pack.badge || ''}
                          onChange={(e) => handleUpdatePack(idx, 'badge', e.target.value)}
                          placeholder="ex: 27% REMISE!"
                          className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1">
                          Description courte (optionnelle)
                        </label>
                        <input
                          type="text"
                          value={pack.description || ''}
                          onChange={(e) => handleUpdatePack(idx, 'description', e.target.value)}
                          placeholder="ex: Économisez 35 DT"
                          className="w-full text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Preview interactive dans l'Admin */}
          {packs.length > 0 && (
            <div className="bg-gray-100/80 rounded-2xl p-5 border border-gray-300/80 shadow-inner">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                  <span>📱</span> Aperçu en direct (rendu client sur la boutique)
                </h4>
                <span className="text-[11px] font-medium text-gray-500">
                  Cliquez pour tester l'effet sélectionné
                </span>
              </div>

              <div className="max-w-md mx-auto bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <ProductPackSelector
                  packs={packs}
                  selectedPackId={selectedPreviewPack?._id || selectedPreviewPack?.title}
                  onSelectPack={(pack) => {
                    const idx = packs.findIndex((p) => (p._id && p._id === pack._id) || p.title === pack.title);
                    if (idx >= 0) handleSetPopular(idx);
                  }}
                  currency="DT"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductPackManager;
