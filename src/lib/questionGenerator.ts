import { Question, QuestionType } from './supabase';

/**
 * Deterministic question generator for vocab.
 * Generates MCQs from word pairs.
 */

export interface VocabRow {
  arabic: string;
  transliteration: string;
  meaning_ms: string;
  image_keyword?: string;
}

export const generateMcqsFromVocab = (
  topicId: string,
  vocab: VocabRow[],
  userId: string
): Partial<Question>[] => {
  const questions: Partial<Question>[] = [];
  const minRequiredForDistractors = 4;

  vocab.forEach((row, index) => {
    // 1. Arabic -> Malay
    const distractorsMs = vocab
      .filter((_, i) => i !== index)
      .map(v => v.meaning_ms)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    if (distractorsMs.length >= 1) {
      questions.push({
        topic_id: topicId,
        question_type: 'multiple_choice',
        prompt: row.arabic,
        answer: row.meaning_ms,
        arabic: row.arabic,
        transliteration: row.transliteration, // Stored but not shown in prompt
        distractors: distractorsMs,
        metadata: {
          direction: 'ar_to_ms',
          image_keyword: row.image_keyword
        },
        created_by: userId
      });
    }

    // 2. Malay -> Arabic
    const distractorsAr = vocab
      .filter((_, i) => i !== index)
      .map(v => v.arabic)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    if (distractorsAr.length >= 1) {
      questions.push({
        topic_id: topicId,
        question_type: 'multiple_choice',
        prompt: row.meaning_ms,
        answer: row.arabic,
        arabic: row.arabic,
        transliteration: row.transliteration,
        distractors: distractorsAr,
        metadata: {
          direction: 'ms_to_ar',
          image_keyword: row.image_keyword
        },
        created_by: userId
      });
    }
  });

  return questions;
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
