/**
 * Spaced Repetition System logic using SM-2 algorithm.
 */

export interface SRSResult {
  ease: number;
  interval_days: number;
  next_review: string;
  consecutive_correct: number;
}

export const sm2 = (
  isCorrect: boolean,
  currentEase: number = 2.5,
  currentInterval: number = 0,
  consecutiveCorrect: number = 0
): SRSResult => {
  let ease = currentEase;
  let intervalDays = currentInterval;
  let nextConsecutiveCorrect = consecutiveCorrect;

  if (isCorrect) {
    nextConsecutiveCorrect++;
    
    if (nextConsecutiveCorrect === 1) {
      intervalDays = 1;
    } else if (nextConsecutiveCorrect === 2) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * ease);
    }
  } else {
    nextConsecutiveCorrect = 0;
    intervalDays = 1;
    // Lower ease for mistakes, but not below 1.3
    ease = Math.max(1.3, ease - 0.2);
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + intervalDays);

  return {
    ease,
    interval_days: intervalDays,
    next_review: nextReview.toISOString(),
    consecutive_correct: nextConsecutiveCorrect
  };
};
