/** Sort clothing sizes from smallest to largest */
const SIZE_ORDER: Record<string, number> = {
  'XXS': 1, '2XS': 1,
  'XS': 2,
  'S': 3,
  'M': 4,
  'L': 5,
  'XL': 6,
  'XXL': 7, '2XL': 7,
  '3XL': 8, 'XXXL': 8,
  '4XL': 9, 'XXXXL': 9,
  '5XL': 10,
  '6XL': 11,
};

export function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const aOrder = SIZE_ORDER[a.toUpperCase()] ?? 99;
    const bOrder = SIZE_ORDER[b.toUpperCase()] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.localeCompare(b, 'fi', { numeric: true });
  });
}
