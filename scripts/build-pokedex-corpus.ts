/**
 * Genera el corpus indexable para el chat RAG de la Pokedex.
 *
 * Recorre los 251 Pokemon de Kanto/Johto (mismo rango que usa la home y
 * getStaticPaths), aplana sus datos de PokeAPI a un texto plano describible,
 * y pide a Gemini un embedding por Pokemon.
 *
 * Salida: data/pokedex-corpus.json
 *
 * Uso: npx tsx scripts/build-pokedex-corpus.ts
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import api from "../lib/axios";
import { embedTexts, GeminiError } from "../lib/gemini";
import type { CorpusEntry } from "../lib/semanticSearch";
import type {
  Ability,
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
} from "../types/pokemon";

const POKEMON_LIMIT = 251;
/** Peticiones simultaneas a PokeAPI. Bajo a proposito: no hay prisa y evita 429. */
const FETCH_CONCURRENCY = 8;
/**
 * El tier gratuito permite 100 embeddings por minuto, y cada elemento del lote
 * cuenta como una peticion. Lotes de 50 con pausa entre ellos se mantienen
 * comodamente por debajo del limite.
 */
const EMBED_BATCH_SIZE = 50;
/** Pausa entre lotes para no superar la cuota por minuto del tier gratuito. */
const EMBED_BATCH_DELAY_MS = 35_000;
/** Decimales conservados por componente del vector (reduce el JSON a ~1/3). */
const EMBEDDING_PRECISION = 6;

const OUTPUT_PATH = resolve(process.cwd(), "data", "pokedex-corpus.json");

/**
 * Carga .env.local a process.env. Los scripts sueltos no pasan por Next.js,
 * que es quien normalmente se encarga de esto.
 */
function loadEnvLocal() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");

    for (const line of raw.split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // Sin .env.local: se asume que la variable ya viene del entorno.
  }
}

function formatName(value: string) {
  return value.replace(/-/g, " ");
}

const STAT_LABELS: Record<string, string> = {
  hp: "puntos de salud (HP)",
  attack: "ataque fisico",
  defense: "defensa fisica",
  "special-attack": "ataque especial",
  "special-defense": "defensa especial",
  speed: "velocidad",
};

/**
 * Convierte una ficha de PokeAPI en un parrafo de texto plano.
 * Este texto es a la vez lo que se vectoriza y lo que se inyecta como
 * contexto en el prompt, asi que debe ser legible y autocontenido.
 */
function buildPokemonText(
  pokemon: Pokemon,
  category: string,
  abilities: { name: string; isHidden: boolean; description: string }[]
) {
  const displayName = formatName(pokemon.name);
  const types = pokemon.types.map((item) => formatName(item.type.name)).join("/");

  const stats = pokemon.stats
    .map((item) => `${STAT_LABELS[item.stat.name] ?? formatName(item.stat.name)} ${item.base_stat}`)
    .join(", ");

  const totalStats = pokemon.stats.reduce((sum, item) => sum + item.base_stat, 0);

  const abilityText = abilities
    .map((item) => `${formatName(item.name)}${item.isHidden ? " (habilidad oculta)" : ""}: ${item.description}`)
    .join(" ");

  return [
    `${displayName} es el Pokemon numero ${pokemon.id} de la Pokedex, de tipo ${types}.`,
    `Categoria: ${category}.`,
    `Mide ${(pokemon.height / 10).toFixed(1)} metros y pesa ${(pokemon.weight / 10).toFixed(1)} kilogramos.`,
    `Estadisticas base: ${stats}. Total de estadisticas base: ${totalStats}.`,
    `Habilidades: ${abilityText}`,
  ].join(" ");
}

const DEFAULT_ABILITY_DESCRIPTION = "Sin descripcion disponible en PokeAPI.";

function getEnglishCategory(species: PokemonSpecies) {
  return species.genera.find((entry) => entry.language.name === "en")?.genus ?? "Pokemon";
}

function getEnglishAbilityDescription(ability: Ability) {
  const entry = ability.effect_entries.find((item) => item.language.name === "en");
  return entry?.short_effect ?? entry?.effect ?? DEFAULT_ABILITY_DESCRIPTION;
}

