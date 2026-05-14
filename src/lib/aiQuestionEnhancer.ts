import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GeneratedMCQ, VocabRow } from "./questionGenerator";

const API_KEY = process.env.GEMINI_API_KEY;

export async function enhanceDistractors(
  question: GeneratedMCQ,
  library: VocabRow[]
): Promise<string[] | null> {
  if (!API_KEY) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Pick a pool of candidates from the library (same direction)
    const directionPool = library
      .map(v => (question.direction === 'ar_to_ms' ? v.meaning_ms : v.arabic))
      .filter(val => val !== question.answer);
    
    // Shuffle and pick 15
    const shuffled = [...new Set(directionPool)].sort(() => Math.random() - 0.5);
    const candidates = shuffled.slice(0, 15);

    const promptText = `Saya sedang membina soalan aneka pilihan untuk pelajar Bahasa Arab. 
Soalan: '${question.prompt}'. 
Jawapan betul: '${question.answer}'. 
Berikut adalah senarai calon distraktor: ${candidates.join(', ')}. 

Pilih 3 distraktor yang PALING dekat secara makna dengan jawapan betul tetapi tetap salah.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: promptText,
      config: {
        systemInstruction: "Anda adalah pakar bahasa Arab dan Jawi. Kembalikan jawapan dalam format JSON sahaja: {\"distractors\": [\"...\", \"...\", \"...\"]}. \n\nIMPORTANT: Jika menggunakan Jawi, pastikan menggunakan aksara standard: چ (Ca), ڠ (Nga), ڤ (Pa), ݢ (Ga), ۏ (Va), ڽ (Nya).",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            distractors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["distractors"]
        }
      }
    });

    const data = JSON.parse(response.text);

    if (data.distractors && Array.isArray(data.distractors) && data.distractors.length === 3) {
      return data.distractors;
    }

    return null;
  } catch (error) {
    console.error("AI Enhancer Error:", error);
    return null;
  }
}
