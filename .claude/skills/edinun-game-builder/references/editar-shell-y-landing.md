# Referencia — Editar el shell y regenerar el landing

## Archivos del shell (idénticos entre todos los juegos)

- `app.jsx` — router por estado + DeviceStage (escala/centrado, lock portrait,
  pinch-zoom). **No tocar sin razón fuerte**; cambiarlo afecta a todos los juegos.
- `characters.jsx` — catálogo y render de personajes (PNG + sparkles).
- `logo.jsx` — logo EDINUN.
- `styles.css` — paleta y tipografía (`--ed-*`), clases `ed-*`.
- `assets/` — `char-*.png`, `edinun-logo.*`.

`screens.jsx` y `game-screens.jsx` **no** son shell puro: tienen partes
personalizables por juego (textos / mecánica). Al propagar un cambio del shell,
no pisar esas personalizaciones — propagar solo la parte común.

## Procedimiento para un cambio de shell

1. **Listar impacto y pedir OK**: nombrar el archivo y todos los slugs de
   `juegos/` que se regenerarán.
2. **Editar `_PLANTILLA/` primero** (fuente canónica).
3. **Replicar idéntico** en cada `juegos/<slug>/`.
4. Si el archivo es `.jsx` → **re-empaquetar cada juego** (`bundle.ps1`/`.py`).
5. Si es `styles.css`, `logo.jsx`, `characters.jsx` o un asset → **copiarlo
   también a la raíz** (los usa el landing).
6. Si fue `logo.jsx` o `characters.jsx` → **regenerar el landing**.

## Regenerar el landing (`index.html` raíz)

El landing embebe inline:
- el código completo de `logo.jsx` + `characters.jsx` (idéntico al de los juegos),
- un literal `const GAMES = [{ slug, title, charId }, ...]` — un card por juego.

Al regenerar, verificar:
- cada `slug:` coincide **byte a byte** con un folder real en `juegos/`,
- **`_PLANTILLA` nunca aparece en `GAMES`**,
- `charId` ∈ {`astronauta`, `naturalista`, `quimica`, `geologo`} y matchea al personaje destacado
  del juego,
- el `<title>`, subtítulo y favicon siguen apuntando a CCNN y a `./assets/`,
  `./styles.css`, `./edinun-logo.png` (rutas relativas a la raíz).

El landing carga su logo/CSS/PNG desde la **raíz** del repo, por eso se mantienen
copias maestras de `styles.css`, `edinun-logo.png` y `assets/` ahí.

## Checklist final

- [ ] Todos los HTML de los juegos tocados re-empaquetados e idénticos entre sí
      (`index.html` == `EDINUN GAMES.html`).
- [ ] Ningún `.jsx` contiene `</script>` literal.
- [ ] Landing abre y lista los juegos correctos.
- [ ] `CHECK-JUEGOS.md` actualizado si cambió la cobertura.