/** Ejecuta `worker` sobre `items` con un maximo de `limit` tareas simultaneas. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

async function fetchPokemonText(name: string) {
  const [{ data: pokemon }, { data: species }] = await Promise.all([
    api.get<Pokemon>(`pokemon/${name}`),
    api.get<PokemonSpecies>(`pokemon-species/${name}`),
  ]);

  const abilityResponses = await Promise.allSettled(
    pokemon.abilities.map((item) => api.get<Ability>(`ability/${item.ability.name}`))
  );

  const abilities = pokemon.abilities.map((item, index) => {
    const response = abilityResponses[index];

    return {
      name: item.ability.name,
      isHidden: item.is_hidden,
      description:
        response.status === "fulfilled"
          ? getEnglishAbilityDescription(response.value.data)
          : DEFAULT_ABILITY_DESCRIPTION,
    };
  });

  const statsByName = new Map(pokemon.stats.map((item) => [item.stat.name, item.base_stat]));

  const stats: CorpusEntry["stats"] = {
    hp: statsByName.get("hp") ?? 0,
    attack: statsByName.get("attack") ?? 0,
    defense: statsByName.get("defense") ?? 0,
    "special-attack": statsByName.get("special-attack") ?? 0,
    "special-defense": statsByName.get("special-defense") ?? 0,
    speed: statsByName.get("speed") ?? 0,
  };

  return {
    id: pokemon.id,
    name: pokemon.name,
    text: buildPokemonText(pokemon, getEnglishCategory(species), abilities),
    types: pokemon.types.map((item) => item.type.name),
    // El alcance del proyecto son Kanto (1-151) y Johto (152-251).
    region: pokemon.id <= 151 ? ("kanto" as const) : ("johto" as const),
    height: Number((pokemon.height / 10).toFixed(1)),
    weight: Number((pokemon.weight / 10).toFixed(1)),
    stats,
    statTotal: pokemon.stats.reduce((sum, item) => sum + item.base_stat, 0),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Envuelve `embedTexts` con la politica de reintentos propia de este script:
 * un 429 aqui solo significa que se ha agotado la cuota por minuto del tier
 * gratuito, asi que se espera y se reintenta en vez de abortar.
 */
async function embedBatch(texts: string[], apiKey: string, attempt = 1): Promise<number[][]> {
  try {
    const embeddings = await embedTexts(texts, "RETRIEVAL_DOCUMENT", apiKey);

    return embeddings.map((vector) =>
      vector.map((value) => Number(value.toFixed(EMBEDDING_PRECISION)))
    );
  } catch (error) {
    if (error instanceof GeminiError && error.status === 429 && attempt <= 5) {
      const waitMs = 60_000 * attempt;
      console.log(`  Cuota por minuto alcanzada, esperando ${waitMs / 1000}s antes de reintentar...`);
      await sleep(waitMs);
      return embedBatch(texts, apiKey, attempt + 1);
    }

    throw error;
  }
}

async function main() {
  loadEnvLocal();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Falta GEMINI_API_KEY. Definela en .env.local antes de ejecutar el script.");
  }

  console.log(`Descargando los ${POKEMON_LIMIT} Pokemon de PokeAPI...`);
  const { data: list } = await api.get<PokemonListResponse>("pokemon", {
    params: { limit: POKEMON_LIMIT, offset: 0 },
  });

  let fetched = 0;
  const documents = await mapWithConcurrency(list.results, FETCH_CONCURRENCY, async (item) => {
    const document = await fetchPokemonText(item.name);
    fetched += 1;
    if (fetched % 25 === 0 || fetched === list.results.length) {
      console.log(`  ${fetched}/${list.results.length} fichas procesadas`);
    }
    return document;
  });

  // Reutiliza los vectores del corpus anterior cuyo texto no haya cambiado: un
  // cambio de metadatos no deberia gastar cuota regenerando embeddings identicos.
  const previous = new Map<number, CorpusEntry>();

  if (existsSync(OUTPUT_PATH)) {
    const stored = JSON.parse(readFileSync(OUTPUT_PATH, "utf8")) as CorpusEntry[];
    stored.forEach((entry) => previous.set(entry.id, entry));
  }

  const reused: CorpusEntry[] = [];
  const pending: typeof documents = [];

  for (const document of documents) {
    const stored = previous.get(document.id);

    if (stored && stored.text === document.text && stored.embedding?.length > 0) {
      reused.push({ ...document, embedding: stored.embedding });
    } else {
      pending.push(document);
    }
  }

  if (reused.length > 0) {
    console.log(`Reutilizando ${reused.length} embeddings del corpus anterior (texto sin cambios).`);
  }

  const entries: CorpusEntry[] = [...reused];

  if (pending.length > 0) {
    console.log(`Generando ${pending.length} embeddings con Gemini...`);
  }

  for (let start = 0; start < pending.length; start += EMBED_BATCH_SIZE) {
    const batch = pending.slice(start, start + EMBED_BATCH_SIZE);
    const embeddings = await embedBatch(
      batch.map((document) => document.text),
      apiKey
    );

    batch.forEach((document, index) => {
      entries.push({ ...document, embedding: embeddings[index] });
    });

    console.log(`  ${entries.length - reused.length}/${pending.length} embeddings generados`);

    if (start + EMBED_BATCH_SIZE < pending.length) {
      await sleep(EMBED_BATCH_DELAY_MS);
    }
  }

  entries.sort((a, b) => a.id - b.id);

  mkdirSync(resolve(process.cwd(), "data"), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(entries), "utf8");

  console.log(`Corpus escrito en ${OUTPUT_PATH}`);
  console.log(`  ${entries.length} entradas, ${entries[0].embedding.length} dimensiones por vector`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
