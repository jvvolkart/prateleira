import { Router } from "express";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getProductScopeRefusalMessage, isWithinProductScope } from "../chat/product-scope-guard";
import { runChat, runChatStreaming } from "../chat/run-chat";
import { initSse, sseData, streamTextChunks } from "../chat/sse";
import { requireTenant } from "../middleware/tenant.middleware";

const router = Router();

function normalizeMessages(raw: unknown): ChatCompletionMessageParam[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatCompletionMessageParam[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const role = (m as { role?: string }).role;
    const content = (m as { content?: string }).content;
    if (
      (role === "user" || role === "assistant") &&
      typeof content === "string" &&
      content.length > 0
    ) {
      out.push({ role, content });
    }
  }
  return out;
}

function wantsSse(req: { query: unknown; headers: { accept?: string } }): boolean {
  const q = req.query as { stream?: string };
  if (q?.stream === "1" || q?.stream === "true") return true;
  const accept = req.headers.accept;
  return typeof accept === "string" && accept.includes("text/event-stream");
}

router.post("/", ...requireTenant, async (req, res) => {
  const company_id = req.company_id;
  if (!company_id) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  let userMessages: ChatCompletionMessageParam[];
  if (Array.isArray(req.body.messages)) {
    userMessages = normalizeMessages(req.body.messages);
  } else if (typeof req.body.message === "string" && req.body.message.trim()) {
    userMessages = [{ role: "user", content: req.body.message.trim() }];
  } else {
    res.status(400).json({ error: "Provide message (string) or messages (array)" });
    return;
  }

  if (!userMessages.length) {
    res.status(400).json({ error: "no valid messages" });
    return;
  }

  const sse = wantsSse(req);

  try {
    if (!(await isWithinProductScope(userMessages))) {
      const refusal = getProductScopeRefusalMessage();
      if (sse) {
        initSse(res);
        await streamTextChunks(res, refusal);
        res.end();
        return;
      }
      res.json({ reply: refusal });
      return;
    }

    if (sse) {
      initSse(res);
      try {
        await runChatStreaming(userMessages, company_id, (text) => {
          sseData(res, { type: "delta", text });
        });
        sseData(res, { type: "done" });
      } catch (streamErr) {
        sseData(res, {
          type: "error",
          error: streamErr instanceof Error ? streamErr.message : "chat failed",
        });
      }
      res.end();
      return;
    }
    const reply = await runChat(userMessages, company_id);
    res.json({ reply });
  } catch (e) {
    if (e instanceof Error && e.message === "OPENAI_API_KEY is not set") {
      if (sse && !res.headersSent) {
        initSse(res);
        sseData(res, {
          type: "error",
          error: "AI not configured (missing OPENAI_API_KEY)",
        });
        res.end();
        return;
      }
      res.status(503).json({ error: "AI not configured (missing OPENAI_API_KEY)" });
      return;
    }
    console.error(e);
    if (sse && !res.headersSent) {
      initSse(res);
      sseData(res, { type: "error", error: "chat failed" });
      res.end();
      return;
    }
    if (!res.headersSent) {
      res.status(500).json({ error: "chat failed" });
    }
  }
});

export const chatRouter = router;
