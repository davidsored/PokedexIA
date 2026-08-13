/**
 * Cliente minimo de la API de Gemini.
 *
 * Se usa `fetch` directamente en vez del SDK oficial: solo se necesitan dos
 * endpoints, y evitarlo mantiene el proyecto sin dependencias nuevas.
 *
 * Este modulo solo debe importarse desde codigo de servidor: lee la clave de
 * API de las variables de entorno y nunca debe acabar en el bundle de cliente.
 */

const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export const EMBEDDING_MODEL = "gemini-embedding-001";

/**
 * gemini-embedding-001 devuelve 3072 dimensiones por defecto. 768 es
 * suficiente para discriminar entre 251 fichas y deja el corpus en ~2 MB.
 * Debe coincidir con el valor usado al generar el corpus.
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Modelo de chat: el mas economico que responde con coherencia sobre un
 * contexto corto y estructurado como el de las fichas.
 *
 * Se fija una version concreta en vez de `gemini-flash-lite-latest` para que
 * el comportamiento no cambie sin previo aviso bajo los pies del proyecto.
 * `gemini-2.5-flash-lite` ya no se admite en cuentas nuevas.
 */
export const CHAT_MODEL = "gemini-3.5-flash-lite";

/**
 * `RETRIEVAL_DOCUMENT` para las fichas del corpus, `RETRIEVAL_QUERY` para la
 * pregunta del usuario. Gemini optimiza el vector de forma distinta en cada caso.
 */
export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/** Error de la API de Gemini, con el codigo HTTP para poder distinguir un 429. */
export class GeminiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GeminiError";
    this.status = status;
  }
}

export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Falta la variable de entorno GEMINI_API_KEY.");
  }

  return apiKey;
}

interface BatchEmbedResponse {
  embeddings: { values: number[] }[];
}

/**
 * Devuelve un embedding por cada texto, en el mismo orden de entrada.
 *
 * Ojo: cada elemento del lote cuenta como una peticion frente a la cuota del
 * tier gratuito (100 por minuto), no como una sola.
 */
export async function embedTexts(
  texts: string[],
  taskType: EmbeddingTaskType,
  apiKey: string
): Promise<number[][]> {
  const response = await fetch(`${API_BASE}/${EMBEDDING_MODEL}:batchEmbedContents?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: texts.map((text) => ({
        model: `models/${EMBEDDING_MODEL}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: EMBEDDING_DIMENSIONS,
      })),
    }),
  });

  if (!response.ok) {
    throw new GeminiError(response.status, await response.text());
  }

  const data = (await response.json()) as BatchEmbedResponse;
  return data.embeddings.map((item) => item.values);
}

/** Atajo para el caso mas comun en runtime: vectorizar la pregunta del usuario. */
export async function embedQuery(question: string, apiKey: string): Promise<number[]> {
  const [embedding] = await embedTexts([question], "RETRIEVAL_QUERY", apiKey);
  return embedding;
}

interface GenerateContentResponse {
  candidates?: {
    content?: { parts?: { text?: string }[] };
    finishReason?: string;
  }[];
}

/**
 * Extrae el texto de la respuesta de Gemini.
 *
 * Se exporta aparte del `fetch` para poder testear el parseo sin llamar a la API.
 */
export function parseGeneratedText(data: GenerateContentResponse): string {
  const parts = data.candidates?.[0]?.content?.parts;
  const text = parts?.map((part) => part.text ?? "").join("").trim();

  if (!text) {
    throw new GeminiError(502, "Gemini devolvio una respuesta vacia.");
  }

  return text;
}

/** Genera la respuesta conversacional a partir del prompt ya construido. */
export async function generateAnswer(prompt: string, apiKey: string): Promise<string> {
  const response = await fetch(`${API_BASE}/${CHAT_MODEL}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!response.ok) {
    throw new GeminiError(response.status, await response.text());
  }

  return parseGeneratedText((await response.json()) as GenerateContentResponse);
}
