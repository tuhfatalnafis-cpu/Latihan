import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fixJawiSpelling(text: string): string {
  if (!text) return text;
  
  // Mapping of common Arabic characters used for Malay sounds to correct Jawi characters
  // Note: This is an auto-normalization, it might have false positives if Arabic words are mixed in
  // but for Jawi-centric content, it's usually what's intended.
  return text
    .replace(/\u062C/g, '\u0686') // Jim -> Ca (Commonly used if Ca is missing)
    .replace(/\u063A/g, '\u06A0') // Ghain -> Nga
    .replace(/\u0641/g, '\u06A4') // Fa -> Pa
    .replace(/\u0643/g, '\u06A2') // Kaf -> Ga
    .replace(/\u0648/g, (match, offset, str) => {
      // Very crude check for Va (ۏ) vs Wau (و). 
      // Hard to automate correctly, usually left for manual fix or specific keywords.
      return match;
    })
    .replace(/\u064A/g, (match, offset, str) => {
      // Nya (ڽ) vs Ya (ي). Also hard to automate.
      return match;
    });
}

export const JAWI_CHARS = {
  CA: '\u0686',
  NGA: '\u06A0',
  PA: '\u06A4',
  GA: '\u06A2',
  VA: '\u068F',
  NYA: '\u06BD',
};
