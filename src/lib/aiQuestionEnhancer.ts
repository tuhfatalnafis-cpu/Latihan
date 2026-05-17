import { GeneratedQuestion, VocabRow } from "./questionGenerator";

export async function enhanceDistractors(
  question: GeneratedQuestion,
  library: VocabRow[]
): Promise<string[] | null> {
  try {
    // Pick a pool of candidates from the library (same direction)
    const directionPool = library
      .map(v => (question.direction === 'term_to_meaning' || question.direction === 'ar_to_ms' ? v.meaning : v.term))
      .filter(val => val !== question.answer);
    
    // Shuffle and pick 15
    const shuffled = [...new Set(directionPool)].sort(() => Math.random() - 0.5);
    const candidates = shuffled.slice(0, 15);

    if (candidates.length < 3) return null;

    const response = await fetch("/api/enhance-distractors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, candidates }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.distractors && Array.isArray(data.distractors) && data.distractors.length === 3) {
      return data.distractors;
    }

    return null;
  } catch (error) {
    console.error("Client AI Enhancer Error:", error);
    return null;
  }
}
