import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GeneratedMCQ } from "./questionGenerator";

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

export async function generateQuestionsFromPrompt(
  prompt: string, 
  count: number = 20
): Promise<GeneratedMCQ[]> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const systemInstruction = `
    You are an expert Arabic teacher. Generate a JSON array of Arabic-Malay MCQs.
    - Direction 'ar_to_ms': prompt is Arabic, answer is Malay.
    - Direction 'ms_to_ar': prompt is Malay, answer is Arabic.
    - Each question must have exactly 3 distractors.
    - Arabic text must include harakat.
    - Keep all text concise.
    - Return ONLY a clean JSON array. No text before or after.
  `;

  try {
    console.log(`Generating up to ${count} questions for: ${prompt}...`);
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate ${Math.min(count, 25)} Arabic-Malay vocabulary MCQs for: "${prompt}". Keep prompts and answers short.`,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 8192,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING },
              answer: { type: Type.STRING },
              distractors: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Array of exactly 3 strings"
              },
              direction: { 
                type: Type.STRING,
                description: "ar_to_ms or ms_to_ar"
              },
              transliteration: { type: Type.STRING },
              image_keyword: { type: Type.STRING }
            },
            required: ['prompt', 'answer', 'distractors', 'direction']
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Model returned empty response");
    }

    try {
      const data = JSON.parse(text.trim());
      console.log("AI Generation Successful. Count:", data.length);
      
      return data.map((q: any) => ({
        prompt: q.prompt,
        answer: q.answer,
        distractors: (q.distractors || []).slice(0, 3) as [string, string, string],
        direction: q.direction || 'ar_to_ms',
        source_vocab_id: undefined,
        metadata: {
          transliteration: q.transliteration || "",
          image_keyword: q.image_keyword || ""
        }
      }));
    } catch (parseError) {
      console.error("Failed to parse AI response JSON.");
      console.error("Text length:", text.length);
      console.error("Text start:", text.substring(0, 200));
      console.error("Text end:", text.substring(text.length - 200));
      throw new Error("Gagal memproses jawapan AI. Sila cuba lagi dengan topik yang lebih ringkas.");
    }
  } catch (error) {
    console.error("AI Generation Error details:", error);
    throw error;
  }
}
