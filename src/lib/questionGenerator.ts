import { Question, QuestionType } from './supabase';

/**
 * Deterministic question generator for vocab.
 * Generates MCQs from word pairs.
 */

export interface VocabRow {
  arabic: string;
  transliteration: string;
  meaning_en?: string;
  meaning_ms: string;
  image_keyword?: string;
}

const pickRandom = (pool: string[], count: number, exclude: string[]): string[] => {
  const filtered = pool.filter(item => !exclude.includes(item));
  const shuffled = [...filtered].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

/**
 * Shuffles an array and returns a new one.
 */
const shuffleArray = <T>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const generateMcqsFromVocab = (
  topicId: string,
  vocab: VocabRow[],
  userId: string,
  limit: number = 20
): Partial<Question>[] => {
  const questions: Partial<Question>[] = [];
  const arabicPool = vocab.map(v => v.arabic);
  const meaningPool = vocab.map(v => v.meaning_ms);

  // We want to generate Shape A (Ar -> Ms) and Shape B (Ms -> Ar)
  // Shuffling the vocab first ensures variety if we hit the limit early
  const shuffledVocab = shuffleArray(vocab);
  
  for (const row of shuffledVocab) {
    if (questions.length >= limit) break;

    const distractorCount = Math.min(3, vocab.length - 1);
    if (distractorCount < 1) continue;

    // Shape A: Arabic -> Malay
    questions.push({
      topic_id: topicId,
      question_type: 'multiple_choice',
      prompt: row.arabic,
      answer: row.meaning_ms,
      arabic: row.arabic,
      transliteration: row.transliteration, 
      distractors: pickRandom(meaningPool, distractorCount, [row.meaning_ms]),
      metadata: {
        direction: 'ar_to_ms',
        image_keyword: row.image_keyword
      },
      created_by: userId
    });

    if (questions.length >= limit) break;

    // Shape B: Malay -> Arabic
    questions.push({
      topic_id: topicId,
      question_type: 'multiple_choice',
      prompt: row.meaning_ms,
      answer: row.arabic,
      arabic: row.arabic,
      transliteration: row.transliteration,
      distractors: pickRandom(arabicPool, distractorCount, [row.arabic]),
      metadata: {
        direction: 'ms_to_ar',
        image_keyword: row.image_keyword
      },
      created_by: userId
    });
  }

  // Final shuffle and slice to strictly honor limit
  return shuffleArray(questions).slice(0, limit);
};

/**
 * Create flashcards from vocab.
 */
export const generateFlashcardsFromVocab = (
  topicId: string,
  vocab: VocabRow[],
  userId: string
): Partial<Question>[] => {
  return vocab.map(row => ({
    topic_id: topicId,
    question_type: 'flashcard',
    prompt: row.meaning_ms,
    answer: row.arabic,
    arabic: row.arabic,
    transliteration: row.transliteration,
    distractors: [],
    metadata: {
      image_keyword: row.image_keyword
    },
    created_by: userId
  }));
};
