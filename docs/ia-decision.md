# Decisión de arquitectura: chat conversacional / búsqueda semántica (RAG)

**Estado:** decisión de diseño, pendiente de implementación.
**Contexto previo:** ver sesión de decisión de función (búsqueda semántica/chat sobre los 251 Pokémon de Kanto/Johto, apoyada en datos ya consumidos de PokeAPI).

Este documento fija el *cómo* antes de tocar código. Cada apartado indica la opción elegida y por qué se descarta la alternativa más obvia.

---

## 1. Fuente y preparación de datos

**Decisión: pre-generar el contenido indexable en build time, no en runtime.**

El proyecto ya usa `getStaticProps`/`getStaticPaths` con revalidación — es decir, ya asume que los datos de PokeAPI cambian con muy poca frecuencia. Consultar PokeAPI en cada petición de chat sería inconsistente con esa arquitectura y añadiría latencia y puntos de fallo innecesarios para un dataset fijo de 251 Pokémon.

Se añade un script (`scripts/build-pokedex-corpus.ts` o similar, ejecutado en build o manualmente y versionado su salida) que:

1. Recorre los 251 Pokémon ya soportados por el proyecto (mismo rango Kanto/Johto que usa `getStaticPaths`).
2. Por cada uno, aplana los campos relevantes de `Pokemon`/`PokemonSpecies` (`types/pokemon.ts`) a un párrafo de texto plano: nombre, tipos, stats base, habilidades (con `short_effect` cuando esté disponible), género (`genus`), altura/peso. Ejemplo: *"Charizard es un Pokémon de tipo fuego/volador. Ataque especial 109, ataque físico 84, velocidad 100..."*.
3. Genera un embedding por Pokémon a partir de ese texto (proveedor en sección 3).
4. Escribe el resultado a un JSON estático (`public/data/pokedex-embeddings.json` o `lib/data/`): `{ id, name, text, embedding: number[] }[]`.

**Por qué no runtime:** con 251 registros fijos, regenerar embeddings en cada request (o incluso en cada deploy sin cachear) es coste y latencia gratuitos. Generarlos una vez y versionarlos (o regenerarlos solo cuando cambien los datos fuente) es coherente con el resto del proyecto, que ya trata PokeAPI como una fuente semi-estática.

---

## 2. Almacenamiento y búsqueda (vector store)

**Decisión: JSON estático servido desde `public/` + búsqueda por similitud coseno en el servidor (API route), sin vector store externo.**

Con 251 vectores de dimensión ~1500 (según proveedor), el archivo resultante pesa unos pocos MB como máximo. Calcular similitud coseno contra 251 vectores es trivial en cualquier runtime de Node — del orden de milisegundos — no requiere Pinecone, Supabase pgvector, ni ningún servicio dedicado.

Se descarta:
- **Vector DB externa (Pinecone, Weaviate, Qdrant Cloud, etc.):** infraestructura, cuenta y coste recurrente para un problema que resuelve un `Array.reduce`. Sobre-ingeniería para un proyecto de portfolio de bajo tráfico y dataset fijo.
- **pgvector / base de datos propia:** el proyecto no tiene backend con base de datos hoy, y añadir una solo para esto contradice la restricción de evitarlo cuando hay alternativa estática.

El archivo de embeddings se carga en memoria una vez por invocación de la función serverless (import estático del JSON, no fetch), evitando I/O repetido.

---

## 3. Proveedor y modelo de IA

**Decisión: Google Gemini API — `text-embedding-004` (o el modelo de embeddings vigente equivalente) para el corpus, y un modelo de la familia `gemini-*-flash` para el chat.**

Criterios de selección, en orden:
1. **Coste cero:** proyecto de portfolio sin monetización → se exige tier gratuito, no "más barato". Gemini ofrece un free tier con límites de requests por minuto/día suficientes para el tráfico esperado (bajo, uso puntual de visitantes del portfolio).
2. **Un solo proveedor para embeddings y chat:** minimiza el número de claves, cuentas y dependencias de SDK — un único `GEMINI_API_KEY`, un único SDK (`@google/genai`).
3. **Encaje con Vercel:** SDK Node/REST estándar, sin requisitos de Edge Runtime.

**Alternativas consideradas y descartadas:**
- **Groq:** chat gratuito y muy rápido, pero no ofrece API de embeddings — obligaría a combinar dos proveedores distintos, contradiciendo el criterio de simplicidad.
- **Hugging Face Inference API:** cubre ambos (embeddings y chat) en tier gratuito, pero calidad y latencia de los modelos de chat gratuitos disponibles son más variables que las de Gemini Flash.
- **Embeddings locales (p. ej. `@xenova/transformers`) + Gemini solo para chat:** válida como plan B si en el futuro el tier gratuito de embeddings de Gemini resultara insuficiente o cambiara de condiciones; se descarta como primera opción porque añade una dependencia de inferencia local sin necesidad inmediata, dado que el volumen de embeddings (251 llamadas, generadas una vez o esporádicamente) encaja sin problema en el tier gratuito.

**Nota de riesgo:** los límites y condiciones del tier gratuito de Gemini pueden cambiar. Antes del Paso 0 del plan de implementación, confirmar las cifras vigentes (requests por minuto/día) en la documentación oficial de Google AI Studio.

