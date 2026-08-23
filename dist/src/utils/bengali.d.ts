/**
 * Converts Bengali digits (০-৯) in a string to English digits (0-9).
 */
export declare function normalizeBengaliNumerals(str: string): string;
/**
 * Converts Bengali digits and normalizes Bangladeshi phone numbers to standard 11 digits (e.g. 01712345678).
 * Strips formatting, spaces, dashes, and handles +880 / 880 prefix.
 */
export declare function normalizeBdMobile(str: string): string;
/**
 * Checks if a string is a valid 11-digit Bangladeshi mobile number starting with 013-019.
 */
export declare function isValidBdMobile(str: string): boolean;
//# sourceMappingURL=bengali.d.ts.map