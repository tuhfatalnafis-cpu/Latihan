import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";

dotenv.config();

const genAI = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [...fileParts, { text: promptText }]
        },
        config: {
          systemInstruction: `
            You are an educational assessment expert specializing in language and academic subjects. 
            Your goal is to generate a JSON array of high-quality Multiple Choice Questions (MCQs).
            
            GUIDELINES:
            - Questions should be clear, concise, and pedagogically sound.
            - Each question must have exactly 3 distractors (wrong but plausible answers).
            - If the language involved is Jawi/Malay, use specific Jawi characters where appropriate: چ (Ca), ڠ (Nga), ڤ (Pa), ݢ (Ga), ۏ (Va), ڽ (Nya).
            - If generating language content (e.g. Arabic, English), ensure grammatical accuracy.
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

      const responseText = response.text;
      if (!responseText) throw new Error("No response text from AI");
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

      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts: [{ text: promptText }] },
        config: {
          systemInstruction: "Anda adalah pakar dalam penilaian pendidikan. Pilih 3 distraktor yang paling sukar atau paling dekat secara makna tetapi tetap salah berdasarkan konteks soalan. Jika berkaitan Jawi, pastikan ejaan betul.",
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

      const responseText = response.text;
      if (!responseText) throw new Error("No response text from AI");
      res.json(JSON.parse(responseText));
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
    // Production: serve static files from dist
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
