import { SubjectFieldSchema, DEFAULT_SCHEMA } from './subjectPresets';

export function getTermLabel(schema?: SubjectFieldSchema): string {
  return schema?.term_label || DEFAULT_SCHEMA.term_label;
}

export function getMeaningLabel(schema?: SubjectFieldSchema): string {
  return schema?.meaning_label || DEFAULT_SCHEMA.meaning_label;
}

export function isRTL(schema?: SubjectFieldSchema): boolean {
  return schema?.rtl || false;
}

export function getTermFontClass(schema?: SubjectFieldSchema): string {
  if (schema?.term_font === 'arabic') return 'font-arabic';
  if (schema?.term_font === 'jawi') return 'font-arabic'; // Jawi uses same base font usually
  return '';
}

export function normalizeArabic(text: string): string {
  // Essential for old Arabic compatibility if needed
  return text
    .replace(/[\u064B-\u0652]/g, "") // Remove harakat
    .replace(/\u0621/g, "\u0627")   // Normalize hamza on alif variants if needed
    .trim();
}

export function compareTerms(input: string, target: string, schema?: SubjectFieldSchema): boolean {
  const normInput = input.trim().toLowerCase();
  const normTarget = target.trim().toLowerCase();

  if (schema?.rtl && schema?.term_font === 'arabic') {
    return normalizeArabic(normInput) === normalizeArabic(normTarget);
  }

  return normInput === normTarget;
}
