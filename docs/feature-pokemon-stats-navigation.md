# Feature: navegación a página de estadísticas por Pokémon

## Fecha
2026-05-15

## Resumen
Se reforzó la navegación desde cada tarjeta de la home para llevar al detalle del Pokémon y mostrar sus estadísticas base de forma clara en una página dedicada por ruta dinámica (`/pokemon/[name]`).

## Cambios implementados
- Se mantuvo el enlace de cada `PokemonCard` hacia `/pokemon/{name}` y se añadió el CTA visual **"Ver estadísticas"** para hacer explícita la acción al usuario.
- Se rediseñó la página `pages/pokemon/[name].tsx` para priorizar:
  - enlace de regreso a la Pokédex,
  - tipos del Pokémon,
  - listado de estadísticas base con barra visual proporcional.
- Se añadieron estilos CSS específicos para pills de tipos y barras de estadísticas responsivas.

## Impacto
- Mejora de UX: al hacer click en cualquier tarjeta, el usuario identifica mejor que llegará a una vista de estadísticas.
- La lectura de stats es más rápida gracias a representación numérica + barra visual.
