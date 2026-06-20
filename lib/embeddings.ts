import ollama from "./ai";

export async function getEmbedding(text: string): Promise<number[]> {
  const response = await ollama.embeddings.create({
    model: "nomic-embed-text",
    input: text,
  });
  return response.data[0].embedding;
}

export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await ollama.embeddings.create({
    model: "nomic-embed-text",
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}
