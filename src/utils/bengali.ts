const BENGALI_TO_ENGLISH_DIGITS: Record<string, string> = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
};

/**
 * Converts Bengali digits (০-৯) in a string to English digits (0-9).
 */
export function normalizeBengaliNumerals(str: string): string {
  if (!str) return '';
  return str.replace(/[০-৯]/g, (digit) => BENGALI_TO_ENGLISH_DIGITS[digit] ?? digit);
}

/**
 * Converts Bengali digits and normalizes Bangladeshi phone numbers to standard 11 digits (e.g. 01712345678).
 * Strips formatting, spaces, dashes, and handles +880 / 880 prefix.
 */
export function normalizeBdMobile(str: string): string {
  if (!str) return '';
  let cleaned = normalizeBengaliNumerals(str).replace(/\D/g, '');
  if (cleaned.startsWith('8801') && cleaned.length === 13) {
    cleaned = cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Checks if a string is a valid 11-digit Bangladeshi mobile number starting with 013-019.
 */
export function isValidBdMobile(str: string): boolean {
  const norm = normalizeBdMobile(str);
  return /^01[3-9]\d{8}$/.test(norm);
}
