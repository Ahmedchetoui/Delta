const FIABILO_DELIVERED_STATES = new Set([
  'livré',
  'livre',
  'retour payé',
  'retour paye',
]);

const FIABILO_IN_TRANSIT_STATES = new Set([
  'en cours',
  'au magasin',
  'à enlever',
  'a enlever',
  'enlevé',
  'enleve',
  'échange',
  'echange',
]);

const FIABILO_RETURN_STATES = new Set([
  'retour au dépôt',
  'retour au depot',
  'retour définitif',
  'retour definitif',
  'retour reçu',
  'retour recu',
  'retour expéditeur',
  'retour expediteur',
  'retour payé',
  'retour paye',
]);

const FIABILO_PROBLEM_STATES = new Set([
  'non reçu',
  'non recu',
  'supprimé',
  'supprime',
  'inconnu',
  'à vérifier',
  'a verifier',
]);

function normalizeFiabiloState(state) {
  return String(state || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function getFiabiloStateCategory(state) {
  const normalized = normalizeFiabiloState(state);
  if (FIABILO_DELIVERED_STATES.has(normalized)) return 'delivered';
  if (FIABILO_RETURN_STATES.has(normalized)) return 'return';
  if (FIABILO_IN_TRANSIT_STATES.has(normalized)) return 'in_transit';
  if (FIABILO_PROBLEM_STATES.has(normalized)) return 'problem';
  if (normalized === 'en attente') return 'pending';
  return 'unknown';
}

module.exports = {
  getFiabiloStateCategory,
  normalizeFiabiloState,
};
