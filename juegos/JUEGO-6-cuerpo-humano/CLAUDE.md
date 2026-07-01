# CLAUDE.md — JUEGO-6 · "Misión: Cuerpo Humano"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `JUEGO-5` (último juego
> terminado con el formato EDINUN), no de `_PLANTILLA`. Aparece en el landing con
> `slug: "JUEGO-6-cuerpo-humano"`.

## Project

**Juego: "Misión: Cuerpo Humano".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). **TEMA 1 "Aparatos y sistemas del cuerpo
humano".** Enseña a **reconocer los sistemas** del cuerpo, **relacionar cada uno con
su función** y **ubicar los órganos** principales.

**Audiencia: 9 años** (registrada en `memory/audiencia_por_juego.md`). Usa los
**términos reales** de sistemas (digestivo, respiratorio, circulatorio, excretor,
óseo, nervioso) y órganos, con más reto/texto que los juegos de 6.

Mini-misión en **3 RONDAS, cada una con una mecánica DISTINTA** (rampa
reconocer → relacionar → ubicar):
- **Ronda 1 "¿Qué sistema es?"** — quiz: muestra la **imagen** de un sistema y el
  niño toca su **nombre** entre 3 opciones. **2 preguntas.**
- **Ronda 2 "Une cada sistema con su función"** — toca un sistema y luego su función;
  se dibuja una **línea**. Es la actividad "Une con líneas" del libro. Al completar
  las 4 uniones revela las correctas (verde) y las erradas (rojo + verde punteada al
  lugar correcto). **No se corrige.**
- **Ronda 3 "¿Dónde va cada órgano?"** — arrastra cada órgano (🧠❤️🫁🫘) a su zona en
  una **silueta del cuerpo (SVG)**. Si lo sueltas mal, **rebota** y **brilla en verde
  la zona correcta** (revelar). Al ubicarlos todos → resultados.

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

**6 ilustraciones de los sistemas** en `assets/` (generadas por el usuario, estilo
limpio/icónico, cuadradas, sin texto, fondo transparente): `sis-digestivo.png`,
`sis-respiratorio.png`, `sis-circulatorio.png`, `sis-excretor.png`, `sis-oseo.png`,
`sis-nervioso.png`. El componente `SystemCard` las muestra en la R1 (imagen grande)
y en la R2 (miniatura en cada nodo); **si falta alguna, cae al emoji** del sistema
(definido en `SYSTEMS[].emoji`) y el juego sigue jugable. **El cuerpo de la R3 y los
órganos son SVG/emoji** — no necesitan imágenes. Más los compartidos (`char-*.png`,
`edinun-logo.*`).

> Opcional 7º sistema: `sis-muscular.png` (Muscular). Para usarlo, añadir su entrada
> a `SYSTEMS` en `game-screens.jsx`.

### Contrato del shell

- `app.jsx` enruta `home → character → game → results`. No tocar salvo cambio de
  shell coordinado.
- `screens.jsx`: personalizado — label del tema ("Aparatos y sistemas del cuerpo
  humano"), subtítulo ("Misión: Cuerpo Humano 🧠"), categoría (`cuerpo-humano`),
  glifos del fondo (🧠❤️🫁🦴💪🩸🫀🦷🦵) y guía por defecto **`quimica` (Mía)** (el
  shell arranca con `astronauta`, que se trata como "sin elegir").
- `game-screens.jsx`: la mecánica. `GameScreen`, `ResultsScreen`, `SystemCard`,
  `BodySilhouette`, `OrganToken`.

### Mecánica (`GameScreen`)

Tres fases con el estado `phase` (`"r1"` | `"r2"` | `"r3"`); HUD (logo + "Ronda" con
3 dots + ⏱ + ⭐), guía Mía con bocadillo a la izquierda, zona central centrada
(`left/right 183`, `space-evenly` desde `top:30`), REINICIAR/SALIR a la derecha,
overlay "¡EXCELENTE!/¡UPS!" y ResultsScreen imprimible.

- **R1 (`pickIdentify(2)`)**: 2 sistemas al azar + 3 opciones; acierto → ⭐, fallo →
  revela el nombre correcto, avanza. → `phase r2`.
- **R2 (`pickMatch`)**: 4 sistemas (izq) + sus funciones barajadas (der). `r2Link`
  mapea sistema→función (uso único). Al completar las 4 se evalúa, se **revela** y NO
  deja corregir. Líneas en SVG; ⭐ = uniones correctas. → `phase r3`.
- **R3 (`pickOrganTray`)**: arrastre con `toLogical`/`ghost`/`elementFromPoint` (como
  J5 R2). Cada órgano tiene su zona `data-zone`; soltar en la correcta lo coloca,
  soltar mal **rebota + brilla la zona correcta** (`r3Hint`). Al ubicar todos →
  resultados.
- **Anti-repetición POR RONDA** (§12): `RK_R1` (sistemas), `RK_R2` (sistemas usados),
  `RK_R3` (orden de bandeja). Se registra en `useEffect([])` y en REINICIAR.
  **Verificado con reload-test** (4/4 distintos en las 3 rondas).
- **Hooks de test** (`data-answer`, `data-sys`, `data-fn`, `data-organ`, `data-zone`)
  para QA con Playwright (inofensivos en producción).

Reglas EDINUN: fallar no baja progreso; al fallar se revela lo correcto (R1 nombre,
R2 uniones, R3 zona); RONDA como J1 (§10); enunciados declarativos con punto (§8);
barajado anti-repetición (§12); salir/reiniciar con modal; bloque centrado;
`markFirstAttempt()` en la 1ª acción; `incrementGamesCompleted()` al terminar.

### Personajes

Luna (astronauta), Bruno (naturalista), Mía (química), Tomi (geólogo). **Destacado y
guía por defecto: `quimica` (Mía)** — la "científica" encaja con anatomía/biología
("MI EXPERIENCIA con Biología" del libro). El niño puede elegir otro.

## Contador de visitas

`counter.php` (idéntico en todos los juegos); cae a `localStorage` si no hay PHP. No
personalizar. `visits.txt` gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Capturar el flujo en 1920×1080, 1280×800, 1024×768, 768×1024, 667×375, 375×667. El
flujo completo (quiz + une-con-líneas + arrastre al cuerpo) se prueba de verdad con
Playwright (devDependency): ver `pw-j6.js` / `pw-j6-reveal.js` / `pw-j6-audit.js` en
el scratchpad.
