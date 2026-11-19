export const BUSINESS_CATEGORIES = [
  {
    value: 'electrical',
    label: 'Electrical shop',
    paths: ['M13 2 4 14h7l-1 8 10-13h-7l1-7z'],
  },
  {
    value: 'grocery',
    label: 'Grocery / general store',
    paths: [
      'M3 3h2l2.2 11.2a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.4L22 7H6',
      'M10 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
      'M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    ],
  },
  {
    value: 'clothing',
    label: 'Clothing / fashion',
    paths: ['m16 4 5 3-3 5-3-2v11H9V10L6 12 3 7l5-3a4 4 0 0 0 8 0z'],
  },
  {
    value: 'pharmacy',
    label: 'Pharmacy / healthcare',
    paths: ['M5 5h14v14H5z', 'M12 8v8', 'M8 12h8'],
  },
  {
    value: 'electronics',
    label: 'Electronics',
    paths: ['M3 4h18v13H3z', 'M8 21h8', 'M12 17v4'],
  },
  {
    value: 'restaurant',
    label: 'Restaurant / food',
    paths: ['M7 3v7', 'M4 3v4a3 3 0 0 0 6 0V3', 'M7 10v11', 'M17 3v18', 'M17 3c3 2 3 7 0 9'],
  },
  {
    value: 'general',
    label: 'Other business',
    paths: ['M3 10 5 4h14l2 6', 'M5 10v10h14V10', 'M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0', 'M10 20v-5h4v5'],
  },
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number]['value'];

export function getBusinessCategory(value?: string | null) {
  return BUSINESS_CATEGORIES.find((category) => category.value === value) ?? BUSINESS_CATEGORIES[6];
}
