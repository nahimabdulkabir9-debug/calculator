export const MAX_ENTRY_DIGITS = 12;
export const MAX_SIGNIFICANT_DIGITS = 12;

/**
 * Rounds a number to a sane precision and rejects anything that is not finite.
 * Returns null when the value cannot be displayed (Infinity, NaN, ...).
 */
export function normalizeNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const rounded = Number.parseFloat(value.toPrecision(MAX_SIGNIFICANT_DIGITS));
  if (!Number.isFinite(rounded)) return null;
  return Object.is(rounded, -0) ? 0 : rounded;
}

/**
 * Converts a computed number into the raw string held by the calculator entry.
 */
export function numberToEntry(value) {
  const normalized = normalizeNumber(value);
  if (normalized === null) return '0';
  return String(normalized);
}

/**
 * Formats a raw entry string for display: thousands separators, preserved
 * trailing decimal point, exponent notation passed through untouched.
 */
export function formatDisplay(value) {
  const raw = String(value ?? '0');
  if (raw === '' || raw === '.' || raw === '-.') return '0';

  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(raw);
  if (!match) return raw;

  const [, sign, intPart = '', frac, exponent] = match;
  let out = `${sign}${groupDigits(intPart || '0')}`;
  if (raw.includes('.')) out += `.${frac ?? ''}`;
  if (exponent !== undefined) out += `e${exponent}`;
  return out;
}

function groupDigits(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
