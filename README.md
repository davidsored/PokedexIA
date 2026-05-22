# PokedexIA

Pokedex interactiva construida con `Next.js`, `TypeScript` y `PokeAPI`, con una interfaz inspirada en estetica 8-bit para explorar Pokemon de `Kanto` y `Johto`.

## Vista General

PokedexIA es un proyecto orientado a portfolio que combina consumo real de datos desde `PokeAPI` con una UI retro personalizada.

Actualmente permite:

- Explorar `251` Pokemon de `Kanto` y `Johto`
- Buscar por nombre o ID
- Filtrar por tipo
- Filtrar por region
- Consultar una vista de detalle con stats, abilities y navegacion entre Pokemon

## Demo Visual

### Home

![Home de PokedexIA](docs/screenshots/home.png)

### Detalle

![Detalle de PokedexIA](docs/screenshots/detail.png)

## Features

- Home con estilo 8-bit y navegacion visual retro
- Busqueda por nombre o ID en tiempo real
- Filtros por tipo Pokemon
- Filtro lateral por regiones `Kanto` y `Johto`
- Tarjetas con sprites clasicos y tipos reales
- Vista de detalle con:
  - categoria del Pokemon
  - tipos
  - stats base con barras de color
  - abilities con descripcion real desde `PokeAPI`
  - navegacion entre Pokemon anterior y siguiente
- Generacion estatica con revalidacion para reducir llamadas repetidas

## Stack Tecnico

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Axios`
- `PokeAPI`
- `CSS Modules`
- `next/font/google`

## Estructura Del Proyecto

```txt
pages/
  index.tsx                 Home con filtros y listado principal
  pokemon/[name].tsx        Vista de detalle de cada Pokemon
components/
  PokemonCard.tsx           Tarjeta reutilizable del listado
lib/
  axios.ts                  Cliente HTTP base para PokeAPI
types/
  pokemon.ts                Tipos principales de datos
docs/
  *.md                      Documentacion tecnica y cambios por feature
```

## Instalacion

```bash
npm install
```

## Uso Local

Inicia el entorno de desarrollo:

```bash
npm run dev
```

Abre en el navegador:

```txt
http://localhost:3000
```

Ejemplo de pagina de detalle:

```txt
http://localhost:3000/pokemon/charizard
```

## Scripts Disponibles

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Fuente De Datos

Este proyecto consume datos desde la API publica oficial no comercial:

- `https://pokeapi.co/api/v2/`

Recursos usados en la aplicacion:

- `pokemon`
- `pokemon-species`
- `ability`

## Decisiones Tecnicas Relevantes

- La aplicacion usa `pages/` router de Next.js.
- El detalle de cada Pokemon se genera con `getStaticPaths` y `getStaticProps`.
- La home usa `getStaticProps` y revalida periodicamente.
- `next/image` esta configurado con `images.unoptimized = true` para evitar problemas de timeout con sprites remotos.
- La region actual se calcula por rango de ID para el alcance actual:
  - `1-151`: `Kanto`
  - `152-251`: `Johto`

## Roadmap

- Anadir mas regiones y generaciones
- Mejorar el acceso al filtro de regiones en movil
- Optimizar la carga de datos de la home si aumenta el numero de generaciones
- Anadir favoritos o comparador de Pokemon

## Creditos

- Datos: [PokeAPI](https://pokeapi.co/)
- Franquicia Pokemon: Nintendo / Creatures / Game Freak

## Licencia

Este proyecto se distribuye bajo licencia `MIT`. Consulta el archivo [LICENSE](LICENSE).
