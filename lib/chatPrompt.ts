// IMPORTANTE: esta importacion debe seguir siendo `import type`. El componente
// de chat (cliente) importa MAX_QUESTION_LENGTH de este modulo, y `semanticSearch`
// arrastra el corpus de ~2 MB: convertirla en importacion de valor lo colaria
// entero en el bundle de cliente sin que nada falle de forma visible.
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
export function buildPrompt(
  question: string,
  entries: CorpusEntry[],
  /**
   * Presente solo cuando las fichas vienen de una consulta estructurada: en ese
   * caso son un ranking ya calculado sobre los 251 Pokemon, y el modelo puede
   * afirmar cual es el primero sin arriesgarse a inventar.
   */
  ranking?: string
): string {
  const context = entries
    .map((entry) => `[#${entry.id} ${entry.name}] ${entry.text}`)
    .join("\n\n");

  const rankingRules = ranking
    ? [
        `- Las FICHAS son un ranking ya calculado sobre los 251 Pokemon del catalogo: ${ranking}.`,
        "- El primero de la lista es la respuesta a la pregunta. Puedes afirmarlo con seguridad.",
        "- Menciona tambien algun otro de la lista si aporta contexto util.",
      ]
    : [
        "- Si las fichas no contienen la informacion necesaria, dilo claramente en vez de suponer.",
      ];

  return [
    "Eres la Pokedex de un catalogo que cubre unicamente los 251 Pokemon de Kanto y Johto.",
    "Responde en espanol, de forma breve y directa (maximo 4 frases), con un tono desenfadado.",
    "",
    "Reglas:",
    "- Usa exclusivamente los datos de las FICHAS de abajo. No inventes stats, tipos ni habilidades.",
    ...rankingRules,
    "- Cuando cites cifras (estadisticas, altura, peso), copialas literalmente de las fichas.",
    "- No menciones que estas leyendo fichas ni hables de tu propio funcionamiento.",
    "",
    "FICHAS:",
    context,
    "",
    `PREGUNTA: ${question}`,
  ].join("\n");
}
