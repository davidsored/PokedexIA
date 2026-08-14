# Plan de implementación: chat conversacional / RAG sobre PokedexIA

Cada paso es verificable antes de avanzar al siguiente. Ningún paso implica desplegar sin haber validado el anterior. Ver justificaciones completas en [`docs/ia-decision.md`](./ia-decision.md).

---

### Paso 0 — Elegir proveedor de IA y crear cuenta/clave

- **Qué se construye:** decisión concreta de proveedor y modelo (embeddings + chat), cuenta creada, clave de API generada.
- **Validación:** clave probada con una llamada mínima de humo (curl o script suelto) que confirme respuesta 200 antes de integrar nada en el repo.

### Paso 1 — Preparar gestión de secretos

- **Qué se construye:** variable de entorno definida en `.env.local` (local) y en Vercel (preview/producción); entrada añadida a `.env.example`; confirmar que `.env*.local` está en `.gitignore`.
- **Validación:** `git status` no muestra el archivo `.env.local`; `process.env.<VAR>` es accesible en un script de prueba local.

### Paso 2 — Script de generación del corpus (build time) ✅ COMPLETADO

- **Qué se construyó:** `scripts/build-pokedex-corpus.ts`, que recorre los 251 Pokémon ya usados por `getStaticPaths`, aplana sus datos (`types/pokemon.ts`) a texto y genera embeddings con `gemini-embedding-001`. Expuesto como `npm run build:corpus`. Única dependencia nueva: `tsx` (devDependency, solo para ejecutar TypeScript fuera de Next.js).
- **Validación realizada:** el script genera `data/pokedex-corpus.json` con 251 entradas, IDs únicos 1–251, todas con `id`/`name`/`text`/`embedding` de 768 dimensiones y vectores no nulos (1,9 MB). Revisión manual de Charizard, Gyarados y Celebi confirmando que el texto refleja tipos, stats y habilidades reales. `tsc --noEmit` sin errores.
- **Desviaciones respecto al diseño inicial** (recogidas en `ia-decision.md`): salida en `data/` en vez de `public/data/`; modelo `gemini-embedding-001` en vez de `text-embedding-004` (inexistente en la cuenta); lotes de 50 con pausa por el límite de 100 embeddings/minuto del tier gratuito.

### Paso 3 — Utilidad de búsqueda por similitud ✅ COMPLETADO

- **Qué se construyó:** `lib/semanticSearch.ts` con `cosineSimilarity(a, b)` y `findRelevantPokemon(queryEmbedding, k, entries?)`, que recorre el corpus del paso 2 y devuelve el top-k ordenado por similitud. El parámetro `entries` permite inyectar un corpus de prueba sin tocar el real.
- **Validación realizada:** 11 tests en verde con `npm test` (runner nativo de Node vía `tsx --test`, sin dependencias de testing añadidas): casos de vectores idénticos, ortogonales, opuestos, nulos, de distinta dimensión, orden del ranking, límite `k`, y una comprobación sobre el corpus real (251 entradas; buscar con el vector de Charizard lo devuelve a él en primera posición). `tsc --noEmit` y `eslint` sin errores. Ningún test llama a Gemini.

### Paso 4 — API route de chat ✅ COMPLETADO

- **Qué se construyó:**
  - `lib/gemini.ts` — cliente mínimo de la API de Gemini vía `fetch` (sin SDK, cero dependencias nuevas): constantes de modelo, `embedTexts`, `embedQuery`, `generateAnswer`, `parseGeneratedText` y `GeminiError` con código HTTP.
  - `lib/rateLimit.ts` — ventana deslizante en memoria por IP (8 peticiones/minuto), con `now` inyectable para poder testear el paso del tiempo, y `getClientIp` leyendo `x-forwarded-for`.
  - `lib/chatPrompt.ts` — `normalizeQuestion` (validación previa a gastar cuota) y `buildPrompt`, que inyecta las fichas recuperadas como única fuente de verdad.
  - `pages/api/chat.ts` — orquesta todo y devuelve `{ answer, sources }` o un error controlado.
  - Refactor del script del paso 2 para reutilizar `lib/gemini.ts` y no duplicar modelo ni dimensiones.
- **Validación realizada** (`curl` contra `npm run dev`):
  - Pregunta válida ("¿qué Pokémon de tipo fuego tiene mejor ataque especial?") → 200 con respuesta correcta y verificable: Typhlosion y Charizard empatados a 109.
  - Comparación ("compárame a Charizard y Gyarados") → 200 con cifras exactas de ambas fichas.
  - Pregunta vacía → 400. Sin campo `question` → 400. Más de 300 caracteres → 400. Método GET → 405.
  - Rate limiting → 429 al superar 8 peticiones por minuto desde la misma IP, con cabecera `Retry-After`.
  - Fallo del proveedor (modelo inexistente) → 503 con mensaje genérico al cliente; el detalle real solo aparece en los logs del servidor.
  - `GEMINI_API_KEY` no aparece en ningún artefacto de `.next/static`; `data/pokedex-corpus.json` no es accesible por HTTP (404).
- **Corrección de modelo:** `gemini-2.5-flash-lite` devuelve 404 ("no longer available to new users"). Se usa `gemini-3.5-flash-lite`, fijado a versión concreta en vez de `-latest` para que el comportamiento no cambie sin aviso.

