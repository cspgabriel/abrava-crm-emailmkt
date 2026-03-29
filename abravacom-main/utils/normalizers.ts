export const normalizeEmail = (email: string) => {
  if (!email) return '';
  return email.trim().toLowerCase();
};

export const normalizePhone = (phone: string) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};
