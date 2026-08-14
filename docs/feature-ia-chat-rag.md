# Feature: chat conversacional sobre la Pokedex (RAG)

## Resumen

Se añadió un asistente conversacional que responde en lenguaje natural preguntas sobre los 251 Pokémon de Kanto y Johto ("¿qué Pokémon de tipo fuego tiene mejor ataque especial?", "compárame a Charizard y Gyarados"). Las respuestas se generan a partir de los datos reales de PokeAPI ya consumidos por el proyecto, no de conocimiento del modelo, mediante RAG (*retrieval-augmented generation*).

Esta es la función de IA que da nombre al proyecto y que hasta ahora estaba pendiente de diseño. Las decisiones de arquitectura y su justificación están en [`ia-decision.md`](./ia-decision.md); el plan por fases y su validación, en [`ia-implementation-plan.md`](./ia-implementation-plan.md).

## Cambios realizados

### Corpus de datos

- Nuevo `scripts/build-pokedex-corpus.ts` (`npm run build:corpus`): descarga las 251 fichas de PokeAPI (Pokémon, especie y habilidades), las aplana a texto plano describible y genera un embedding por Pokémon con `gemini-embedding-001` a 768 dimensiones.
- Nueva salida versionada en `data/pokedex-corpus.json` (251 entradas, ~1,9 MB). Vive fuera de `public/` porque solo la consume el servidor: en `public/` se serviría como descarga pública sin que ningún cliente la necesite.

### Lógica de servidor

- Nuevo `lib/gemini.ts`: cliente mínimo de la API de Gemini vía `fetch`, sin SDK ni dependencias nuevas. Incluye timeout de 20 s por llamada y `GeminiError` con el código HTTP para poder distinguir un 429 de un fallo genérico.
- Nuevo `lib/semanticSearch.ts`: similitud coseno y `findRelevantPokemon`, que recorre el corpus y devuelve el top-k. Con 251 vectores no hace falta ningún índice ni servicio de búsqueda vectorial.
- Nuevo `lib/chatPrompt.ts`: validación de la pregunta y construcción del prompt con las fichas recuperadas como única fuente de verdad.
- Nuevo `lib/rateLimit.ts`: límite de 8 peticiones por minuto y por IP, en memoria y *best-effort*, sin infraestructura externa.
- Nueva API route `pages/api/chat.ts`: orquesta todo lo anterior y devuelve `{ answer, sources }`.

### Interfaz

- Nuevo `components/PokedexChat.tsx` + `PokedexChat.module.css`, montado en `pages/index.tsx`.
- Lanzador flotante con el sprite de la Pokédex (`public/pokedex-chat-icon.png`, con transparencia) y panel de chat que reutiliza la estética 8-bit existente: bordes de 4 px en `#111111`, sombra dura sin desenfoque, `Press Start 2P` para etiquetas y `Space Mono` para el texto.
- Cada respuesta muestra como etiquetas los Pokémon consultados, de modo que se ve de dónde sale cada dato.

### Pruebas

- Nuevos `lib/semanticSearch.test.ts`, `lib/chatPrompt.test.ts`, `lib/gemini.test.ts` y `lib/rateLimit.test.ts`: 40 pruebas ejecutadas con `npm test`, usando el runner nativo de Node vía `tsx`, sin añadir dependencias de testing. Ninguna prueba llama a Gemini ni a PokeAPI.

## Comportamiento

- El usuario abre el chat desde el lanzador de la home y pregunta en lenguaje natural.
- El servidor vectoriza la pregunta, recupera las 6 fichas más parecidas del corpus y se las pasa al modelo como único contexto, con instrucciones de no inventar datos y de admitir cuando no dispone de la información.
- Si el proveedor falla, tarda demasiado o se supera el límite de peticiones, el chat muestra un mensaje de error en el mismo estilo 8-bit sin romper la página. El detalle técnico solo llega a los logs del servidor.

## Configuración

Requiere la variable de entorno `GEMINI_API_KEY` (ver `.env.example`), definida en `.env.local` para desarrollo y en el panel de Vercel para producción y preview. Nunca se expone con el prefijo `NEXT_PUBLIC_`, por lo que no llega al bundle de cliente.

Si cambian los datos de PokeAPI o el texto de las fichas, hay que regenerar el corpus con `npm run build:corpus`. La generación completa tarda unos 3 minutos por el límite de 100 embeddings por minuto del nivel gratuito de Gemini.
