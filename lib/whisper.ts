// Local speech-to-text using transformers.js (Xenova)
// Model: openai/whisper-base — fully offline after first download

let pipeline: any = null;

export async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string> {
  if (!pipeline) {
    // Dynamic import to avoid bundling in client
    const { pipeline: createPipeline } = await import("@xenova/transformers");
    pipeline = await createPipeline(
      "automatic-speech-recognition",
      "Xenova/whisper-base"
    );
  }

  const float32Array = new Float32Array(audioBuffer);
  const result = await pipeline(float32Array, {
    chunk_length_s: 30,
    stride_length_s: 5,
    return_timestamps: false,
  });

  return result.text?.trim() || "";
}

export async function transcribeFromBase64(base64Audio: string): Promise<string> {
  const buffer = Buffer.from(base64Audio, "base64");
  return transcribeAudio(buffer.buffer);
}
