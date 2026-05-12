import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { GeneratedMCQ } from "./questionGenerator";

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

export async function generateQuestionsFromPrompt(
  prompt: string, 
  count: number = 20
): Promise<GeneratedMCQ[]> {
  return generateQuestionsWithFiles(prompt, [], count);
}

export async function generateQuestionsWithFiles(
  prompt: string,
  files: { data: string; mimeType: string }[],
  count: number = 20
): Promise<GeneratedMCQ[]> {
  if (!API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const systemInstruction = `
    You are an educational assessment expert specializing in language and academic subjects. 
    Your goal is to generate a JSON array of high-quality Multiple Choice Questions (MCQs).
    
    GUIDELINES:
    - Questions can focus on vocabulary, grammar, or reading comprehension.
    - If the user provides a topic like "Comprehension", generate questions that test understanding of context, not just word-to-word translation.
    - Supported 'direction':
      - 'ar_to_ms': Arabic prompt, Malay answer.
      - 'ms_to_ar': Malay prompt, Arabic answer.
      - 'general': For comprehension or other subject-based questions where translation direction is not applicable.
    - Each question must have exactly 3 distractors (wrong but plausible answers).
    - Text must be accurate and include appropriate formatting (e.g., harakat for Arabic).
    - Adapt the question style to the user's specific prompt or provided files.
    - Return ONLY a clean JSON array. No conversational text.
  `;

  try {
    const fileParts = files.map(f => ({
      inlineData: {
        data: f.data.includes('base64,') ? f.data.split('base64,')[1] : f.data,
        mimeType: f.mimeType
      }
    }));

    const promptText = `Generate ${Math.min(count, 25)} MCQs based on the following instructions:
"${prompt || 'General knowledge and Arabic-Malay vocabulary'}".

CONTEXTUAL RULES:
- If files are provided, the questions MUST strictly relate to the content of those files.
- Prioritize "Comprehension" and "Application" levels of learning if suggested by the prompt.
- Ensure the questions follow the specific subject requirements described in the prompt.
- Each MCQ must have 1 correct 'answer' and 3 'distractors'.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{
        parts: [...fileParts, { text: promptText }]
      }],
      config: {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MINIMAL
        },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              prompt: { 
                type: Type.STRING,
                description: "The question or prompt text."
              },
              answer: { 
                type: Type.STRING,
                description: "The correct answer."
              },
              distractors: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                minItems: 3,
                maxItems: 3,
                description: "Exactly 3 plausible but incorrect distractors."
              },
              direction: { 
                type: Type.STRING,
                description: "'ar_to_ms', 'ms_to_ar', or 'general'"
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
      const trimmedText = text.trim();
      const jsonStart = trimmedText.indexOf('[');
      const jsonEnd = trimmedText.lastIndexOf(']') + 1;
      const jsonString = (jsonStart !== -1 && jsonEnd !== -1) 
        ? trimmedText.substring(jsonStart, jsonEnd) 
        : trimmedText;

      const data = JSON.parse(jsonString);
      console.log("AI Generation Successful. Count:", data.length);
      
      return data.map((q: any) => ({
        prompt: q.prompt,
        answer: q.answer,
        distractors: (q.distractors || []).slice(0, 3) as [string, string, string],
        direction: q.direction || 'general',
        source_vocab_id: undefined,
        metadata: {
          transliteration: q.transliteration || "",
          image_keyword: q.image_keyword || ""
        }
      }));
    } catch (parseError) {
      console.error("Failed to parse AI response JSON.");
      console.error("Raw Text:", text);
      throw new Error("Gagal memproses jawapan AI. Sila cuba lagi dengan topik yang lebih ringkas.");
    }
  } catch (error) {
    console.error("AI Generation Error details:", error);
    throw error;
  }
}
