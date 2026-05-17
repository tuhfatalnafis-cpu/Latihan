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
  formats: ('multiple_choice' | 'matching' | 'fill_blank' | 'true_false' | 'flashcard')[];
  direction?: 'term_to_meaning' | 'meaning_to_term' | 'both';
  matching_pairs_count?: number;
  include_false_variants?: boolean;
}

export interface GeneratedQuestion {
  question_type: 'multiple_choice' | 'matching' | 'fill_blank' | 'true_false' | 'flashcard';
  prompt: string;
  answer: string;
  explanation?: string;
  distractors: string[];
  direction: 'term_to_meaning' | 'meaning_to_term' | 'ar_to_ms' | 'ms_to_ar' | 'general';
  source_vocab_id?: string;
  metadata: { 
    image_keyword?: string;
    pairs?: { left: string; right: string }[];
    term?: string;
    stated_meaning?: string;
    actual_meaning?: string;
    [key: string]: any;
  };
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

const pickDistractors = (pool: string[], answer: string, count = 3): string[] => {
  const filtered = pool.filter(item => item !== answer);
  const shuffled = shuffleArray([...new Set(filtered)]);
  return shuffled.slice(0, count);
};

export function generateQuestions(
  library: VocabRow[],
  config: GenConfig
): GeneratedQuestion[] {
  if (library.length < 4) {
    throw new Error('Pustaka kosa kata memerlukan sekurang-kurangnya 4 perkataan untuk menjana soalan.');
  }

  const formats = config.formats || ['multiple_choice'];
  const results: GeneratedQuestion[] = [];
  const questionsPerFormat = Math.floor(config.count / formats.length);

  formats.forEach((format) => {
    let formatCount = questionsPerFormat;
    // Add remainder to the first format
    if (results.length === 0) formatCount += config.count % formats.length;

    if (format === 'multiple_choice') {
      results.push(...generateMCQBatch(library, formatCount, config.direction || 'both'));
    } else if (format === 'matching') {
      results.push(...generateMatchingBatch(library, formatCount, config.matching_pairs_count || 6));
    } else if (format === 'fill_blank') {
      results.push(...generateFillBlankBatch(library, formatCount, config.direction || 'both'));
    } else if (format === 'true_false') {
      results.push(...generateTrueFalseBatch(library, formatCount, config.include_false_variants !== false));
    } else if (format === 'flashcard') {
      results.push(...generateFlashcardBatch(library, formatCount));
    }
  });

  return shuffleArray(results);
}

function generateMCQBatch(library: VocabRow[], count: number, direction: 'term_to_meaning' | 'meaning_to_term' | 'both'): GeneratedQuestion[] {
  const pool: { vocab: VocabRow; direction: 'term_to_meaning' | 'meaning_to_term' }[] = [];
  library.forEach(vocab => {
    if (direction === 'term_to_meaning' || direction === 'both') pool.push({ vocab, direction: 'term_to_meaning' });
    if (direction === 'meaning_to_term' || direction === 'both') pool.push({ vocab, direction: 'meaning_to_term' });
  });

  const selected = shuffleArray(pool).slice(0, count);
  const termPool = library.map(v => v.term);
  const meaningPool = library.map(v => v.meaning);

  return selected.map(entry => {
    const { vocab, direction } = entry;
    const prompt = direction === 'term_to_meaning' ? vocab.term : vocab.meaning;
    const answer = direction === 'term_to_meaning' ? vocab.meaning : vocab.term;
    const distractors = pickDistractors(direction === 'term_to_meaning' ? meaningPool : termPool, answer);

    return {
      question_type: 'multiple_choice',
      prompt,
      answer,
      explanation: `${vocab.term} bermaksud ${vocab.meaning}`,
      distractors,
      direction,
      source_vocab_id: vocab.id,
      metadata: { ...vocab.metadata, image_keyword: vocab.image_keyword, ...vocab.extra_fields }
    };
  });
}

function generateMatchingBatch(library: VocabRow[], count: number, pairsPerQuestion: number): GeneratedQuestion[] {
  const batches = [];
  for (let i = 0; i < count; i++) {
    const selected = shuffleArray(library).slice(0, pairsPerQuestion);
    if (selected.length < 2) continue;

    batches.push({
      question_type: 'matching' as const,
      prompt: "Padankan istilah dengan maksudnya",
      answer: "", // Unused
      distractors: [],
      direction: 'term_to_meaning' as const,
      metadata: {
        pairs: selected.map(v => ({ left: v.term, right: v.meaning }))
      }
    });
  }
  return batches;
}

function generateFillBlankBatch(library: VocabRow[], count: number, direction: 'term_to_meaning' | 'meaning_to_term' | 'both'): GeneratedQuestion[] {
  const pool: { vocab: VocabRow; direction: 'term_to_meaning' | 'meaning_to_term' }[] = [];
  library.forEach(vocab => {
    if (direction === 'term_to_meaning' || direction === 'both') pool.push({ vocab, direction: 'term_to_meaning' });
    if (direction === 'meaning_to_term' || direction === 'both') pool.push({ vocab, direction: 'meaning_to_term' });
  });

  return shuffleArray(pool).slice(0, count).map(entry => ({
    question_type: 'fill_blank' as const,
    prompt: entry.direction === 'term_to_meaning' ? entry.vocab.term : entry.vocab.meaning,
    answer: entry.direction === 'term_to_meaning' ? entry.vocab.meaning : entry.vocab.term,
    explanation: `${entry.vocab.term} bermaksud ${entry.vocab.meaning}`,
    distractors: [],
    direction: entry.direction,
    source_vocab_id: entry.vocab.id,
    metadata: { ...entry.vocab.metadata, image_keyword: entry.vocab.image_keyword, ...entry.vocab.extra_fields }
  }));
}

function generateTrueFalseBatch(library: VocabRow[], count: number, includeFalse: boolean): GeneratedQuestion[] {
  const pool = shuffleArray(library);
  const results: GeneratedQuestion[] = [];
  const meanings = library.map(l => l.meaning);

  for (let i = 0; i < count; i++) {
    const vocab = pool[i % pool.length];
    const isTrue = includeFalse ? Math.random() > 0.5 : true;
    
    let statedMeaning = vocab.meaning;
    if (!isTrue) {
      const otherMeanings = meanings.filter(m => m !== vocab.meaning);
      statedMeaning = otherMeanings[Math.floor(Math.random() * otherMeanings.length)] || "Salah";
    }

    results.push({
      question_type: 'true_false' as const,
      prompt: `Adakah '${vocab.term}' bermaksud '${statedMeaning}'?`,
      answer: isTrue ? 'true' : 'false',
      explanation: `${vocab.term} bermaksud ${vocab.meaning}`,
      distractors: [],
      direction: 'term_to_meaning' as const,
      source_vocab_id: vocab.id,
      metadata: {
        term: vocab.term,
        stated_meaning: statedMeaning,
        actual_meaning: vocab.meaning,
        ...vocab.metadata,
        image_keyword: vocab.image_keyword
      }
    });
  }
  return results;
}

function generateFlashcardBatch(library: VocabRow[], count: number): GeneratedQuestion[] {
  return shuffleArray(library).slice(0, count).map(v => ({
    question_type: 'flashcard' as const,
    prompt: v.term,
    answer: v.meaning,
    explanation: `${v.term} bermaksud ${v.meaning}`,
    distractors: [],
    direction: 'term_to_meaning' as const,
    source_vocab_id: v.id,
    metadata: { ...v.metadata, image_keyword: v.image_keyword, ...v.extra_fields }
  }));
}

export function generateMCQs(
  library: VocabRow[], 
  config: { count: number; direction: 'term_to_meaning' | 'meaning_to_term' | 'both' | 'general' }
): GeneratedQuestion[] {
  return generateMCQBatch(library, config.count, config.direction === 'general' ? 'both' : config.direction);
}
