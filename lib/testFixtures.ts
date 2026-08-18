import type { CorpusEntry } from "./semanticSearch";

/**
 * Construye una ficha de corpus completa para los tests.
 *
 * Evita repetir en cada archivo de pruebas todos los campos numericos que no
 * son relevantes para el caso concreto que se esta comprobando.
 */
export function makeCorpusEntry(
  id: number,
  name: string,
  overrides: Partial<CorpusEntry> = {}
): CorpusEntry {
  return {
    id,
    name,
    text: `${name} de prueba`,
    types: ["normal"],
    region: id <= 151 ? "kanto" : "johto",
    height: 1,
    weight: 10,
    stats: {
      hp: 50,
      attack: 50,
      defense: 50,
      "special-attack": 50,
      "special-defense": 50,
      speed: 50,
    },
    statTotal: 300,
    embedding: [1, 0],
    ...overrides,
  };
}
