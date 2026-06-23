---
name: edinun-game-builder
description: >-
  Orquesta tareas que cruzan varios juegos del repo edinun-ccn-games (Ciencias
  Naturales): crear un juego nuevo desde la PLANTILLA, editar el shell compartido
  (app/characters/logo/styles/assets) propagándolo a todos los juegos, y
  regenerar el landing. Úsala siempre que la tarea toque MÁS de un juego o el
  shell común, o cuando se cree/renombre/elimine un juego. Para editar la
  mecánica de UN solo juego ya existente, no hace falta esta skill.
---

# edinun-game-builder

Skill de orquestación para `edinun-ccn-games`. Garantiza tres cosas que es fácil
romper trabajando juego por juego:

1. **El shell se mantiene idéntico** entre todos los juegos (`app.jsx`,
   `characters.jsx`, `logo.jsx`, `styles.css`, `assets/`).
2. **El landing (`index.html` raíz) refleja** los juegos reales de `juegos/`.
3. **Se aprueba antes de propagar** cambios que tocan varios juegos.

Lee primero el `CLAUDE.md` raíz (convenciones, contrato del shell, contador) y el
`USER.md` de la `_PLANTILLA` (preferencias e invariantes de diseño).

## Regla de aprobación previa

Antes de un cambio que toque más de un juego o el shell:

1. **Listar el impacto**: qué archivos y qué slugs de `juegos/` se modificarán.
2. **Esperar OK del usuario.**
3. Recién entonces aplicar y re-empaquetar.

Nunca propagar en silencio. Nunca añadir texto visible nuevo a la UI (rótulos,
títulos de ronda) sin confirmar — los nombres internos de los comentarios no son
para el niño (ver `memory/aprendizajes-de-diseno.md`).

## Tarea A — Crear un juego nuevo

Ver `references/crear-juego.md`. Resumen:

1. Confirmar con el usuario: tema, mecánica, **edad objetivo**, personaje
   destacado (`charId`).
2. Copiar `juegos/_PLANTILLA/` → `juegos/JUEGO-N-<slug>/` (N = siguiente ordinal
   libre; el slug en kebab-case coincide byte a byte con la entrada del landing).
3. Implementar la mecánica en `game-screens.jsx` respetando el contrato del shell
   y las invariantes de diseño. Personalizar los textos `// ← PERSONALIZAR` de
   `screens.jsx`.
4. Rellenar `CLAUDE.md`, `MEMORY.md` del juego y registrar la edad en
   `memory/audiencia_por_juego.md`.
5. Re-empaquetar (`bundle.ps1` / `bundle.py`) — verificar ambos HTML idénticos y
   sin `</script>` literal.
6. Registrar el juego en el array `GAMES` del landing (Tarea C).
7. QA responsive en los 6 viewports (ver `USER.md`).

## Tarea B — Editar el shell (propaga a TODOS los juegos)

Ver `references/editar-shell-y-landing.md`. Resumen:

1. Listar los slugs afectados (todo `juegos/` excepto que el usuario diga otra
   cosa) y pedir OK.
2. Aplicar el cambio en `_PLANTILLA/` primero (es la fuente canónica).
3. Replicar el archivo idéntico en cada `juegos/<slug>/`.
4. Si es `.jsx`, re-empaquetar cada juego.
5. Si es `styles.css`/`logo.jsx`/`characters.jsx`/asset, copiarlo también a la
   raíz (los usa el landing).
6. Si fue `logo.jsx` o `characters.jsx`, regenerar el landing (Tarea C).

## Tarea C — Regenerar el landing

Ver `references/editar-shell-y-landing.md`. El `index.html` raíz embebe inline
`logo.jsx` + `characters.jsx` y un literal `GAMES = [{ slug, title, charId }, ...]`.
Tras añadir/quitar/renombrar un juego, actualizar el array verificando:

- cada `slug:` coincide con un folder real en `juegos/` (y `_PLANTILLA` NUNCA va
  en `GAMES`),
- `charId` ∈ {`astronauta`, `naturalista`, `quimica`, `geologo`} y matchea al personaje destacado,
- el código inline de `logo`/`characters` coincide con el de los juegos.

## Después de cualquier tarea

- Recordar borrar `visits.txt` antes de subir a producción (`.gitignore` ya lo
  excluye de git).
- Actualizar `CHECK-JUEGOS.md` y `MEMORY.md` si corresponde.
