import type { NextApiRequest, NextApiResponse } from "next";
import { buildPrompt, CONTEXT_SIZE, normalizeQuestion } from "@/lib/chatPrompt";
import { embedQuery, generateAnswer, GeminiError, getGeminiApiKey } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { findRelevantPokemon, pokedexCorpus } from "@/lib/semanticSearch";
import {
  describeStructuredQuery,
  parseStructuredQuery,
  runStructuredQuery,
} from "@/lib/structuredQuery";

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

    // Las preguntas de superlativo se resuelven ordenando el corpus completo:
    // la busqueda semantica solo recupera fichas parecidas a la pregunta, que no
    // tienen por que incluir la que la responde. De paso ahorra la llamada de
    // embedding, porque no hace falta vectorizar nada.
    const structured = parseStructuredQuery(question);

    const relevant = structured
      ? runStructuredQuery(structured, pokedexCorpus)
      : findRelevantPokemon(await embedQuery(question, apiKey), CONTEXT_SIZE);

    const prompt = buildPrompt(
      question,
      relevant,
      structured ? describeStructuredQuery(structured) : undefined
    );

    const answer = await generateAnswer(prompt, apiKey);

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
