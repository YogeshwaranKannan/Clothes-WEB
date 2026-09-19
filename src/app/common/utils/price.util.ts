export function parseMoneyToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;

  // Already number
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  let s = String(value).trim();

  // remove commas and spaces
  s = s.replace(/[\s,]/g, '');

  // keep only digits and dots
  s = s.replace(/[^\d.]/g, '');

  // if multiple dots exist, keep only the LAST dot as decimal separator
  const parts = s.split('.');
  if (parts.length > 2) {
    s = parts.slice(0, -1).join('') + '.' + parts[parts.length - 1];
  }

  // remove leading dot if any: ".48929.00" -> "48929.00"
  if (s.startsWith('.')) s = s.slice(1);

  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}