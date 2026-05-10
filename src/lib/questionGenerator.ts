import { Question } from './supabase';

/**
 * Deterministic question generator for vocab.
 * Pure functions, no side effects.
 */

export interface VocabRow {
  id?: string;
  arabic: string;
  meaning_ms: string;
  transliteration?: string;
  image_keyword?: string;
}

export interface GenConfig {
  count: number;
  direction: 'ar_to_ms' | 'ms_to_ar' | 'both';
}

export interface GeneratedMCQ {
  prompt: string;
  answer: string;
  distractors: [string, string, string];
  direction: 'ar_to_ms' | 'ms_to_ar';
  source_vocab_id: string;
  metadata: { 
    image_keyword?: string;
    transliteration?: string;
  };
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const pickDistractors = (pool: string[], answer: string): [string, string, string] => {
  const filtered = pool.filter(item => item !== answer);
  const shuffled = shuffleArray([...new Set(filtered)]);
  
  if (shuffled.length < 3) {
    // If we don't have enough variety, we might have to pad or it will be easy
    // But per spec, library.length >= 4 ensures 3 distractors
    return [
      shuffled[0] || '---',
      shuffled[1] || '---',
      shuffled[2] || '---'
    ];
  }
  
  return [shuffled[0], shuffled[1], shuffled[2]];
};

export function generateMCQs(
  library: VocabRow[], 
  config: GenConfig
): GeneratedMCQ[] {
  if (library.length < 4) {
    throw new Error('Pustaka kosa kata memerlukan sekurang-kurangnya 4 perkataan untuk menjana soalan.');
  }

  const pool: { vocab: VocabRow; direction: 'ar_to_ms' | 'ms_to_ar' }[] = [];

  library.forEach(vocab => {
    if (config.direction === 'ar_to_ms' || config.direction === 'both') {
      pool.push({ vocab, direction: 'ar_to_ms' });
    }
    if (config.direction === 'ms_to_ar' || config.direction === 'both') {
      pool.push({ vocab, direction: 'ms_to_ar' });
    }
  });

  const shuffledPool = shuffleArray(pool);
  const selected = shuffledPool.slice(0, config.count);

  const arabicPool = library.map(v => v.arabic);
  const malayPool = library.map(v => v.meaning_ms);

  return selected.map(entry => {
    const { vocab, direction } = entry;
    let prompt = '';
    let answer = '';
    let distractors: [string, string, string];

    if (direction === 'ar_to_ms') {
      prompt = vocab.arabic;
      answer = vocab.meaning_ms;
      distractors = pickDistractors(malayPool, answer);
    } else {
      prompt = vocab.meaning_ms;
      answer = vocab.arabic;
      distractors = pickDistractors(arabicPool, answer);
    }

    return {
      prompt,
      answer,
      distractors,
      direction,
      source_vocab_id: vocab.id,
      metadata: {
        image_keyword: vocab.image_keyword,
        transliteration: vocab.transliteration
      }
    };
  });
}
