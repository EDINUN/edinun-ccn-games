# CLAUDE.md — JUEGO-2 · "La semilla"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `JUEGO-1` (que ya
> traía el formato EDINUN). Aparece en el landing con
> `slug: "JUEGO-2-la-semilla"`.

## Project

**Juego: "La semilla".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). Enseña **la semilla** (TEMA 2 del libro):
qué necesita para crecer (agua, sol, tierra), dónde se guardan las semillas (el
fruto), frutos con semillas, **dispersión** (viento, agua, animales) y **partes de
la planta** (raíz, hoja, flor). Se dejan fuera los términos abstractos del libro
(cotiledón, plúmula, micrópilo, radícula) por ser demasiado para la edad.

Mecánica **"Mira y toca"** con un giro temático: la pieza central es una **planta
que CRECE** con cada ronda (semilla → brote → tallito → plantita). El niño ve una
consigna corta + 3 opciones con emoji grande y toca la correcta.

**Audiencia: 6 años** (registrada en `memory/audiencia_por_juego.md`). Más pequeña
que el típico CCNN 9-12 → poco texto, objetivos grandes, sin presión de tiempo.

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

Además de los compartidos (`char-*.png`, `edinun-logo.*`), este juego usa **4
ilustraciones de las etapas de crecimiento** en `assets/`:

- `semilla.png` — semilla recién sembrada en la tierra.
- `brote.png` — brote (raíz hacia abajo, tallito hacia arriba).
- `tallito.png` — plántula con sus primeras hojas.
- `plantita.png` — plantita con varias hojas (sin flor).

El orden de etapa→archivo vive en `STAGE_FILES` (game-screens.jsx).

Estilo: **escena cuadrada completa** (cielo + tierra + planta), ilustración 2D
plana e infantil, **sin transparencia** (los generadores de chat fallaban al pedir
fondo transparente). El marco las muestra a pantalla completa (`object-fit: cover`)
como una ventanita de jardín. Si alguna falta, `GrowingPlant` cae a un emoji por
etapa (🫘 → 🌱 → 🌿 → 🪴) sobre un degradado cielo/tierra y el juego sigue jugable.

### Contrato del shell

- `app.jsx` enruta por estado: `home → character → game → results`. No tocar salvo
  cambio de shell coordinado con los demás juegos.
- `screens.jsx`: `HomeScreen`, `CharacterScreen`, contador de visitas, `CosmosBg`.
  Personalizado: label del tema, subtítulo, categoría y glifos del fondo
  (semilla/planta/frutos), y la guía por defecto (`quimica`).
- `game-screens.jsx`: **la mecánica de este juego.** Define `GameScreen`,
  `ResultsScreen` y el componente `GrowingPlant`.

### Mecánica del juego (`GameScreen`)

"Mira y toca" sobre el **formato EDINUN**: HUD (logo + "RONDA" con dots + ⏱ tiempo
+ ⭐), **personaje guía con bocadillo de pista** a la izquierda, **planta que crece
en el centro** (marco con cielo/tierra + rótulo de etapa), 3 opciones tipo **ficha
candy** (128×128), columna de botones a la derecha (REINICIAR/SALIR), overlay de
feedback "¡EXCELENTE!/¡UPS!" y **ResultsScreen tipo reporte académico imprimible**.

- Cada partida son **4 RONDAS** elegidas al azar de un banco de **12** preguntas
  (`PREGUNTAS`), evitando las vistas recientemente (`localStorage`,
  `RECENT_KEY = "edinun_ccn_semilla_recientes_v1"`): **recargar o cambiar de niño
  NO repite** las mismas preguntas.
- **La planta crece con la ronda** (`GrowingPlant stage={idx+1}`): ronda 1 =
  semilla … ronda 4 = plantita. Crecer depende de avanzar (no de acertar) → siempre
  es positivo y por eso **fallar NO baja el progreso**.
- El niño TOCA la opción correcta directo (no hay VERIFICAR/BORRAR). **Acierto** →
  ficha verde + ⭐ + "¡EXCELENTE!". **Fallo** → revela la correcta (verde)
  dejando ver la tocada (rojo), overlay "¡UPS!"; no resta progreso.
- Sin chip de tema en el HUD (solo se usa cuando hay 2+ niveles). Hay timer
  informativo (no penaliza ni limita).
- El banco cubre: necesidades de la semilla (agua/sol/tierra), el fruto guarda
  semillas, frutos con semillas (sandía, girasol), dispersión (viento/agua/animal)
  y partes de la planta (raíz/hoja/flor). La posición de la correcta varía.

**Bug evitado:** `advance()` corre desde un `setTimeout`, así que recibe los
valores nuevos (`newLog/newAciertos/newStars`) por argumento — leerlos del closure
daría los viejos y perdería la última ronda en el reporte.

Reglas EDINUN que la mecánica respeta (ver `USER.md` y `memory/aprendizajes-de-diseno.md`):
- Fallar no baja el progreso; completar las 4 rondas cuenta como éxito.
- Al fallar, revelar la correcta dejando ver lo que tocó el niño.
- Salir/reiniciar siempre con modal.
- `markFirstAttempt()` en la primera respuesta; `incrementGamesCompleted()` al terminar.

### Personajes

Catálogo compartido: Luna (astronauta), Bruno (naturalista), Mía (química), Tomi
(geólogo). **Personaje destacado en el landing y guía por defecto: `quimica`
(Mía)** — enmarcada como la científica que siembra una semilla y observa cómo crece.

## Contador de visitas

`counter.php` (idéntico en todos los juegos) cuenta visitas globales; cae a
`localStorage` si el servidor no ejecuta PHP. No personalizar. `visits.txt` está
gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Antes de declarar completo, capturar el flujo en al menos: 1920×1080, 1280×800,
1024×768, 768×1024, 667×375, 375×667.
