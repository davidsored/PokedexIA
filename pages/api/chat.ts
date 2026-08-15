import type { NextApiRequest, NextApiResponse } from "next";
import { buildPrompt, CONTEXT_SIZE, normalizeQuestion } from "@/lib/chatPrompt";
import { embedQuery, generateAnswer, GeminiError, getGeminiApiKey } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { findRelevantPokemon } from "@/lib/semanticSearch";

export interface ChatSuccessResponse {
  answer: string;
  /** Pokemon usados como contexto, para poder mostrarlos como fuentes en la UI. */
  sources: { id: number; name: string }[];
}

export interface ChatErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatSuccessResponse | ChatErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  const rateLimit = checkRateLimit(getClientIp(req.headers));

  if (!rateLimit.allowed) {
    res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
    return res.status(429).json({
      error: `Demasiadas preguntas seguidas. Espera ${rateLimit.retryAfterSeconds} segundos.`,
    });
  }

  let question: string;

  try {
    question = normalizeQuestion((req.body as { question?: unknown } | undefined)?.question);
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Pregunta invalida.",
    });
  }

  try {
    const apiKey = getGeminiApiKey();

    const queryEmbedding = await embedQuery(question, apiKey);
    const relevant = findRelevantPokemon(queryEmbedding, CONTEXT_SIZE);
    const answer = await generateAnswer(buildPrompt(question, relevant), apiKey);

    return res.status(200).json({
      answer,
      sources: relevant.map((entry) => ({ id: entry.id, name: entry.name })),
    });
  } catch (error) {
    // El detalle real solo va a los logs del servidor: nunca al cliente, para
    // no filtrar mensajes de la API ni pistas sobre la clave.
    console.error("[api/chat]", error);

    if (error instanceof GeminiError && error.status === 429) {
      return res.status(429).json({
        error: "La Pokedex ha recibido demasiadas consultas. Intentalo en un minuto.",
      });
    }

    return res.status(503).json({
      error: "La Pokedex no responde ahora mismo. Intentalo de nuevo en unos segundos.",
    });
  }
}
