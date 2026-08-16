import type { CorpusEntry } from "./semanticSearch";

/**
 * Consultas de superlativo resueltas de forma determinista.
 *
 * La busqueda semantica recupera las fichas mas *parecidas* a la pregunta, que
 * no son necesariamente las que la *responden*: para "el Pokemon mas pesado de
 * Johto" el acierto depende de que el mas pesado caiga por casualidad dentro del
 * top-k. Aqui se detectan esas preguntas y se calculan sobre las 251 fichas,
 * ordenando por el campo numerico correspondiente.
 *
 * Es un detector por palabras clave, no un analisis sintactico: el dominio es
 * cerrado (18 tipos, 2 regiones, 8 campos numericos) y no justifica mas.
 */

/** Campos numericos sobre los que se puede ordenar. */
export type NumericField =
  | "weight"
  | "height"
  | "statTotal"
  | "hp"
  | "attack"
  | "defense"
  | "special-attack"
  | "special-defense"
  | "speed";

export interface StructuredQuery {
  field: NumericField;
  /** `desc` para "el mayor", `asc` para "el menor". */
  direction: "desc" | "asc";
  type?: string;
  region?: "kanto" | "johto";
}

/** Numero de fichas que devuelve una consulta estructurada. */
export const STRUCTURED_RESULT_SIZE = 5;

/** Palabras que indican que se pregunta por un extremo, no por una ficha concreta. */
const SUPERLATIVE_MARKERS = [
  "mas",
  "menos",
  "mayor",
  "menor",
  "mejor",
  "peor",
  "maximo",
  "minimo",
  "top",
  "ranking",
];

/** Palabras que invierten el sentido: "el menos pesado", "el de menor ataque". */
const INVERTING_MARKERS = ["menos", "menor", "peor", "minimo"];

/**
 * Cada termino apunta a un campo y, si es un adjetivo con polaridad propia
 * ("ligero" ya significa poco peso), a una direccion por defecto.
 *
 * El orden importa: los terminos mas largos se comprueban primero para que
 * "ataque especial" no se resuelva como "ataque".
 */
const FIELD_TERMS: { term: string; field: NumericField; direction?: "desc" | "asc" }[] = [
  { term: "ataque especial", field: "special-attack" },
  { term: "defensa especial", field: "special-defense" },
  { term: "ataque fisico", field: "attack" },
  { term: "defensa fisica", field: "defense" },
  { term: "estadisticas base", field: "statTotal" },
  { term: "estadisticas totales", field: "statTotal" },
  { term: "total de estadisticas", field: "statTotal" },
  { term: "puntos de salud", field: "hp" },
  { term: "special attack", field: "special-attack" },
  { term: "special defense", field: "special-defense" },
  { term: "pesado", field: "weight", direction: "desc" },
  { term: "pesa", field: "weight", direction: "desc" },
  { term: "ligero", field: "weight", direction: "asc" },
  { term: "peso", field: "weight" },
  { term: "alto", field: "height", direction: "desc" },
  { term: "alta", field: "height", direction: "desc" },
  { term: "grande", field: "height", direction: "desc" },
  { term: "bajo", field: "height", direction: "asc" },
  { term: "pequeno", field: "height", direction: "asc" },
  { term: "altura", field: "height" },
  { term: "mide", field: "height" },
  { term: "rapido", field: "speed", direction: "desc" },
  { term: "lento", field: "speed", direction: "asc" },
  { term: "velocidad", field: "speed" },
  { term: "resistente", field: "hp", direction: "desc" },
  { term: "vida", field: "hp" },
  { term: "salud", field: "hp" },
  { term: "hp", field: "hp" },
  { term: "ataque", field: "attack" },
  { term: "defensa", field: "defense" },
  { term: "fuerte", field: "statTotal", direction: "desc" },
  { term: "debil", field: "statTotal", direction: "asc" },
  { term: "poderoso", field: "statTotal", direction: "desc" },
];

