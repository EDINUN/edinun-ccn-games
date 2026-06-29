# CLAUDE.md — JUEGO-5 · "El viaje del agua"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `JUEGO-4` (último juego
> terminado con el formato EDINUN), no de `_PLANTILLA`. Aparece en el landing con
> `slug: "JUEGO-5-ciclo-del-agua"`.

## Project

**Juego: "El viaje del agua".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). **TEMA 3 "Ciclo vital del agua en la
naturaleza".** Enseña el **ciclo del agua** (evaporación → condensación →
precipitación → recolección) y el **cuidado del agua**.

**Audiencia: 8 años** (registrada en `memory/audiencia_por_juego.md`). Más grandes
que los juegos previos de 6 → usan los **términos reales** (evaporación,
condensación, precipitación, recolección) y aguantan más reto/texto.

Mini-recorrido en **3 RONDAS, cada una con una mecánica DISTINTA** (rampa
reconocer → ordenar → aplicar):
- **Ronda 1 "¿Qué proceso es?"** — quiz: muestra **1** escena del ciclo (imagen) y
  el niño toca el nombre del proceso entre 3 opciones. **Una sola pregunta.**
- **Ronda 2 "Ordena el ciclo"** — arrastra las 4 etapas a los casilleros 1·2·3·4
  (motor de JUEGO-2). **No se corrige en vivo**: al terminar revela el orden correcto.
- **Ronda 3 "Encuentra lo que gasta agua"** — toca las **fugas** (acciones que
  desperdician agua) en una grilla; las buenas no se tocan.

En móvil el diseño es horizontal pero el dispositivo se sostiene vertical (overlay
bloqueante hasta rotar).

- **Bitácora:** `MEMORY.md`. **Preferencias del usuario:** `USER.md` (léelo antes
  de cambios de UI).

## Running / deploying

HTML estático (React 18 + Babel Standalone desde unpkg). Abrir: doble clic en
`index.html`. Servir: `python -m http.server 8765` (raíz). Contador real:
`php -S localhost:8000` (esta carpeta). Re-empaquetar tras editar `.jsx`:
`powershell -ExecutionPolicy Bypass -File .planning\bundle.ps1`.

Invariantes: no `</script>` literal en `.jsx`; el bundle reescribe de
`<script type="text/babel">` a `</html>` (el `<title>` se edita a mano en ambos HTML).

### Assets propios del juego

**4 ilustraciones de las etapas del ciclo** en `assets/` (generadas por el usuario,
estilo limpio/icónico, escena cuadrada, sin texto): `evaporacion.png`,
`condensacion.png`, `precipitacion.png`, `recoleccion.png`. El orden etapa→archivo
vive en `STAGE_FILES` (índice = posición correcta del ciclo). El componente
`StageCard` las muestra; **si falta alguna, cae a un emoji** por etapa
(☀️/☁️/🌧️/🏞️ en `STAGE_EMOJI`) y el juego sigue jugable. Más los compartidos
(`char-*.png`, `edinun-logo.*`).

### Contrato del shell

- `app.jsx` enruta `home → character → game → results`. No tocar salvo cambio de
  shell coordinado.
- `screens.jsx`: personalizado — label del tema ("Ciclo vital del agua en la
  naturaleza"), subtítulo ("El viaje del agua 💧"), categoría (`ciclo-del-agua`),
  glifos del fondo (💧☁️🌧️☀️🌊❄️🏔️💨) y guía por defecto **`astronauta` (Luna)**.
- `game-screens.jsx`: la mecánica. `GameScreen`, `ResultsScreen`, `StageCard`.

### Mecánica (`GameScreen`)

Tres fases con el estado `phase` (`"r1"` | `"r2"` | `"r3"`); HUD (logo + "Ronda" con
3 dots + ⏱ + ⭐), guía Luna con bocadillo a la izquierda, zona central centrada
(`left/right 183`, `space-evenly` desde `top:30`), REINICIAR/SALIR a la derecha,
overlay "¡EXCELENTE!/¡UPS!" y ResultsScreen imprimible.

- **R1 (`pickIdentify`)**: 1 etapa al azar + 3 opciones; acierto → ⭐, fallo → revela
  el nombre correcto, avanza. → `phase r2`.
- **R2 (arrastre, motor J2)**: `placement[stageId]="tray"|0..3`, `toLogical`, `ghost`,
  `elementFromPoint`. **Sin feedback en vivo**: al colocar las 4 (gracia corta) se
  evalúa, se **revela el orden correcto** (casilleros verde/rojo + ✓/✗ + la etapa
  correcta en píldora verde debajo) ANTES del overlay, y NO deja corregir. ⭐ = posiciones correctas. → `phase r3`.
- **R3 "encuentra las fugas" (`pickScene` sobre `LEAK_BANK`)**: grilla de 3 fugas
  (`waste:true`) + 3 buenas (`waste:false`). Tocar una fuga = acierto → ficha
  **verde ✓** (¡Fuga!); tocar una buena = error → ficha **roja ✗** (convención:
  verde = acierto, rojo = error). Al hallar las 3 → resultados.
- **Anti-repetición POR RONDA** (§12): `RK_R1` (etapa), `RK_R2` (orden de bandeja),
  `RK_R3` (acciones). Se registra en `useEffect([])` y en REINICIAR. **Verificado
  con reload-test** (no repite al recargar).
- **Hooks de test** (`data-answer`, `data-stagecard`, `data-slot`, `data-waste`,
  `data-status`) para QA con Playwright (inofensivos en producción).

Reglas EDINUN: fallar no baja progreso; al fallar se revela lo correcto (R1 nombre,
R2 orden); RONDA como J1 (§10); enunciados declarativos con punto (§8); barajado
anti-repetición (§12); salir/reiniciar con modal; bloque centrado; `markFirstAttempt()`
en la 1ª acción; `incrementGamesCompleted()` al terminar.

### Personajes

Luna (astronauta), Bruno (naturalista), Mía (química), Tomi (geólogo). **Destacado y
guía por defecto: `astronauta` (Luna)** — el "planeta azul" (70% agua) encaja con el
viaje del agua. El niño puede elegir otro.

## Contador de visitas

`counter.php` (idéntico en todos los juegos); cae a `localStorage` si no hay PHP. No
personalizar. `visits.txt` gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Capturar el flujo en 1920×1080, 1280×800, 1024×768, 768×1024, 667×375, 375×667. El
flujo completo (quiz + arrastre + fugas) se prueba de verdad con Playwright
(devDependency): ver `pw-review-j5.js` / `pw-audit.js` en el scratchpad.
