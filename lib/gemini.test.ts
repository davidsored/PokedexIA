import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  embedQuery,
  EMBEDDING_DIMENSIONS,
  generateAnswer,
  GeminiError,
  getGeminiApiKey,
  parseGeneratedText,
} from "./gemini";

const originalFetch = globalThis.fetch;

/**
 * Sustituye `fetch` por una respuesta fija y captura la peticion enviada.
 * Ningun test de este archivo llega a la API real de Gemini.
 */
function mockFetch(status: number, body: unknown) {
  const calls: { url: string; body: Record<string, unknown> }[] = [];

  globalThis.fetch = (async (url: string, init: { body: string }) => {
    calls.push({ url: String(url), body: JSON.parse(init.body) });

    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
    };
  }) as unknown as typeof fetch;

  return calls;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("parseGeneratedText extrae el texto de la respuesta", () => {
  const text = parseGeneratedText({
    candidates: [{ content: { parts: [{ text: "  Charizard es de tipo fuego.  " }] } }],
  });

  assert.equal(text, "Charizard es de tipo fuego.");
});

test("parseGeneratedText concatena varias partes", () => {
  const text = parseGeneratedText({
    candidates: [{ content: { parts: [{ text: "Hola " }, { text: "Pokedex" }] } }],
  });

  assert.equal(text, "Hola Pokedex");
});

test("parseGeneratedText falla ante una respuesta vacia", () => {
  assert.throws(() => parseGeneratedText({}), GeminiError);
  assert.throws(() => parseGeneratedText({ candidates: [] }), GeminiError);
  assert.throws(
    () => parseGeneratedText({ candidates: [{ content: { parts: [{ text: "   " }] } }] }),
    /respuesta vacia/
  );
});

test("embedQuery pide el embedding con el taskType y las dimensiones correctas", async () => {
  const calls = mockFetch(200, { embeddings: [{ values: [0.1, 0.2, 0.3] }] });

  const embedding = await embedQuery("cual es el mas rapido?", "clave-de-prueba");

  assert.deepEqual(embedding, [0.1, 0.2, 0.3]);
  assert.equal(calls.length, 1);

  const request = calls[0].body.requests as Record<string, unknown>[];
  assert.equal(request.length, 1);
  assert.equal(request[0].taskType, "RETRIEVAL_QUERY");
  assert.equal(request[0].outputDimensionality, EMBEDDING_DIMENSIONS);
});

test("un error de Gemini conserva el codigo HTTP para poder distinguir un 429", async () => {
  mockFetch(429, { error: { message: "quota" } });

  await assert.rejects(
    () => embedQuery("hola", "clave-de-prueba"),
    (error: unknown) => error instanceof GeminiError && error.status === 429
  );
});

test("generateAnswer devuelve el texto generado", async () => {
  const calls = mockFetch(200, {
    candidates: [{ content: { parts: [{ text: "Typhlosion y Charizard, con 109." }] } }],
  });

  const answer = await generateAnswer("PREGUNTA: ...", "clave-de-prueba");

  assert.equal(answer, "Typhlosion y Charizard, con 109.");
  assert.equal((calls[0].body.contents as unknown[]).length, 1);
});

test("generateAnswer propaga un fallo del proveedor como GeminiError", async () => {
  mockFetch(503, { error: { message: "unavailable" } });

  await assert.rejects(
    () => generateAnswer("hola", "clave-de-prueba"),
    (error: unknown) => error instanceof GeminiError && error.status === 503
  );
});

test("la clave de API viaja en la URL de la peticion y no en el cuerpo", async () => {
  const calls = mockFetch(200, { embeddings: [{ values: [1] }] });

  await embedQuery("hola", "clave-secreta");

  assert.ok(calls[0].url.includes("key=clave-secreta"));
  assert.ok(!JSON.stringify(calls[0].body).includes("clave-secreta"));
});

test("getGeminiApiKey falla con un mensaje claro si falta la variable", () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    assert.throws(() => getGeminiApiKey(), /GEMINI_API_KEY/);
  } finally {
    process.env.GEMINI_API_KEY = original;
  }
});
