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

### Paso 3 — Utilidad de búsqueda por similitud

- **Qué se construye:** `lib/semanticSearch.ts` con una función `findRelevantPokemon(queryEmbedding, k)` que calcula similitud coseno contra el JSON del paso 2 y devuelve el top-k.
- **Validación:** test unitario con un JSON de prueba pequeño (3-4 vectores conocidos) que confirme que devuelve el orden esperado. No requiere llamar al proveedor de IA (usar vectores fijos en el test).

### Paso 4 — API route de chat

- **Qué se construye:** `pages/api/chat.ts` — recibe `{ question: string }`, valida longitud/no-vacío, aplica rate limiting por IP en memoria, genera el embedding de la pregunta, llama a `findRelevantPokemon`, construye el prompt con el contexto acotado, llama al modelo de chat, devuelve `{ answer: string }` o un error controlado.
- **Validación:** probar el endpoint con `curl`/Postman con 3 casos: pregunta válida (respuesta coherente citando datos reales), pregunta vacía (400), y más de N peticiones seguidas desde la misma IP (429). Confirmar en la respuesta de red que la clave de API nunca aparece en el payload devuelto al cliente.

### Paso 5 — Tests de la lógica de servidor

- **Qué se construye:** tests para construcción de contexto, construcción de prompt, parsing de respuesta del proveedor (mockeado) y rate limiting, según el punto 8 de `ia-decision.md`.
- **Validación:** suite de tests en verde (`npm test` o el runner que se añada); confirmar que ningún test hace una llamada real al proveedor de IA (todas mockeadas).

### Paso 6 — Componente de chat en UI

- **Qué se construye:** `components/PokedexChat.tsx` + `PokedexChat.module.css`, integrado en `pages/index.tsx`, reutilizando la estética 8-bit existente (tipografía/bordes de `styles/Home.module.css`). Estados: reposo, escribiendo, cargando respuesta, error.
- **Validación manual en navegador (`npm run dev`):**
  1. Abrir el chat desde la home.
  2. Hacer una pregunta real ("¿qué Pokémon de tipo fuego tiene mejor ataque especial?") y confirmar que la respuesta cita Pokémon y stats coherentes con los datos del propio catálogo.
  3. Hacer una pregunta de comparación ("compárame a Charizard y Gyarados") y confirmar coherencia.
  4. Simular fallo del proveedor (clave inválida temporalmente) y confirmar que se muestra el mensaje de error en estilo 8-bit sin romper la página.
  5. Enviar peticiones repetidas rápido y confirmar que el límite de tasa se activa visualmente sin crash.

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
