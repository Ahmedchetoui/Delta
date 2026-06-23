export function getFiabiloBadgeClass(category) {
  switch (category) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'in_transit':
      return 'bg-blue-100 text-blue-800';
    case 'return':
      return 'bg-orange-100 text-orange-800';
    case 'problem':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
