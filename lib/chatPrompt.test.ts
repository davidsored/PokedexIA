import assert from "node:assert/strict";
import { test } from "node:test";
import { buildPrompt, MAX_QUESTION_LENGTH, normalizeQuestion } from "./chatPrompt";
import type { CorpusEntry } from "./semanticSearch";

const entries: CorpusEntry[] = [
  { id: 6, name: "charizard", text: "charizard es de tipo fire/flying.", embedding: [1, 0] },
  { id: 130, name: "gyarados", text: "gyarados es de tipo water/flying.", embedding: [0, 1] },
];

test("normalizeQuestion recorta los espacios sobrantes", () => {
  assert.equal(normalizeQuestion("  hola Pokedex  "), "hola Pokedex");
});

test("normalizeQuestion rechaza valores que no son texto", () => {
  assert.throws(() => normalizeQuestion(undefined), /cadena de texto/);
  assert.throws(() => normalizeQuestion(42), /cadena de texto/);
  assert.throws(() => normalizeQuestion({ question: "hola" }), /cadena de texto/);
});

test("normalizeQuestion rechaza una pregunta vacia o solo con espacios", () => {
  assert.throws(() => normalizeQuestion(""), /no puede estar vacia/);
  assert.throws(() => normalizeQuestion("    "), /no puede estar vacia/);
});

test("normalizeQuestion rechaza preguntas mas largas que el limite", () => {
  const tooLong = "a".repeat(MAX_QUESTION_LENGTH + 1);
  assert.throws(() => normalizeQuestion(tooLong), /300 caracteres/);
});

test("normalizeQuestion acepta una pregunta justo en el limite", () => {
  const exact = "a".repeat(MAX_QUESTION_LENGTH);
  assert.equal(normalizeQuestion(exact).length, MAX_QUESTION_LENGTH);
});

test("buildPrompt incluye el texto de todas las fichas recuperadas", () => {
  const prompt = buildPrompt("compara los dos", entries);

  for (const entry of entries) {
    assert.ok(prompt.includes(entry.text), `falta la ficha de ${entry.name}`);
    assert.ok(prompt.includes(`#${entry.id} ${entry.name}`), `falta la cabecera de ${entry.name}`);
  }
});

test("buildPrompt incluye la pregunta del usuario", () => {
  const prompt = buildPrompt("cual pesa mas?", entries);
  assert.ok(prompt.includes("PREGUNTA: cual pesa mas?"));
});

test("buildPrompt no filtra datos ajenos a las fichas recibidas", () => {
  const prompt = buildPrompt("hola", [entries[0]]);

  assert.ok(prompt.includes("charizard"));
  assert.ok(!prompt.includes("gyarados"));
});

test("buildPrompt instruye al modelo a no inventar y a admitir cuando no sabe", () => {
  const prompt = buildPrompt("hola", entries);

  assert.ok(prompt.includes("No inventes"));
  assert.ok(prompt.includes("dilo claramente"));
});

test("buildPrompt funciona sin fichas y sigue conteniendo la pregunta", () => {
  const prompt = buildPrompt("y si no hay contexto?", []);
  assert.ok(prompt.includes("PREGUNTA: y si no hay contexto?"));
});
