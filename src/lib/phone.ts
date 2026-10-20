export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function formatPhone(digits: string): string {
  const match = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits);
  return match ? `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}` : `+${digits}`;
}
