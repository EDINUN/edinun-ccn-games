# CLAUDE.md — JUEGO-1 · "El ciclo de la vida"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `_PLANTILLA/`.
> Aparece en el landing con `slug: "JUEGO-1-ciclo-vital-animales"`.

## Project

**Juego: "El ciclo de la vida".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). Enseña el **ciclo vital de los animales**
(TEMA 2 del libro): cómo nacen (ovíparos / vivíparos), cómo crecen y la
metamorfosis (mariposa, rana, gallina). Mecánica **"Mira y toca"**: una consigna
corta + 3 opciones con emoji grande; el niño toca la correcta.

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
- **El bundle reescribe desde `<script type="text/babel">` hasta `</html>`**.

### Contrato del shell

- `app.jsx` enruta por estado: `home → character → game → results`. No tocar salvo
  cambio de shell coordinado con los demás juegos.
- `screens.jsx`: `HomeScreen`, `CharacterScreen`, contador de visitas, `CosmosBg`.
  Personalizado: label del tema, subtítulo, categoría y glifos del fondo (animalitos).
- `game-screens.jsx`: **la mecánica de este juego.** Define `GameScreen` y
  `ResultsScreen`.

### Mecánica del juego (`GameScreen`)

"Mira y toca" montada sobre el **formato EDINUN** (clonado de `edinun-language/
juego-1`): HUD (logo + "RONDA" con dots + ⏱ tiempo + ⭐), **personaje guía con
bocadillo de pista** a la izquierda, cartel central con emoji en marco dorado, 3
opciones tipo **ficha candy** (128×128), columna de botones a la derecha
(REINICIAR/SALIR), overlay de feedback "¡EXCELENTE!/¡UPS!" y **ResultsScreen tipo
reporte académico imprimible**.

- Cada partida son **4 RONDAS** elegidas al azar de un banco de **12** preguntas
  (`PREGUNTAS`), evitando las vistas recientemente (`localStorage`,
  `RECENT_KEY`): **recargar o cambiar de niño NO repite** las mismas preguntas.
- El niño TOCA la opción correcta directo (no hay VERIFICAR/BORRAR). **Acierto** →
  ficha verde + ⭐ + "¡EXCELENTE!". **Fallo** → revela la correcta (verde)
  dejando ver la tocada (rojo), overlay "¡UPS!"; **no resta** progreso.
- Sin chip de tema en el HUD (solo se usa cuando hay 2+ niveles). Hay timer
  informativo (no penaliza ni limita).
- El banco cubre: ovíparo vs vivíparo, tomar leche, metamorfosis (mariposa, rana)
  y secuencia de la gallina. La posición de la correcta varía por pregunta.

**Bug evitado:** `advance()` corre desde un `setTimeout`, así que recibe los
valores nuevos (`newLog/newAciertos/newStars`) por argumento — leerlos del closure
daría los viejos y perdería la última ronda en el reporte.

Reglas EDINUN que la mecánica respeta (ver `USER.md` y `memory/aprendizajes-de-diseno.md`):
- Fallar no baja el progreso; completar las 8 rondas cuenta como éxito.
- Al fallar, revelar la correcta dejando ver lo que tocó el niño.
- Salir siempre con modal.
- `markFirstAttempt()` en la primera respuesta; `incrementGamesCompleted()` al terminar.

### Personajes

Catálogo compartido: Luna (astronauta), Bruno (naturalista), Mía (química), Tomi
(geólogo). **Personaje destacado en el landing: `naturalista` (Bruno).**

## Contador de visitas

`counter.php` (idéntico en todos los juegos) cuenta visitas globales; cae a
`localStorage` si el servidor no ejecuta PHP. No personalizar. `visits.txt` está
gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Antes de declarar completo, capturar el flujo en al menos: 1920×1080, 1280×800,
1024×768, 768×1024, 667×375, 375×667.
