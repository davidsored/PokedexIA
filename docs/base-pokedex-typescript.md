# Base de Pokédex en TypeScript

## Resumen

Se implementó una base funcional para una Pokédex en Next.js con TypeScript usando PokeAPI y Axios.

## Cambios realizados

- Instancia Axios centralizada en `lib/axios.ts`.
- Tipado de entidades principales de Pokémon en `types/pokemon.ts`.
- Componente reutilizable `PokemonCard` con props tipadas.
- Página principal (`pages/index.tsx`) con `getStaticProps` para los 151 Pokémon iniciales.
- Ruta dinámica (`pages/pokemon/[name].tsx`) con `getStaticPaths` y `getStaticProps`.
- Estilos con CSS Modules.

## Versión

- v0.1.0
