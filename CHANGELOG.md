# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.1.0] - 2026-05-14

### Added
- Configuración base de Axios en `lib/axios.ts` apuntando a PokeAPI.
- Tipos TypeScript para datos de Pokémon (`types`, `stats`, `sprites`).
- Componente `PokemonCard` con props tipadas y estilos con CSS Modules.
- Página principal con listado de los primeros 151 Pokémon usando `getStaticProps`.
- Página dinámica de detalle de Pokémon con `getStaticPaths` y `getStaticProps`.
- Documentación del cambio en `docs/base-pokedex-typescript.md`.
