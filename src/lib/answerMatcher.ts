import { SubjectFieldSchema } from './subjectPresets';

/**
 * Standardized answer comparison for different subject types.
 */
export function isAnswerCorrect(
  userInput: string,
  correctAnswer: string,
  schema: SubjectFieldSchema
): boolean {
  const normalize = (s: string) => s.trim().toLowerCase();
  
  const normInput = normalize(userInput);
  const normTarget = normalize(correctAnswer);

  // For Arabic/Jawi subjects: strip harakat before comparing
  // (students often can't type harakat easily)
  if (schema.term_font === 'arabic' || schema.term_font === 'jawi' || schema.rtl) {
    const stripHarakat = (s: string) => 
      s.replace(/[\u064B-\u0652\u0670\u0640]/g, '')
       .replace(/\u0621/g, "\u0627"); // Basic normalization
    
    return stripHarakat(normInput) === stripHarakat(normTarget);
  }
  
  return normInput === normTarget;
}
