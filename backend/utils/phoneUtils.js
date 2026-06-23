function normalizeGuestPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length >= 8) {
    return digits.slice(-8);
  }
  return digits;
}

module.exports = { normalizeGuestPhone };
