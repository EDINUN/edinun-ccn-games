# CLAUDE.md — JUEGO-3 · "Estados del agua"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `JUEGO-2` (el último
> juego terminado con el formato EDINUN aprobado), no de `_PLANTILLA`. Aparece en
> el landing con `slug: "JUEGO-3-estados-del-agua"`.

## Project

**Juego: "Estados del agua".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). Pertenece al **TEMA 2 "El Sol, la Luna y
la vida en la Tierra"**: el Sol calienta y el frío enfría, y eso cambia el agua de
estado. Enseña los **tres estados del agua** (🧊 sólido / 💧 líquido / ☁️ gaseoso)
y que el **calor y el frío** los transforman.

Mecánica **decisión única por ronda** (estilo quiz, como JUEGO-1): cada ronda
muestra el estado actual del agua y pide convertirla a otro estado vecino
("Convierte el ☁️ vapor en 💧 Líquido"); el niño da **un solo toque** a
**❄️ ENFRIAR** (izquierda) o **☀️ CALENTAR** (derecha). Acierto → el agua se
transforma + ⭐. Fallo → se revela la acción correcta (verde) dejando ver la que
tocó (rojo) y pasa a la siguiente ronda. **3 rondas** elegidas al azar de un banco
de 4 transiciones, distintas en cada carga.

**Audiencia: 6 años** (registrada en `memory/audiencia_por_juego.md`). Más pequeña
que el típico CCNN 9-12 → poco texto, objetivos grandes, sin presión de tiempo, dos
botones enormes y una sola acción a la vez.

En móvil el diseño es horizontal pero el dispositivo se sostiene vertical: el
usuario gira físicamente el teléfono (overlay bloqueante hasta rotar).

- **Bitácora del proyecto:** `MEMORY.md`.
- **Preferencias del usuario** (usabilidad, QA responsive, invariantes): `USER.md`.
  **Léelo antes de cualquier cambio de UI o flujo.**

## Running / deploying

No build system, no package manager. HTML estático que carga React 18 + Babel
Standalone desde unpkg.

- **Abrir local:** doble clic en `index.html`.
- **Servir local:** `python -m http.server 8765` desde la raíz del repo.
- **Contador PHP real:** `php -S localhost:8000` desde esta carpeta.

## Architecture

Mismo shell que los demás juegos. Los 5 `.jsx` (`logo`, `characters`, `screens`,
`game-screens`, `app`) son la fuente editable. Tras editar, re-empaquetar:

```powershell
powershell -ExecutionPolicy Bypass -File .planning\bundle.ps1
```
o `python .planning/bundle.py` si hay Python real.

Invariantes:
- **No incluir `</script>` literal en ningún `.jsx`** (partir el token si hace falta).
- **El bundle reescribe desde `<script type="text/babel">` hasta `</html>`** — el
  `<title>` del `<head>` NO lo toca (se edita a mano en ambos HTML).

### Assets propios del juego

**Ninguno.** A diferencia de JUEGO-2 (que usa 4 ilustraciones de etapas), este juego
es **100% CSS + emoji**: el vaso de agua (`WaterView`) es un `<div>` con borde y un
relleno cuya altura/color cambia por estado. En **sólido/líquido** el emoji (🧊/💧)
va dentro del líquido; en **gaseoso** el relleno baja casi a cero, una **nube ☁️
flota dentro del vaso** y salen wisps 💨 por arriba (el agua se volvió vapor). **No
hubo que generar imágenes.** Solo usa los compartidos (`char-*.png`, `edinun-logo.*`).

### Contrato del shell

- `app.jsx` enruta por estado: `home → character → game → results`. No tocar salvo
  cambio de shell coordinado con los demás juegos.
- `screens.jsx`: `HomeScreen`, `CharacterScreen`, contador de visitas, `CosmosBg`.
  Personalizado: label del tema (el TEMA 2 "El Sol, la Luna y la vida en la Tierra"),
  subtítulo ("Estados del agua 💧"), categoría (`estados-del-agua`), glifos del fondo
  (💧🧊☁️❄️🌊🌧️💨⛄☀️) y la guía por defecto (`quimica` = Mía).
- `game-screens.jsx`: **la mecánica de este juego.** Define `GameScreen`,
  `ResultsScreen`, `WaterView` (el vaso) y el `PrintableReport`.

