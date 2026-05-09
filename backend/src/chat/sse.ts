import type { Response } from "express";

export function initSse(res: Response): void {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
}

export function sseData(res: Response, payload: unknown): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

/** Progressive delivery of full text (after tool loop); keeps one OpenAI bill. */
export async function streamTextChunks(
  res: Response,
  text: string,
  chunkSize = 48
): Promise<void> {
  for (let i = 0; i < text.length; i += chunkSize) {
    sseData(res, { type: "delta", text: text.slice(i, i + chunkSize) });
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  sseData(res, { type: "done" });
}
