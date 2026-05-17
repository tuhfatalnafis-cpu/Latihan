import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Route for AI Question Generation
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { prompt, count, files } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const fileParts = (files || []).map((f: any) => ({
        inlineData: {
          data: f.data.includes('base64,') ? f.data.split('base64,')[1] : f.data,
          mimeType: f.mimeType
        }
      }));

      const promptText = `Generate ${Math.min(count || 20, 25)} MCQs based on: "${prompt || 'General knowledge'}"`;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          parts: [...fileParts, { text: promptText }]
        }],
        config: {
          systemInstruction: `
            You are an educational assessment expert specializing in language and academic subjects. 
            Your goal is to generate a JSON array of high-quality Multiple Choice Questions (MCQs).
            
            GUIDELINES:
            - Questions can focus on vocabulary, grammar, or reading comprehension.
            - Each question must have exactly 3 distractors (wrong but plausible answers).
            - IMPORTANT: Use specific Jawi characters where appropriate: چ (Ca), ڠ (Nga), ڤ (Pa), ݢ (Ga), ۏ (Va), ڽ (Nya).
            - Return ONLY a clean JSON array.
          `,
          temperature: 0.7,
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
                  minItems: 3,
                  maxItems: 3
                },
                direction: { type: Type.STRING },
                transliteration: { type: Type.STRING },
                image_keyword: { type: Type.STRING }
              },
              required: ['prompt', 'answer', 'distractors', 'direction']
            }
          }
        }
      });

      const responseText = result.text;
      res.json(JSON.parse(responseText));
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate questions" });
    }
  });

  app.post("/api/enhance-distractors", async (req, res) => {
    try {
      const { question, candidates } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const promptText = `Soalan: '${question.prompt}'. Jawapan betul: '${question.answer}'. Calon distraktor: ${candidates.join(', ')}.`;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: promptText }] }],
        config: {
          systemInstruction: "Anda adalah pakar bahasa Arab dan Jawi. Pilih 3 distraktor yang paling dekat secara makna tetapi tetap salah. Kembalikan JSON as per schema.",
          temperature: 0.5,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              distractors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                minItems: 3,
                maxItems: 3
              }
            },
            required: ["distractors"]
          }
        }
      });

      res.json(JSON.parse(result.text));
    } catch (error: any) {
      console.error("Distractor Enhancement Error:", error);
      res.status(500).json({ error: error.message || "Failed to enhance distractors" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
