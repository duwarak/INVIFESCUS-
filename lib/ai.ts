import OpenAI from "openai";

const ollama = new OpenAI({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
  apiKey: "ollama",
});

export type ModelName = "llama3.1" | "llava" | "nomic-embed-text";

export async function chat(
  systemPrompt: string,
  userMessage: string,
  model: ModelName = "llama3.1"
): Promise<string> {
  const response = await ollama.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || "";
}

export async function chatWithImage(
  systemPrompt: string,
  userMessage: string,
  imageBase64: string
): Promise<string> {
  const response = await ollama.chat.completions.create({
    model: "llava",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: userMessage },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
          },
        ],
      },
    ],
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || "";
}

export async function chatJSON<T>(
  systemPrompt: string,
  userMessage: string,
  model: ModelName = "llama3.1"
): Promise<T> {
  const raw = await chat(
    systemPrompt + "\n\nRespond ONLY with valid JSON. No markdown, no backticks, no explanation.",
    userMessage,
    model
  );

  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    console.error("Failed to parse LLM JSON:", cleaned);
    throw new Error("LLM returned invalid JSON");
  }
}

export default ollama;
