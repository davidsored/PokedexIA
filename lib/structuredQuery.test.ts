import assert from "node:assert/strict";
import { test } from "node:test";
import type { CorpusEntry } from "./semanticSearch";
import { makeCorpusEntry } from "./testFixtures";
import {
  describeStructuredQuery,
  parseStructuredQuery,
  runStructuredQuery,
} from "./structuredQuery";

const entries: CorpusEntry[] = [
  makeCorpusEntry(6, "charizard", {
    types: ["fire", "flying"],
    weight: 90.5,
    stats: { hp: 78, attack: 84, defense: 78, "special-attack": 109, "special-defense": 85, speed: 100 },
    statTotal: 534,
  }),
  makeCorpusEntry(59, "arcanine", {
    types: ["fire"],
    weight: 155,
    stats: { hp: 90, attack: 110, defense: 80, "special-attack": 100, "special-defense": 80, speed: 95 },
    statTotal: 555,
  }),
  makeCorpusEntry(208, "steelix", { types: ["steel", "ground"], weight: 400, statTotal: 510 }),
  makeCorpusEntry(158, "totodile", { types: ["water"], weight: 9.5, statTotal: 314 }),
];

test("una pregunta sin superlativo no genera consulta estructurada", () => {
  assert.equal(parseStructuredQuery("comparame a Charizard y Gyarados"), null);
  assert.equal(parseStructuredQuery("de que tipo es Pikachu?"), null);
});

test("un superlativo sin campo numerico reconocible tampoco la genera", () => {
  assert.equal(parseStructuredQuery("cual es el mejor Pokemon?"), null);
});

test("detecta campo y direccion en un superlativo simple", () => {
  assert.deepEqual(parseStructuredQuery("cual es el Pokemon mas pesado?"), {
    field: "weight",
    direction: "desc",
  });
});

test("detecta el filtro de region", () => {
  assert.deepEqual(parseStructuredQuery("el Pokemon mas pesado de Johto"), {
    field: "weight",
    direction: "desc",
    region: "johto",
  });
});

test("detecta el filtro de tipo y traduce el nombre a la clave de PokeAPI", () => {
  assert.deepEqual(parseStructuredQuery("que Pokemon de tipo fuego tiene mejor ataque especial?"), {
    field: "special-attack",
    direction: "desc",
    type: "fire",
  });
});

test("funciona con acentos y mayusculas", () => {
  assert.deepEqual(parseStructuredQuery("¿Cuál es el más rápido de KANTO?"), {
    field: "speed",
    direction: "desc",
    region: "kanto",
  });
});

test("invierte la direccion con 'menos' y con 'menor'", () => {
  assert.equal(parseStructuredQuery("el Pokemon menos pesado")?.direction, "asc");
  assert.equal(parseStructuredQuery("el de menor velocidad")?.direction, "asc");
});

test("los adjetivos con polaridad propia fijan la direccion", () => {
  assert.deepEqual(parseStructuredQuery("cual es el mas ligero?"), {
    field: "weight",
    direction: "asc",
  });
  assert.deepEqual(parseStructuredQuery("cual es el mas lento?"), {
    field: "speed",
    direction: "asc",
  });
});

test("'ataque especial' no se confunde con 'ataque'", () => {
  assert.equal(parseStructuredQuery("mayor ataque especial")?.field, "special-attack");
  assert.equal(parseStructuredQuery("mayor ataque")?.field, "attack");
  assert.equal(parseStructuredQuery("mayor defensa especial")?.field, "special-defense");
});

test("runStructuredQuery ordena descendente sobre todo el corpus", () => {
  const results = runStructuredQuery({ field: "weight", direction: "desc" }, entries);

  assert.deepEqual(
    results.map((entry) => entry.name),
    ["steelix", "arcanine", "charizard", "totodile"]
  );
});

test("runStructuredQuery ordena ascendente", () => {
  const [lightest] = runStructuredQuery({ field: "weight", direction: "asc" }, entries);
  assert.equal(lightest.name, "totodile");
});

test("runStructuredQuery aplica el filtro de tipo", () => {
  const results = runStructuredQuery(
    { field: "special-attack", direction: "desc", type: "fire" },
    entries
  );

  assert.deepEqual(
    results.map((entry) => entry.name),
    ["charizard", "arcanine"]
  );
});

test("runStructuredQuery aplica el filtro de region", () => {
  const results = runStructuredQuery({ field: "weight", direction: "desc", region: "johto" }, entries);

  assert.deepEqual(
    results.map((entry) => entry.name),
    ["steelix", "totodile"]
  );
});

test("runStructuredQuery respeta el limite de resultados", () => {
  assert.equal(runStructuredQuery({ field: "weight", direction: "desc" }, entries, 2).length, 2);
});

test("runStructuredQuery devuelve lista vacia si ningun Pokemon pasa el filtro", () => {
  assert.deepEqual(
    runStructuredQuery({ field: "weight", direction: "desc", type: "dragon" }, entries),
    []
  );
});

test("describeStructuredQuery explica orden y filtros en lenguaje natural", () => {
  const description = describeStructuredQuery({
    field: "special-attack",
    direction: "desc",
    type: "fire",
    region: "johto",
  });

  assert.ok(description.includes("ataque especial"));
  assert.ok(description.includes("mayor a menor"));
  assert.ok(description.includes("fire"));
  assert.ok(description.includes("johto"));
});
