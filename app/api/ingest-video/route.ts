import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("video") as File;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    // Save uploaded video to temp
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = join(tmpdir(), `polymath-${uuidv4()}.mp4`);
    await writeFile(tempPath, buffer);

    // Extract frames every 30 seconds using ffmpeg
    const outputDir = join(tmpdir(), `polymath-frames-${uuidv4()}`);
    const { mkdir } = await import("fs/promises");
    await mkdir(outputDir, { recursive: true });

    const ffmpeg = (await import("fluent-ffmpeg")).default;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempPath)
        .outputOptions(["-vf", "fps=1/30"]) // 1 frame every 30 seconds
        .output(join(outputDir, "frame-%03d.jpg"))
        .on("end", () => resolve())
        .on("error", (err: Error) => reject(err))
        .run();
    });

    // Read extracted frames
    const { readdir } = await import("fs/promises");
    const frameFiles = (await readdir(outputDir))
      .filter((f) => f.endsWith(".jpg"))
      .sort();

    // Process each frame through the ingest pipeline
    const results = [];
    for (const frameFile of frameFiles) {
      const framePath = join(outputDir, frameFile);
      const frameBuffer = await readFile(framePath);
      const base64 = frameBuffer.toString("base64");

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/ingest`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "image", content: base64 }),
          }
        );
        const data = await response.json();
        results.push({ frame: frameFile, ...data });
      } catch (err) {
        results.push({ frame: frameFile, error: String(err) });
      }

      // Clean up frame
      await unlink(framePath).catch(() => {});
    }

    // Clean up
    await unlink(tempPath).catch(() => {});

    return NextResponse.json({
      framesProcessed: frameFiles.length,
      results,
    });
  } catch (error) {
    console.error("Video ingest error:", error);
    return NextResponse.json(
      { error: "Failed to process video", details: String(error) },
      { status: 500 }
    );
  }
}
