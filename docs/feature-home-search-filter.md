# Feature: buscador por nombre en la página principal

## Resumen

Se añadió un buscador en la home para filtrar en tiempo real el listado de Pokémon de Kanto conforme el usuario escribe el nombre.

## Cambios realizados

- Nuevo estado `searchTerm` en `pages/index.tsx` para capturar el valor del input.
- Nuevo `useMemo` (`filteredPokemons`) para filtrar por coincidencia parcial, ignorando mayúsculas/minúsculas.
- Nuevo campo `<input type="search">` en la sección de controles.
- Nuevo indicador de resultados: `Mostrando X de 151 Pokémon`.
- Ajustes de estilos en `pages/index.module.css` para el buscador y contador.

## Comportamiento

- Si el input está vacío, se muestran los 151 Pokémon.
- Si el usuario escribe texto, solo se muestran los Pokémon cuyo nombre incluye ese texto.
- El filtro funciona igual en **Modo Card** y **Modo Lista**.
