# CLAUDE.md — JUEGO-6 · "Misión: Cuerpo Humano"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `JUEGO-5` (último juego
> terminado con el formato EDINUN), no de `_PLANTILLA`. Aparece en el landing con
> `slug: "JUEGO-6-cuerpo-humano"`.

## Project

**Juego: "Misión: Cuerpo Humano".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). **TEMA 1 "Aparatos y sistemas del cuerpo
humano".** Enseña a **reconocer los aparatos/sistemas** del cuerpo y a **relacionar
cada uno con su función**.

**Audiencia: 9 años** (registrada en `memory/audiencia_por_juego.md`). Usa los
**términos reales** del libro (aparatos digestivo/respiratorio/excretor/reproductor;
sistemas circulatorio/muscular/óseo/inmunológico/nervioso/endócrino) y las **funciones
tomadas textual del libro**.

Mini-misión en **3 RONDAS** (descubrir → descubrir → relacionar):
- **Rondas 1 y 2 "Rayos X"** — la MISMA mecánica jugada 2 veces (una por ronda, con
  otro aparato/sistema): se pasa la lente de **rayos X** (un `<canvas>` oscuro que se
  borra al arrastrar) sobre la silueta para **revelar** el sistema y se **toca su
  nombre** entre 3 opciones. Al responder aparece **✓ verde** sobre la correcta y
  **✗ roja** sobre la que se eligió si falló.
- **Ronda 3 "Une cada aparato o sistema con su función"** — tocar un aparato/sistema y
  luego su función; se dibuja una **línea de color** (una distinta por fila, con los
  puntitos de ambos extremos a juego). Es la actividad "Une con líneas" del libro. Al
  completar las 4 uniones se **revela** (verde correcto / rojo incorrecto + la correcta
  en verde punteado) y **no se corrige**; el revelado se mantiene **~3.6 s** (con
  errores) / ~1.2 s (todo bien) para poder leerlo.

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

**9 ilustraciones de aparatos/sistemas** en `assets/` (generadas por el usuario,
caricatura **coral** de cuerpo entero, cuadradas, sin texto, fondo transparente):
`sis-digestivo.png` y `sis-respiratorio.png` (estas dos con la **cabeza de perfil**
para mostrar boca/faringe/laringe), `sis-circulatorio.png`, `sis-excretor.png`,
`sis-oseo.png`, `sis-nervioso.png`, `sis-muscular.png`, `sis-inmunologico.png`,
`sis-endocrino.png`. `SystemCard` las muestra **grandes** en R1/R2 (bajo la lente de
rayos X) y como miniatura (80 px) en cada nodo de R3; **si falta alguna, cae al emoji**
del sistema (`SYSTEMS[].emoji`) y el juego sigue jugable. El **Reproductor** (`👶`)
está en la lista del libro pero **no tiene imagen ni aparece en el juego** (marcado
`skipMatch:true`). Más los compartidos (`char-*.png`, `edinun-logo.*`).

> Para regenerar una imagen: mantener la caricatura coral de cuerpo entero, **sin
> ropa**, sistema dibujado directamente sobre el cuerpo, fondo transparente, cuadrada.

### Contrato del shell

- `app.jsx` enruta `home → character → game → results`. No tocar salvo cambio de
  shell coordinado.
- `screens.jsx`: personalizado — label del tema ("Aparatos y sistemas del cuerpo
  humano"), subtítulo ("Misión: Cuerpo Humano 🧠"), categoría (`cuerpo-humano`),
  glifos del fondo (🧠❤️🫁🦴💪🩸🫀🦷🦵) y guía por defecto **`quimica` (Mía)** (el
  shell arranca con `astronauta`, que se trata como "sin elegir").
- `game-screens.jsx`: la mecánica. `GameScreen`, `ResultsScreen`, `SystemCard`,
  `XrayCard`.

### Mecánica (`GameScreen`)

Tres fases con el estado `phase` (`"r1"` | `"r2"` | `"r3"`); HUD (logo + "Ronda" con
**3 dots** + ⏱ + ⭐), guía Mía con bocadillo a la izquierda, zona central centrada
(`left/right 183`, `space-evenly` desde `top:30`), REINICIAR/SALIR a la derecha,
overlay "¡EXCELENTE!/¡UPS!" y ResultsScreen imprimible.

- **Datos:** `SYSTEMS` = 10 aparatos/sistemas del libro con su `fn` (función textual)
  y `emoji`; los 4 con ilustración llevan `xray:true`; Reproductor lleva
  `skipMatch:true`. `XRAY` = pool de R1/R2 (solo los 4 con imagen: digestivo,
  respiratorio, circulatorio, excretor). `MATCHPOOL` = pool de R3 (todos menos los
  `skipMatch` → 9, sin Reproductor).
- **R1 y R2 (`pickIdentify(2)`)**: 2 sistemas del pool de rayos X (uno por ronda) + 3
  opciones (correcto + 2 distractores, todos dentro de los 4). `XrayCard` pinta una
  tapa oscura en `<canvas>` que se borra con `globalCompositeOperation="destination-out"`
  al arrastrar; al responder `forceReveal` limpia la tapa. Badge **✓/✗** sobre las
  opciones. Acierto → ⭐. → `phase r2` → `phase r3`.
- **R3 (`pickMatch`)**: 4 aparatos/sistemas de `MATCHPOOL` (izq, en orden) + sus
  funciones barajadas (der). `matchLink` mapea sistema→función (uso único). Líneas SVG
  con **color por fila** (`MLINE_COLORS`); los puntitos de ambos extremos combinan con
  su línea. Al completar las 4 se evalúa, se **revela** (verde/rojo + correcta punteada)
  y NO deja corregir. ⭐ = uniones correctas. Es la última ronda → `finish()`.
- **Anti-repetición POR RONDA** (§12): `RK_R1` (sistemas de rayos X, cap 2), `RK_R2`
  (sistemas de R3, cap 6). Se registra en `useEffect([])` y en REINICIAR.
- **Reporte:** el ítem de R1/R2 se registra como **"Rayos X"** (corto, 1 línea) para
  que la tabla de resultados no se desborde; el de R3 usa el nombre del sistema. El
  botón "Imprimir reporte" saca la hoja completa.
- **Hooks de test** (`data-answer`, `data-sys`, `data-fn`, `data-xray`) para QA con
  Playwright (inofensivos en producción).

Reglas EDINUN: fallar no baja progreso; al fallar se revela lo correcto (R1/R2 ✓/✗ +
nombre, R3 uniones); RONDA como J1 (§10); enunciados declarativos con punto (§8);
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
flujo completo (rayos X ×2 + une-con-líneas de colores) se prueba de verdad con
Playwright (devDependency): `pw-j6.js` (E2E de las 3 rondas) y `pw-j6-badge.js`
(badges ✓/✗ al fallar en Rayos X) en el scratchpad.
