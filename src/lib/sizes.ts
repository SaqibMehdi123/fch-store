/**
 * Canonical size display order (shared client/server — no server imports).
 * Anything not in the list sorts alphabetically to the end.
 */
export const SIZE_ORDER = [
  "S", "M", "L", "XL", "XXL",
  "One Size",
  "30", "32", "34", "36", "38", "40",
  "2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y",
];

const RANK = new Map(SIZE_ORDER.map((s, i) => [s, i]));

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort(
    (a, b) => (RANK.get(a) ?? 999) - (RANK.get(b) ?? 999) || a.localeCompare(b)
  );
}
