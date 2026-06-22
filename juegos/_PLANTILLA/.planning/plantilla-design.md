# Cómo crear un juego nuevo desde `_PLANTILLA`

Guía rápida. La skill `edinun-game-builder` automatiza estos pasos; esto es la
referencia manual / lo que la skill hace por dentro.

## 1. Clonar la carpeta

Copiar `juegos/_PLANTILLA/` → `juegos/JUEGO-N-<slug>/` (N = siguiente ordinal
libre; `<slug>` en kebab-case, sin tildes ni espacios).

## 2. Reemplazar el contenido del juego

- **`game-screens.jsx`** — el corazón. Sustituir `DEMO_PREGUNTAS` por el contenido
  real, o reescribir `GameScreen` para otra mecánica (arrastrar, clasificar,
  ordenar, emparejar…). Conservar el contrato:
  - `GameScreen({ app, setApp, go })`, al terminar `go("results")`.
  - `ResultsScreen({ app, setApp, go })`.
  - `Object.assign(window, { GameScreen, ResultsScreen })` al final.
  - `markFirstAttempt()` en la primera respuesta; `incrementGamesCompleted()` al terminar.
- **`screens.jsx`** — ajustar solo los textos `// ← PERSONALIZAR` (label del tema,
  subtítulo, categoría) y, opcionalmente, los glifos del `CosmosBg`.
- **Personaje destacado** — definir el `charId` (mago/fisica/numero/geo) que mejor
  encaje con el tema; se usa en el landing.

## 3. Documentar

- `CLAUDE.md` y `MEMORY.md` del juego: reemplazar los `{{PLACEHOLDERS}}`.
- Registrar la edad objetivo en `memory/audiencia_por_juego.md` (raíz del repo).

## 4. Re-empaquetar

Desde la carpeta del juego:

```powershell
powershell -ExecutionPolicy Bypass -File .planning\bundle.ps1
```
o `python .planning/bundle.py`. Verifica que ambos HTML quedan idénticos y que
ningún `.jsx` contiene `</script>` literal.

## 5. Registrar en el landing

Añadir al array `GAMES` de `index.html` (raíz) una entrada
`{ slug, title, charId }`. El `slug` debe coincidir byte a byte con el folder.

## 6. QA responsive

Capturar el flujo en los 6 viewports (ver `USER.md`) antes de declararlo listo.

## 7. Antes de subir a producción

Borrar `visits.txt` si quedó de pruebas locales. Subir la carpeta completa
(`index.html` + `assets/` + `counter.php`).
