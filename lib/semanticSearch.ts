import corpus from "@/data/pokedex-corpus.json";

/** Estadisticas base, con las claves que usa PokeAPI. */
export interface CorpusStats {
  hp: number;
  attack: number;
  defense: number;
  "special-attack": number;
  "special-defense": number;
  speed: number;
}

/**
 * Una ficha de Pokemon vectorizada, tal y como la genera
 * scripts/build-pokedex-corpus.ts.
 *
 * Ademas del texto y su embedding, guarda los datos numericos ya estructurados:
 * son los que permiten resolver preguntas de superlativo ("el mas pesado de
 * Johto") calculandolas sobre las 251 fichas, en vez de depender de que la
 * respuesta correcta caiga dentro del top-k semantico.
 */
export interface CorpusEntry {
  id: number;
  name: string;
  text: string;
  types: string[];
  region: "kanto" | "johto";
  /** Altura en metros. */
  height: number;
  /** Peso en kilogramos. */
  weight: number;
  stats: CorpusStats;
  /** Suma de las seis estadisticas base. */
  statTotal: number;
  embedding: number[];
}

/** Resultado de una busqueda: la ficha mas su puntuacion de similitud. */
export interface ScoredEntry extends CorpusEntry {
  score: number;
}

export const pokedexCorpus = corpus as CorpusEntry[];

/**
 * Similitud coseno entre dos vectores.
 *
 * Devuelve 0 si alguno de los dos es nulo, para no propagar NaN al ranking.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Dimensiones incompatibles: ${a.length} y ${b.length}`);
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dotProduct += a[index] * b[index];
    magnitudeA += a[index] * a[index];
    magnitudeB += b[index] * b[index];
  }

  const magnitude = Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Devuelve las `k` fichas mas parecidas al embedding de la pregunta,
 * ordenadas de mayor a menor similitud.
 *
 * Con 251 vectores, recorrer el corpus entero cuesta milisegundos: no hace
 * falta ningun indice ni servicio de busqueda vectorial.
 */
export function findRelevantPokemon(
  queryEmbedding: number[],
  k = 5,
  entries: CorpusEntry[] = pokedexCorpus
): ScoredEntry[] {
  if (k <= 0) {
    return [];
  }

  return entries
    .map((entry) => ({ ...entry, score: cosineSimilarity(queryEmbedding, entry.embedding) }))
    .sort((first, second) => second.score - first.score)
    .slice(0, k);
}
