# CLAUDE.md — JUEGO-2 · "La semilla"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `JUEGO-1` (que ya
> traía el formato EDINUN). Aparece en el landing con
> `slug: "JUEGO-2-la-semilla"`.

## Project

**Juego: "La semilla".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). Enseña la **secuencia de germinación de
la semilla** (TEMA 2 del libro, actividad "ordena la germinación"): cómo crece
paso a paso, de semilla a plantita.

Mecánica **"Ordena la germinación"**: el niño **arrastra** las 4 imágenes de la
planta a sus casilleros numerados (1·2·3·4) en el orden correcto
(semilla → brote → tallito → plantita). Funciona con mouse y táctil.

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
- `plantita.png` — plantita ya crecida (la que subió el usuario tiene una flor de
  colores; aprobada así).

El orden de etapa→archivo vive en `STAGE_FILES` (game-screens.jsx).

Estilo: **escena cuadrada completa** (cielo + tierra + planta), ilustración 2D
plana e infantil, **sin transparencia** (los generadores de chat fallaban al pedir
fondo transparente). El componente `PlantCard` las muestra a pantalla completa
(`object-fit: cover`) como una ventanita de jardín. Si alguna falta, cae a un emoji
por etapa (🫘 → 🌱 → 🌿 → 🪴) sobre un degradado cielo/tierra y el juego sigue jugable.

### Contrato del shell

- `app.jsx` enruta por estado: `home → character → game → results`. No tocar salvo
  cambio de shell coordinado con los demás juegos.
- `screens.jsx`: `HomeScreen`, `CharacterScreen`, contador de visitas, `CosmosBg`.
  Personalizado: label del tema, subtítulo, categoría y glifos del fondo
  (semilla/planta/frutos), y la guía por defecto (`quimica`).
- `game-screens.jsx`: **la mecánica de este juego.** Define `GameScreen`,
  `ResultsScreen` y los componentes `PlantCard` (foto de etapa) y `Draggable`.

### Mecánica del juego (`GameScreen`)

"Ordena la germinación" sobre el **formato EDINUN**: HUD (logo + ⏱ tiempo + ⭐),
**personaje guía con bocadillo** a la izquierda, **4 casilleros numerados**
(1·2·3·4) arriba y una **bandeja** con las 4 fotos barajadas abajo; columna de
botones a la derecha (REINICIAR/SALIR), overlay de feedback "¡EXCELENTE!/¡CASI!" y
**ResultsScreen tipo reporte académico imprimible**.

- El niño **arrastra** cada foto a su casillero. El arrastre usa **Pointer Events**
  (mouse + táctil). Como el lienzo lógico 900×540 se escala con `transform`, se
  convierten las coords de pantalla a lógicas con el rect de `rootRef` (`toLogical`).
  Una **tarjeta fantasma** (`ghost`) sigue al dedo; al soltar se usa
  `document.elementFromPoint` + `closest('[data-slot]')` para detectar el casillero.
  Las tarjetas llevan `touch-action: none` para no hacer scroll al arrastrar.
- Estado: `placement[stageId] = "tray" | 0..3`. Soltar sobre un casillero ocupado
  **devuelve** al ocupante a la bandeja; soltar sobre la bandeja saca la foto del
  casillero; soltar fuera la deja donde estaba.
- Al colocar las **4**, se evalúa: casillero correcto si `slot[i] === i`. **Acierto
  total** → "¡EXCELENTE!". Con errores → **revela el orden correcto** (casilleros
  verdes/rojos + rótulo de la etapa correcta), "¡CASI!"; **no resta** progreso. Las
  ⭐ = posiciones correctas.
- El reporte lista las **4 posiciones**: lo que puso el niño vs. lo correcto.
- Solo hay una secuencia correcta; REINICIAR / "jugar otra vez" **barajan** la
  bandeja para que nunca empiece resuelta (`initialTrayOrder`).

Reglas EDINUN que la mecánica respeta (ver `USER.md` y `memory/aprendizajes-de-diseno.md`):
- Fallar no baja el progreso; completar la secuencia cuenta como éxito.
- Al fallar, revelar el orden correcto dejando ver lo que puso el niño.
- Salir/reiniciar siempre con modal.
- `markFirstAttempt()` en el primer arrastre; `incrementGamesCompleted()` al evaluar.

### Personajes

Catálogo compartido: Luna (astronauta), Bruno (naturalista), Mía (química), Tomi
(geólogo). **Personaje destacado en el landing y guía por defecto: `naturalista`
(Bruno)** — encaja con el tema (Bruno es "amigo de plantas y animales"). El niño
puede elegir otro guía en la pantalla de selección.

## Contador de visitas

`counter.php` (idéntico en todos los juegos) cuenta visitas globales; cae a
`localStorage` si el servidor no ejecuta PHP. No personalizar. `visits.txt` está
gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Antes de declarar completo, capturar el flujo en al menos: 1920×1080, 1280×800,
1024×768, 768×1024, 667×375, 375×667.
