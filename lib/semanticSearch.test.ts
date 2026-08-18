import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cosineSimilarity,
  findRelevantPokemon,
  pokedexCorpus,
  type CorpusEntry,
} from "./semanticSearch";
import { makeCorpusEntry } from "./testFixtures";

/**
 * Corpus de prueba con vectores fijos y conocidos: permite comprobar el orden
 * del ranking sin llamar a Gemini ni depender del corpus real.
 */
const testEntries: CorpusEntry[] = [
  makeCorpusEntry(1, "alfa", { text: "alfa", embedding: [1, 0, 0] }),
  makeCorpusEntry(2, "beta", { text: "beta", embedding: [0, 1, 0] }),
  makeCorpusEntry(3, "gamma", { text: "gamma", embedding: [0.8, 0.6, 0] }),
  makeCorpusEntry(4, "delta", { text: "delta", embedding: [-1, 0, 0] }),
];

test("cosineSimilarity vale 1 para vectores identicos", () => {
  assert.equal(cosineSimilarity([1, 2, 3], [1, 2, 3]), 1);
});

test("cosineSimilarity ignora la magnitud y solo mide direccion", () => {
  assert.equal(cosineSimilarity([1, 0], [10, 0]), 1);
});

test("cosineSimilarity vale 0 para vectores ortogonales", () => {
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
});

test("cosineSimilarity vale -1 para vectores opuestos", () => {
  assert.equal(cosineSimilarity([1, 0], [-1, 0]), -1);
});

test("cosineSimilarity devuelve 0 si un vector es nulo, sin producir NaN", () => {
  assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
});

test("cosineSimilarity rechaza vectores de distinta dimension", () => {
  assert.throws(() => cosineSimilarity([1, 0], [1, 0, 0]), /Dimensiones incompatibles/);
});

test("findRelevantPokemon ordena por similitud descendente", () => {
  const results = findRelevantPokemon([1, 0, 0], 4, testEntries);

  assert.deepEqual(
    results.map((entry) => entry.name),
    ["alfa", "gamma", "beta", "delta"]
  );
});

test("findRelevantPokemon respeta el limite k", () => {
  const results = findRelevantPokemon([1, 0, 0], 2, testEntries);

  assert.equal(results.length, 2);
  assert.deepEqual(
    results.map((entry) => entry.name),
    ["alfa", "gamma"]
  );
});

test("findRelevantPokemon devuelve una lista vacia si k no es positivo", () => {
  assert.deepEqual(findRelevantPokemon([1, 0, 0], 0, testEntries), []);
});

test("findRelevantPokemon conserva los datos de la ficha junto a la puntuacion", () => {
  const [best] = findRelevantPokemon([0, 1, 0], 1, testEntries);

  assert.equal(best.id, 2);
  assert.equal(best.text, "beta");
  assert.equal(best.score, 1);
});

test("el corpus real esta cargado y es consultable por defecto", () => {
  assert.equal(pokedexCorpus.length, 251);

  const dimensions = pokedexCorpus[0].embedding.length;
  assert.ok(dimensions > 0);

  // Buscar usando como consulta el propio vector de Charizard debe devolverlo
  // a el en primera posicion: valida el camino completo con el corpus real.
  const charizard = pokedexCorpus.find((entry) => entry.name === "charizard");
  assert.ok(charizard);

  const [best] = findRelevantPokemon(charizard.embedding, 1);
  assert.equal(best.name, "charizard");
});