### Mecánica del juego (`GameScreen`)

Decisión única por ronda (quiz, como JUEGO-1) sobre el **formato EDINUN**: HUD
(logo + "Ronda" con dots centrado arriba + ⏱ tiempo + ⭐), **personaje guía con
bocadillo** a la izquierda, **zona central centrada** (enunciado + barra de los 3
estados + vaso de agua + 2 botones, repartido parejo con `space-evenly`) y columna
de botones a la derecha (REINICIAR/SALIR), overlay "¡EXCELENTE!/¡UPS!" y
**ResultsScreen tipo reporte académico imprimible**.

- **Estados** (`STATES`, índice = escala de temperatura): `0 sólido 🧊 → 1 líquido
  💧 → 2 gaseoso ☁️`. Cada estado tiene `label` (Sólido/Líquido/Gaseoso, formal) y
  `corto` (hielo/agua/vapor, palabra de niño).
- **Banco de rondas** (`ROUND_BANK`, 4 transiciones de UN paso entre vecinos):
  `{1→0}` agua→hielo (ENFRIAR), `{0→1}` hielo→agua (CALENTAR), `{1→2}` agua→vapor
  (CALENTAR), `{2→1}` vapor→agua (ENFRIAR). Cada partida elige **N=3 barajadas** con
  `pickRounds` evitando las recientes (`RECENT_KEY`) → **distinto en cada carga**.
- **Acción correcta** = `correctActionFor(rd)`: `goal > start` → CALENTAR; si no →
  ENFRIAR. El niño da **un toque**: acierto → `setCur(goal)` (el agua se transforma),
  ⭐, overlay "¡EXCELENTE!"; fallo → primero se **revela** (aro verde en el botón
  correcto, rojo en el tocado, meta en verde en la barra, bocadillo "¡Casi! Mira la
  respuesta.") y ~1 s después el overlay "¡UPS!" con la pista, luego avanza. **No baja
  el progreso**; al terminar (acierte o no) `incrementGamesCompleted()` y `go("results")`.
- **Enunciado** nombra el estado actual: "Convierte el {emoji corto} en {meta}" (p.
  ej. "Convierte el ☁️ vapor en 💧 Líquido"), con la meta en dorado.
- **Barra de estados:** actual en dorado; meta en verde **punteado** (→ verde sólido
  al revelar). Botones **ENFRIAR (izq) · CALENTAR (der)** para seguir el orden de la
  barra (🧊 frío ← → ☁️ calor).
- El reporte lista las 3 rondas: meta, acción correcta y ✓/✗ (acierto/fallo).
- REINICIAR / "jugar otra vez" vuelven a barajar (`pickRounds`, distinto a lo recién
  jugado).

Reglas EDINUN que la mecánica respeta (ver `USER.md` y `memory/aprendizajes-de-diseno.md`):
- Fallar no baja el progreso ya ganado; completar las 3 rondas cuenta como éxito.
- Al fallar, **revelar la acción correcta** (verde) dejando ver la que tocó (rojo).
- Indicador de RONDA como JUEGO-1 (etiqueta + dots centrados arriba) — §10.
- Enunciado = la meta, no un título genérico de la mecánica — §11.
- Selección/orden barajados en cada carga con anti-repetición — §12.
- Salir/reiniciar siempre con modal.
- Bloque jugable **centrado en el eje X** con márgenes iguales (`left:183 / right:183`).
- Bocadillo **sin sombra oscura** (solo `inset 0 1px 0 rgba(255,255,255,0.08)`).
- `markFirstAttempt()` en el primer toque; `incrementGamesCompleted()` al terminar.

### Personajes

Catálogo compartido: Luna (astronauta), Bruno (naturalista), Mía (química), Tomi
(geólogo). **Personaje destacado en el landing y guía por defecto: `quimica`
(Mía)** — encaja con el tema (Mía es "maestra de los experimentos"). El niño puede
elegir otro guía en la pantalla de selección.

## Contador de visitas

`counter.php` (idéntico en todos los juegos) cuenta visitas globales; cae a
`localStorage` si el servidor no ejecuta PHP. No personalizar. `visits.txt` está
gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Antes de declarar completo, capturar el flujo en al menos: 1920×1080, 1280×800,
1024×768, 768×1024, 667×375, 375×667.
