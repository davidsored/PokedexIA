# Feature: Pokédex Core (Fase 1)

## Resumen
Se implementó la base funcional de una Pokédex con Next.js y PokeAPI, incluyendo listado estático de los 151 Pokémon de Kanto y rutas dinámicas para detalle por nombre.

## Entregables implementados

### 1) Configuración Axios
- Archivo: `lib/axios.js`
- Se creó una instancia Axios con:
  - `baseURL`: `https://pokeapi.co/api/v2/`
  - `timeout`: `10000`
  - Header `Content-Type: application/json`

### 2) Componente `PokemonCard`
- Archivo: `components/PokemonCard.js`
- Muestra:
  - Nombre del Pokémon
  - ID formateado (`#001`, `#025`, etc.)
  - Imagen oficial (official-artwork)
- Incluye enlace a la ruta dinámica `/pokemon/[name]`.

### 3) Página principal con `getStaticProps`
- Archivo: `pages/index.js`
- Implementación:
  - `getStaticProps` consume `pokemon?limit=151&offset=0`.
  - Se mapea la respuesta para construir el arreglo `{ id, name }`.
  - Renderiza un grid de `PokemonCard`.
  - Revalidación ISR configurada en `86400` segundos.

### 4) Rutas dinámicas con `getStaticPaths`
- Archivo: `pages/pokemon/[name].js`
- Implementación:
  - `getStaticPaths` pre-renderiza los 151 Pokémon iniciales.
  - `fallback: false` para rutas cerradas al set pre-generado.
  - `getStaticProps` obtiene el detalle por nombre (`pokemon/{name}`).
  - Renderiza imagen oficial, ID, tipos y estadísticas base.

## Estilos
- Se agregaron estilos modulares:
  - `styles/PokemonCard.module.css`
  - `styles/Home.module.css`
  - `styles/PokemonDetail.module.css`

## Resultado
Queda disponible una Pokédex core funcional, estática y extensible para siguientes fases (búsqueda, paginación y filtros).


## Patch v0.1.1
- Se reemplazaron imágenes HTML por `next/image` en listado y detalle.
- Se configuró `next.config.ts` para permitir el dominio `raw.githubusercontent.com` en imágenes remotas.

## Patch v0.1.2
- Se removió `app/page.tsx` para evitar colisión de la ruta raíz (`/`) con `pages/index.js`.
