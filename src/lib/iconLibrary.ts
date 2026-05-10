/**
 * OpenMoji Icon Library for Cepat Belajar.
 * Maps keywords to Unicode hex codes for SVG retrieval.
 */

// Keyword to Hex map
// Pre-populated with some common furniture/household items for Arabic learning
const KEYWORD_MAP: Record<string, string> = {
  // Furniture
  'chair': '1F6BA',
  'table': '1FA1A',
  'bed': '1F6CF',
  'lamp': '1F4A1',
  'desk': '1F5A5',
  'sofa': '1F6CB',
  'door': '1F6AA',
  'window': '1FA9F',
  'fridge': '1F9CA',
  'box': '1F4E6',
  
  // Kitchen
  'spoon': '1F944',
  'fork': '1F374',
  'knife': '1F52A',
  'plate': '1F37D',
  'cup': '1F964',
  
  // School
  'book': '1F4D6',
  'pen': '1F58B',
  'pencil': '270F',
  'clock': '1F552',
  'bag': '1F392',
  'computer': '1F4BB',
  
  // Family
  'mother': '1F469',
  'father': '1F468',
  'brother': '1F466',
  'sister': '1F467',
  'baby': '1F476'
};

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/openmoji@latest/color/svg/';

export const getIconUrl = (keyword: string): string | null => {
  if (!keyword) return null;
  const hex = KEYWORD_MAP[keyword.toLowerCase().trim()];
  if (!hex) return null;
  return `${CDN_BASE}${hex}.svg`;
};

/**
 * Extends the library with new unmapped keywords (if needed at runtime).
 */
export const registerKeyword = (keyword: string, hex: string) => {
  KEYWORD_MAP[keyword.toLowerCase()] = hex;
};
