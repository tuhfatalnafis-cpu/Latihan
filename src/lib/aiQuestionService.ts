import { GeneratedMCQ } from "./questionGenerator";

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
  try {
    const response = await fetch("/api/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, count, files }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    
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
  } catch (error: any) {
    console.error("Client AI Generation Error:", error);
    // Log helpful message if it's a fetch failure
    if (error.message === 'Failed to fetch') {
      throw new Error("Gagal menyambung ke server. Sila pastikan sambungan internet anda stabil atau server sedang berjalan.");
    }
    throw error;
  }
}