El volumen de generación de embeddings es un coste único (o esporádico, si se regeneran) de 251 llamadas. El uso recurrente real es la generación de respuesta por consulta de usuario, acotado por el rate limiting descrito en el punto 7.

---

## 4. Dónde vive la lógica de servidor

**Decisión: API route de Next.js (`pages/api/chat.ts`), no una función serverless de Vercel separada del proyecto Next.**

El proyecto ya está en el router `pages/`, y una API route de Next.js *es* una función serverless de Vercel al desplegar — no hay beneficio en desacoplarla en un proyecto/función independiente. Mantenerla dentro de `pages/api/` conserva un único repo, un único deploy, y evita gestionar CORS entre orígenes distintos.

La API route:
- Recibe la pregunta del usuario.
- Calcula el embedding de la pregunta (misma llamada al proveedor que en build time).
- Selecciona los N Pokémon más similares (top-k, p. ej. 5) del JSON estático por similitud coseno.
- Construye un prompt con ese contexto acotado + la pregunta del usuario.
- Llama al modelo de chat y devuelve la respuesta.

**Ninguna clave de API se referencia desde código de cliente.** Todo el acceso al proveedor de IA ocurre exclusivamente en el handler de la API route, que corre en servidor.

---

## 5. Gestión de secretos

**Decisión: variable de entorno `AI_PROVIDER_API_KEY` (nombre exacto a definir según proveedor elegido) en `.env.local` para desarrollo (ya gitignored por la plantilla de Next.js — verificar que `.env*.local` esté en `.gitignore`) y en el panel de Environment Variables de Vercel para producción/preview.**

Nunca se hardcodea, nunca se commitea, nunca se expone con el prefijo `NEXT_PUBLIC_` (ese prefijo la incluiría en el bundle de cliente). Se añade una entrada en `.env.example` con el nombre de la variable vacío, para documentar el requisito sin filtrar el valor.

---

## 6. Integración de UI

**Decisión: un componente de chat flotante/expandible (`components/PokedexChat.tsx` + `PokedexChat.module.css`), reutilizando la estética 8-bit ya establecida en `PokemonCard` y la página de detalle, no un rediseño de esas piezas.**

- Tipografía, bordes y paleta: reutilizar las variables/clases ya definidas en `styles/Home.module.css` y `styles/PokemonDetail.module.css` en vez de introducir un sistema visual nuevo.
- Ubicación: accesible desde la home (`pages/index.tsx`), como un panel o botón flotante estilo "consola" retro, coherente con el resto del layout 8-bit — no un widget de chat genérico tipo Intercom.
- Estado de carga/espera de respuesta: usar el mismo lenguaje visual "8-bit" (p. ej. animación de carga con sprites o texto tipo terminal), no un spinner genérico.
- Claro/oscuro: el proyecto actual no tiene theming claro/oscuro implementado (no se encontró lógica de tema en `pages/`); el chat no necesita lógica de tema propia mientras esto no exista. Si en el futuro se añade modo oscuro al proyecto, el componente debe heredar las mismas variables CSS que el resto, no definir las suyas.

---

## 7. Manejo de errores y límites

**Decisión: mismo criterio que el formulario de contacto del portfolio — rate limiting best-effort por IP, sin infraestructura externa, y degradación visible sin romper la página.**

- **Rate limiting:** contador en memoria por IP dentro de la función serverless (ventana simple, p. ej. máximo N preguntas por minuto por IP). No se usa Redis ni ningún store externo — se acepta que, al ser funciones serverless efímeras, el contador no es perfectamente consistente entre invocaciones frías; es una barrera de "best-effort" contra abuso trivial, no un sistema de cuotas robusto, igual que en el formulario de contacto.
- **Fallos del proveedor de IA** (timeout, error 5xx, rate limit del proveedor): la API route responde con un error controlado (p. ej. 503 con mensaje corto) y el componente de chat muestra un mensaje de error en el propio estilo 8-bit ("La Pokédex no responde ahora mismo, inténtalo de nuevo"), sin romper el resto de la página ni lanzar una excepción no capturada en cliente.
- **Entradas vacías o inválidas:** validación mínima en la API route (longitud máxima de la pregunta, rechazo de payload vacío) antes de gastar una llamada al proveedor.

---

## 8. Testing

**Se prueba (lógica, no UI visual):**
- Construcción del contexto: dado un embedding de pregunta y el JSON de embeddings, que la función de similitud coseno devuelva los top-k Pokémon esperados para casos conocidos.
- Construcción del prompt: que el texto de contexto inyectado contenga exactamente los datos de los Pokémon seleccionados, sin fugas de otros campos ni de la clave de API.
- Parsing de la respuesta del proveedor: manejo de respuesta válida, respuesta vacía, y error del proveedor (mockeando el cliente del proveedor, sin llamadas reales en tests).
- Rate limiting: que una IP que supera el límite reciba el error esperado, y que el contador se resetee según la ventana definida.

**No se prueba:**
- Estilos visuales del componente de chat (posición, animaciones 8-bit) — se valida manualmente en navegador, como el resto del proyecto.
- Calidad subjetiva de las respuestas del modelo — se valida manualmente con un set de preguntas de ejemplo durante el desarrollo, no con aserciones automatizadas sobre lenguaje natural libre.
