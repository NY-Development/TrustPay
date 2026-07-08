/**
 * Response Normalizer — Date, Currency, Merchant Normalization
 *
 * Cleans and standardizes AI-generated field values.
 */

/**
 * Normalize date strings into ISO 8601 (YYYY-MM-DD) format.
 */
export function normalizeDate(input: string): string {
  if (!input) return new Date().toISOString().split('T')[0];

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
    return input.split('T')[0];
  }

  // Common Ethiopian date formats: DD/MM/YYYY, MM/DD/YYYY
  const slashMatch = input.match(/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/);
  if (slashMatch) {
    const [, a, b, year] = slashMatch;
    const day = parseInt(a) > 12 ? a : b;
    const month = parseInt(a) > 12 ? b : a;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try native Date parser as last resort
  try {
    const d = new Date(input);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch { /* noop */ }

  return new Date().toISOString().split('T')[0];
}

/**
 * Normalize currency codes to uppercase 3-letter format.
 * Default to ETB for Ethiopian context.
 */
export function normalizeCurrency(input: string): string {
  if (!input) return 'ETB';
  const cleaned = input.trim().toUpperCase();

  const aliases: Record<string, string> = {
    'BIRR': 'ETB', 'BR': 'ETB', 'ET': 'ETB',
    'DOLLAR': 'USD', '$': 'USD', 'US$': 'USD',
    'EURO': 'EUR', '€': 'EUR',
    'POUND': 'GBP', '£': 'GBP',
  };

  return aliases[cleaned] || (cleaned.length === 3 ? cleaned : 'ETB');
}

/**
 * Normalize merchant names: trim, capitalize, clean duplicates.
 */
export function normalizeMerchant(input: string): string {
  if (!input) return 'Unknown Merchant';

  let name = input.trim()
    .replace(/\s+/g, ' ') // collapse whitespace
    .replace(/[^\w\s\-.'&]/g, ''); // remove special chars

  // Title case
  name = name.replace(/\b\w/g, c => c.toUpperCase());

  return name || 'Unknown Merchant';
}

/**
 * Normalize a confidence score to 0.0–1.0 range.
 */
export function normalizeConfidence(input: number | string | undefined): number {
  if (input === undefined || input === null) return 0.5;
  const num = typeof input === 'string' ? parseFloat(input) : input;
  if (isNaN(num)) return 0.5;
  if (num > 1 && num <= 100) return num / 100;
  return Math.max(0, Math.min(1, num));
}

/**
 * Normalize a total amount — handle commas, whitespace, currency symbols.
 */
export function normalizeAmount(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number') return isNaN(input) ? null : input;

  const cleaned = input.replace(/[^0-9.,\-]/g, '').replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
