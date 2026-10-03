/** Noms alignés sur la liste Fiabilo (fiabilo.tn) */
export const TUNISIA_GOVERNORATES = [
  'Ariana',
  'Beja',
  'Ben Arous',
  'Bizerte',
  'Gabes',
  'Gafsa',
  'Jendouba',
  'Kairouan',
  'Kasserine',
  'Kebili',
  'LE Kef',
  'Mahdia',
  'Mannouba',
  'Medenine',
  'Monastir',
  'Nabeul',
  'Sfax',
  'Sidi Bouzid',
  'Siliana',
  'Sousse',
  'Tataouine',
  'Tozeur',
  'Tunis',
  'Zaghouan',
];

export const DEFAULT_GOVERNORATE = 'Monastir';
export const DEFAULT_CITY = '';

/** Libellés arabes (affichage uniquement — la valeur envoyée reste le nom Fiabilo) */
export const GOVERNORATE_LABELS_AR = {
  Ariana: 'أريانة',
  Beja: 'باجة',
  'Ben Arous': 'بن عروس',
  Bizerte: 'بنزرت',
  Gabes: 'قابس',
  Gafsa: 'قفصة',
  Jendouba: 'جندوبة',
  Kairouan: 'القيروان',
  Kasserine: 'القصرين',
  Kebili: 'قبلي',
  'LE Kef': 'الكاف',
  Mahdia: 'المهدية',
  Mannouba: 'منوبة',
  Medenine: 'مدنين',
  Monastir: 'المنستير',
  Nabeul: 'نابل',
  Sfax: 'صفاقس',
  'Sidi Bouzid': 'سيدي بوزيد',
  Siliana: 'سليانة',
  Sousse: 'سوسة',
  Tataouine: 'تطاوين',
  Tozeur: 'توزر',
  Tunis: 'تونس',
  Zaghouan: 'زغوان',
};

export const getGovernorateLabel = (gov, lang) =>
  (lang === 'ar' && GOVERNORATE_LABELS_AR[gov]) || gov;