### Paso 5 — Tests de la lógica de servidor ✅ COMPLETADO

- **Qué se construyó:**
  - `lib/chatPrompt.test.ts` — validación de la pregunta (tipo, vacía, límite de longitud y su borde exacto) y construcción del prompt (incluye todas las fichas recuperadas y la pregunta, no filtra fichas ajenas, conserva las instrucciones anti-alucinación).
  - `lib/gemini.test.ts` — parsing de la respuesta (válida, multiparte, vacía), `taskType`/`outputDimensionality` correctos en la petición de embedding, propagación del código HTTP en `GeminiError` (429 y 503), y que la clave viaja en la URL y nunca en el cuerpo. `fetch` mockeado: ninguna llamada real.
  - `lib/rateLimit.test.ts` — límite por ventana, cuenta de peticiones restantes, `retryAfterSeconds`, expiración de la ventana deslizante, aislamiento entre IPs y las cuatro variantes de `getClientIp`.
- **Validación realizada:** 39 tests en verde con `npm test`, `tsc --noEmit` y `eslint` sin errores. Ningún test llama a Gemini ni a PokeAPI.

### Paso 6 — Componente de chat en UI ✅ COMPLETADO

- **Qué se construyó:** `components/PokedexChat.tsx` + `PokedexChat.module.css`, montado en `pages/index.tsx`. Lanzador flotante "ASK DEX" que abre un panel con cabecera roja, historial, sugerencias iniciales y campo de entrada. Reutiliza el lenguaje visual existente (bordes de 4px `#111111`, sombra dura sin desenfoque, `Press Start 2P` para etiquetas y `Space Mono` para el texto). Las respuestas muestran como etiquetas los Pokémon consultados (`sources`), de modo que se ve de dónde sale cada dato.
- **Validación realizada en navegador:**
  1. El lanzador aparece en la home y abre el panel con el mensaje de bienvenida y tres sugerencias.
  2. "Compárame a Charizard y Gyarados" → respuesta con cifras exactas de ambas fichas y las etiquetas de fuentes correspondientes.
  3. Estado de carga visible ("CONSULTANDO DATOS", campo y botón deshabilitados).
  4. Rate limiting → mensaje de error en estilo 8-bit dentro del panel (`role="alert"`), sin romper la página ni lanzar excepciones no capturadas.
  5. Cierre del panel devuelve al lanzador.
  6. Móvil (375×812): el panel ocupa el ancho disponible sin desbordar ni provocar scroll horizontal.
- **Añadido durante la validación:** las llamadas a Gemini no tenían timeout, y una respuesta lenta (se observó una de 42 s) dejaba al usuario esperando indefinidamente. Se añadió un timeout de 20 s por llamada (`AbortSignal.timeout`), que se traduce en un `GeminiError` 504 y, de cara al usuario, en el mensaje de error controlado. Cubierto por un test nuevo (40 en total).
- **Accesibilidad:** `role="log"` con `aria-live="polite"` en el historial, `role="alert"` en los errores, etiquetas ARIA en los botones y respeto a `prefers-reduced-motion`.

### Paso 7 — Validación de build y despliegue

- **Qué se construye:** nada nuevo — verificación de que todo lo anterior sobrevive un build de producción real.
- **Validación:** `npm run build` local sin errores de TypeScript/lint; deploy a un entorno preview de Vercel; repetir manualmente los 5 casos del paso 6 contra el preview desplegado (no solo `localhost`).

### Paso 8 — Versionado y changelog (este repo)

- **Qué se construye:** bump de versión en `package.json` según SemVer (nueva funcionalidad → minor, p. ej. `0.3.3` → `0.4.0`), entrada nueva en `CHANGELOG.md` bajo `### Added` describiendo el chat/RAG, y un archivo de documentación en `docs/` para esta feature (siguiendo el patrón ya usado por el resto de `docs/feature-*.md`).
- **Validación:** revisión manual de que el número de versión y el changelog siguen exactamente las convenciones ya usadas en commits previos del repo.

### Paso 9 — Actualizar el copy del portfolio (repo distinto)

- **Qué se construye:** actualización de `src/content/proyectos/pokedexia.ts` en el repo del **portfolio** (no en `PokedexIA`) — campos `descripcionCompleta`, `funcionalidades` y, sobre todo, `aprendizajes`, para reflejar la función de IA ya implementada en vez de la nota actual de "pendiente de diseño futuro".
- **Cómo se valida:** este paso **no se redacta libremente aquí**. Se delega a un `content-writer` en una sesión dedicada dentro del repo del portfolio, con este documento y el resultado real de la implementación como contexto, y se somete a revisión de David antes de mergear — misma disciplina de contenido que ya rige el resto del portfolio. No se toca este archivo desde la sesión de `PokedexIA`.

---

## Resumen de dependencias nuevas

Solo las estrictamente necesarias para hablar con el proveedor de IA elegido (SDK oficial o `axios`, ya presente en el proyecto, si el proveedor expone API REST simple). Ninguna vector DB, ninguna dependencia de backend adicional, ninguna librería de UI de chat de terceros — el componente se construye con React/CSS Modules, igual que el resto del proyecto.
