import type { CorpusEntry } from "./semanticSearch";

/** Longitud maxima aceptada para la pregunta del usuario. */
export const MAX_QUESTION_LENGTH = 300;

/** Numero de fichas que se inyectan como contexto en el prompt. */
export const CONTEXT_SIZE = 6;

/**
 * Valida y normaliza la pregunta recibida.
 *
 * Se hace antes de gastar ninguna llamada a Gemini.
 */
export function normalizeQuestion(value: unknown): string {
  if (typeof value !== "string") {
    throw new Error("La pregunta debe ser una cadena de texto.");
  }

  const question = value.trim();

  if (!question) {
    throw new Error("La pregunta no puede estar vacia.");
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    throw new Error(`La pregunta no puede superar los ${MAX_QUESTION_LENGTH} caracteres.`);
  }

  return question;
}

/**
 * Construye el prompt con las fichas recuperadas como unica fuente de verdad.
 *
 * El objetivo es que el modelo responda con los datos reales del catalogo y
 * admita no saber, en vez de inventar stats o Pokemon que no existen.
 */
export function buildPrompt(question: string, entries: CorpusEntry[]): string {
  const context = entries
    .map((entry) => `[#${entry.id} ${entry.name}] ${entry.text}`)
    .join("\n\n");

  return [
    "Eres la Pokedex de un catalogo que cubre unicamente los 251 Pokemon de Kanto y Johto.",
    "Responde en espanol, de forma breve y directa (maximo 4 frases), con un tono desenfadado.",
    "",
    "Reglas:",
    "- Usa exclusivamente los datos de las FICHAS de abajo. No inventes stats, tipos ni habilidades.",
    "- Si las fichas no contienen la informacion necesaria, dilo claramente en vez de suponer.",
    "- Cuando cites cifras (estadisticas, altura, peso), copialas literalmente de las fichas.",
    "- No menciones que estas leyendo fichas ni hables de tu propio funcionamiento.",
    "",
    "FICHAS:",
    context,
    "",
    `PREGUNTA: ${question}`,
  ].join("\n");
}