/** Tipos en ingles (como vienen de PokeAPI) y su termino habitual en espanol. */
const TYPE_TERMS: Record<string, string> = {
  fuego: "fire",
  fire: "fire",
  agua: "water",
  water: "water",
  planta: "grass",
  hierba: "grass",
  grass: "grass",
  electrico: "electric",
  electric: "electric",
  hielo: "ice",
  ice: "ice",
  lucha: "fighting",
  luchador: "fighting",
  fighting: "fighting",
  veneno: "poison",
  venenoso: "poison",
  poison: "poison",
  tierra: "ground",
  ground: "ground",
  volador: "flying",
  flying: "flying",
  psiquico: "psychic",
  psychic: "psychic",
  bicho: "bug",
  bug: "bug",
  roca: "rock",
  rock: "rock",
  fantasma: "ghost",
  ghost: "ghost",
  dragon: "dragon",
  siniestro: "dark",
  oscuro: "dark",
  dark: "dark",
  acero: "steel",
  steel: "steel",
  hada: "fairy",
  fairy: "fairy",
  normal: "normal",
};

/** Minusculas y sin acentos, para no depender de como escriba el usuario. */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function includesWord(haystack: string, needle: string): boolean {
  // Los terminos con espacio se buscan tal cual; los sueltos, como palabra
  // completa, para que "hada" no dispare dentro de "hadas" mal escrito ni
  // "alto" dentro de "salto".
  if (needle.includes(" ")) {
    return haystack.includes(needle);
  }

  return new RegExp(`\\b${needle}\\b`).test(haystack);
}

/**
 * Devuelve la consulta estructurada equivalente a la pregunta, o `null` si no
 * es una pregunta de superlativo y debe resolverse por busqueda semantica.
 */
export function parseStructuredQuery(question: string): StructuredQuery | null {
  const text = normalize(question);

  const hasSuperlative = SUPERLATIVE_MARKERS.some((marker) => includesWord(text, marker));
  if (!hasSuperlative) {
    return null;
  }

  const match = FIELD_TERMS.find((entry) => includesWord(text, entry.term));
  if (!match) {
    return null;
  }

  const inverted = INVERTING_MARKERS.some((marker) => includesWord(text, marker));
  const baseDirection = match.direction ?? "desc";
  const direction = inverted
    ? baseDirection === "desc"
      ? "asc"
      : "desc"
    : baseDirection;

  const typeEntry = Object.entries(TYPE_TERMS).find(([term]) => includesWord(text, term));
  const region = includesWord(text, "johto")
    ? ("johto" as const)
    : includesWord(text, "kanto")
      ? ("kanto" as const)
      : undefined;

  return {
    field: match.field,
    direction,
    ...(typeEntry ? { type: typeEntry[1] } : {}),
    ...(region ? { region } : {}),
  };
}

function getFieldValue(entry: CorpusEntry, field: NumericField): number {
  if (field === "weight" || field === "height" || field === "statTotal") {
    return entry[field];
  }

  return entry.stats[field];
}

/**
 * Aplica los filtros y ordena el corpus completo por el campo pedido.
 * Devuelve las primeras `limit` fichas, ya en el orden de la respuesta.
 */
export function runStructuredQuery(
  query: StructuredQuery,
  entries: CorpusEntry[],
  limit: number = STRUCTURED_RESULT_SIZE
): CorpusEntry[] {
  const filtered = entries.filter((entry) => {
    const matchesType = !query.type || entry.types.includes(query.type);
    const matchesRegion = !query.region || entry.region === query.region;
    return matchesType && matchesRegion;
  });

  return [...filtered]
    .sort((first, second) => {
      const difference = getFieldValue(first, query.field) - getFieldValue(second, query.field);
      return query.direction === "desc" ? -difference : difference;
    })
    .slice(0, limit);
}

const FIELD_LABELS: Record<NumericField, string> = {
  weight: "peso",
  height: "altura",
  statTotal: "total de estadisticas base",
  hp: "puntos de salud",
  attack: "ataque fisico",
  defense: "defensa fisica",
  "special-attack": "ataque especial",
  "special-defense": "defensa especial",
  speed: "velocidad",
};

/** Describe la consulta en lenguaje natural, para inyectarla en el prompt. */
export function describeStructuredQuery(query: StructuredQuery): string {
  const order = query.direction === "desc" ? "mayor a menor" : "menor a mayor";
  const filters = [
    query.type ? `de tipo ${query.type}` : null,
    query.region ? `de la region ${query.region}` : null,
  ].filter(Boolean);

  const scope = filters.length > 0 ? ` ${filters.join(" y ")}` : "";

  return `Pokemon${scope}, ordenados por ${FIELD_LABELS[query.field]} de ${order}`;
}
