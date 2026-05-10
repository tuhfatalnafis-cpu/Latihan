import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Question Generation
  app.post("/api/generate-questions", async (req, res) => {
    try {
      const { vocab, instructions, count, topicId, userId } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "Gemini API key not configured" });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `You are a specialist in Arabic primary school education. 
      Generate ${count} multiple choice questions based on the following vocabulary pairs (Arabic ↔ Malay):
      ${JSON.stringify(vocab)}

      STRICT RULES:
      1. Arabic Literacy First: NEVER use transliteration/romanized Arabic in prompts, answers, or distractors.
      2. Language Pair: Only use Arabic script (with full harakat) and Malay (Bahasa Melayu). NEVER use English.
      3. Format: Return a JSON array of objects fitting this structure:
         { 
           "topic_id": "${topicId}",
           "question_type": "multiple_choice",
           "prompt": "The question text (Arabic script if testing meaning, Malay if testing Arabic recall)",
           "answer": "The correct option",
           "arabic": "The Arabic word associated with this question (with harakat)",
           "distractors": ["Wrong 1", "Wrong 2", "Wrong 3"],
           "metadata": { "direction": "ar_to_ms" or "ms_to_ar", "image_keyword": "..." },
           "created_by": "${userId}"
         }
      4. Contextual Variety: ${instructions || "Create a mix of direct translation and simple situational context."}
      5. Distractors: Must be topically coherent and strictly from the same domain or common classroom vocabulary.
      6. No Inventing: Only use vocabulary provided in the list above.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonStr = text.replace(/```json|```/g, "").trim();
      let questions = JSON.parse(jsonStr);
      
      if (Array.isArray(questions)) {
        questions = questions.slice(0, count);
      }
      
      res.json(questions);
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate questions" });
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
