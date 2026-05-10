import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeneratedMCQ, VocabRow } from "./questionGenerator";

const API_KEY = process.env.GEMINI_API_KEY;

export async function enhanceDistractors(
  question: GeneratedMCQ,
  library: VocabRow[]
): Promise<string[] | null> {
  if (!API_KEY) return null;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Pick a pool of candidates from the library (same direction)
    const directionPool = library
      .map(v => (question.direction === 'ar_to_ms' ? v.meaning_ms : v.arabic))
      .filter(val => val !== question.answer);
    
    // Shuffle and pick 15
    const shuffled = [...new Set(directionPool)].sort(() => Math.random() - 0.5);
    const candidates = shuffled.slice(0, 15);

    const prompt = `Saya sedang membina soalan aneka pilihan untuk pelajar Bahasa Arab. 
Soalan: '${question.prompt}'. 
Jawapan betul: '${question.answer}'. 
Berikut adalah senarai calon distraktor: ${candidates.join(', ')}. 

Pilih 3 distraktor yang PALING dekat secara makna dengan jawapan betul tetapi tetap salah. 
Kembalikan JSON sahaja, format: {"distractors": ["...", "...", "..."]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON markdown
    const jsonStr = text.replace(/```json|```/gi, '').trim();
    const data = JSON.parse(jsonStr);

    if (data.distractors && Array.isArray(data.distractors) && data.distractors.length === 3) {
      return data.distractors;
    }

    return null;
  } catch (error) {
    console.error("AI Enhancer Error:", error);
    return null;
  }
}
