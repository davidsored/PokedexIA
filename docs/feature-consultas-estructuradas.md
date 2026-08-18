# Feature: consultas estructuradas para preguntas de superlativo

## Resumen

El chat respondía "no tengo esa información" a preguntas como *"¿cuál es el Pokémon más pesado de Johto?"*, aunque el dato estuviera en el catálogo. Ahora las resuelve correctamente ordenando las 251 fichas por el campo pedido.

## El problema

La búsqueda semántica recupera las fichas **más parecidas** a la pregunta, que no son necesariamente las que la **responden**.

Para *"el Pokémon más pesado de Johto"*, el embedding de la pregunta se parece a fichas de Pokémon grandes y legendarios, así que el top-6 devolvía Mewtwo, Lugia, Ho-Oh, Snorlax, Entei y Suicune. Steelix, que es la respuesta correcta con sus 400 kg, no entraba. El modelo, correctamente instruido para no inventar, admitía no disponer del dato.

Que una pregunta como *"¿qué Pokémon de tipo fuego tiene mejor ataque especial?"* sí funcionara antes fue en parte casualidad: los candidatos correctos cayeron dentro del top-k.

Es una limitación estructural del top-k, no un fallo de configuración: subir `k` reduce la probabilidad de fallo pero no la elimina, y encarece cada consulta.

## La solución

Una capa de consulta estructurada **previa** a la búsqueda semántica:

1. `parseStructuredQuery` detecta si la pregunta es de superlativo, mediante palabras clave en español. Extrae:
   - el **campo numérico** (peso, altura, velocidad, ataque especial, total de estadísticas...),
   - la **dirección** (`más pesado` → descendente, `menos pesado` / `más ligero` → ascendente),
   - los **filtros** opcionales de tipo (18 tipos, en español e inglés) y de región (Kanto/Johto).
2. Si la detecta, `runStructuredQuery` filtra y ordena **el corpus completo** y devuelve las 5 primeras fichas, ya en el orden de la respuesta.
3. `buildPrompt` recibe además una descripción del ranking, de modo que el modelo sabe que la lista ya está calculada y puede afirmar cuál es el primero.
4. Si no la detecta, todo sigue como antes: embedding de la pregunta y búsqueda por similitud.

Es un detector por palabras clave, no un análisis sintáctico. El dominio es cerrado —18 tipos, 2 regiones, 9 campos numéricos— y no justifica nada más complejo. Tampoco usa una llamada extra al modelo para extraer la intención: eso duplicaría latencia y consumo de cuota.

## Cambios realizados

- Nuevo `lib/structuredQuery.ts` con `parseStructuredQuery`, `runStructuredQuery` y `describeStructuredQuery`.
- `lib/semanticSearch.ts`: `CorpusEntry` incluye ahora `types`, `region`, `height`, `weight`, `stats` y `statTotal`.
- `scripts/build-pokedex-corpus.ts`: genera esos campos y **reutiliza los embeddings** del corpus anterior cuando el texto de la ficha no cambia, para no gastar cuota regenerando vectores idénticos.
- `lib/chatPrompt.ts`: `buildPrompt` acepta un tercer parámetro opcional con la descripción del ranking.
- `pages/api/chat.ts`: elige entre la ruta estructurada y la semántica.
- Nuevo `lib/testFixtures.ts` para construir fichas de prueba completas sin repetir campos en cada archivo.
- Nuevo `lib/structuredQuery.test.ts` con 16 pruebas.

## Efecto secundario positivo

Las preguntas de superlativo **no necesitan vectorizar nada**, así que se ahorran una llamada a la API de embeddings: son más rápidas y consumen menos cuota que antes.

## Comportamiento verificado

| Pregunta | Respuesta | Correcto |
| --- | --- | --- |
| ¿Cuál es el Pokémon más pesado de Johto? | Steelix, 400 kg | Sí |
| ¿El más rápido de Kanto? | Electrode, 150 de velocidad | Sí |
| ¿Qué Pokémon de tipo agua tiene más defensa? | Cloyster, 180 de defensa | Sí |
| ¿Cuál es el Pokémon más ligero? | Gastly, 0,1 kg | Sí |
| Compárame a Charizard y Gyarados | Ruta semántica, sin cambios | Sí |
| ¿Qué habilidades tiene Pikachu? | Ruta semántica, sin cambios | Sí |

## Limitaciones que siguen vigentes

- Solo se cubren los campos numéricos del catálogo. Preguntas de conteo ("¿cuántos Pokémon de tipo agua hay?") o de agregación distinta de un extremo siguen resolviéndose por búsqueda semántica y pueden quedarse sin respuesta.
- La detección depende del vocabulario recogido en `FIELD_TERMS` y `TYPE_TERMS`. Una formulación muy alejada de esos términos cae en la ruta semántica, que es el comportamiento seguro: como mucho responde que no dispone del dato, nunca inventa.
