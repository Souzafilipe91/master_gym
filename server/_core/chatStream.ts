import type { Express, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { ENV } from "./env";
import { sdk } from "./sdk";
import * as db from "../db";
import { buildPersonaPrompt } from "../persona";

export function registerChatStreamRoute(app: Express) {
  app.post("/api/chat/stream", async (req: Request, res: Response) => {
    // Autenticar usuário
    let user;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      res.status(401).json({ error: "Não autenticado" });
      return;
    }

    const { messages } = req.body as {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!messages?.length) {
      res.status(400).json({ error: "messages é obrigatório" });
      return;
    }

    if (!ENV.anthropicApiKey) {
      res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada" });
      return;
    }

    // Buscar anamnese do usuário para personalizar
    const anamnese = await db.getAnamneseByUserId(user.id).catch(() => null);

    // Configurar SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    const client = new Anthropic({ apiKey: ENV.anthropicApiKey });

    try {
      const stream = await client.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: buildPersonaPrompt(anamnese),
        messages: messages.map(m => ({ role: m.role, content: m.content })),
      });

      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          const text = chunk.delta.text;
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ error: "Erro ao gerar resposta" })}\n\n`);
    } finally {
      res.end();
    }
  });
}
