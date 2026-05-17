import { Question } from './supabase';

/**
 * Deterministic question generator for vocab.
 * Pure functions, no side effects.
 */

export interface VocabRow {
  id?: string;
  term: string;
  meaning: string;
  extra_fields?: Record<string, any>;
  metadata?: Record<string, any>;
  image_keyword?: string;
}

export interface GenConfig {
  count: number;
  direction: 'term_to_meaning' | 'meaning_to_term' | 'both' | 'general';
}

export interface GeneratedMCQ {
  prompt: string;
  answer: string;
  distractors: [string, string, string];
  direction: 'term_to_meaning' | 'meaning_to_term' | 'ar_to_ms' | 'ms_to_ar' | 'general';
  source_vocab_id?: string;
  metadata: { 
    image_keyword?: string;
    [key: string]: any;
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

  const pool: { vocab: VocabRow; direction: 'term_to_meaning' | 'meaning_to_term' }[] = [];

  library.forEach(vocab => {
    if (config.direction === 'term_to_meaning' || config.direction === 'both') {
      pool.push({ vocab, direction: 'term_to_meaning' });
    }
    if (config.direction === 'meaning_to_term' || config.direction === 'both') {
      pool.push({ vocab, direction: 'meaning_to_term' });
    }
  });

  const shuffledPool = shuffleArray(pool);
  const selected = shuffledPool.slice(0, config.count);

  const termPool = library.map(v => v.term);
  const meaningPool = library.map(v => v.meaning);

  return selected.map(entry => {
    const { vocab, direction } = entry;
    let prompt = '';
    let answer = '';
    let distractors: [string, string, string];

    if (direction === 'term_to_meaning') {
      prompt = vocab.term;
      answer = vocab.meaning;
      distractors = pickDistractors(meaningPool, answer);
    } else {
      prompt = vocab.meaning;
      answer = vocab.term;
      distractors = pickDistractors(termPool, answer);
    }

    return {
      prompt,
      answer,
      distractors,
      direction,
      source_vocab_id: vocab.id,
      metadata: {
        ...(vocab.metadata || {}),
        image_keyword: vocab.image_keyword,
        ...(vocab.extra_fields || {})
      }
    };
  });
}
