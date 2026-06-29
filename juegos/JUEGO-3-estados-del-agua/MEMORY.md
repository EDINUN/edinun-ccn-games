# MEMORY.md — Bitácora · JUEGO-3 "Estados del agua"

Bitácora de decisiones de diseño, bugs y resoluciones, en orden cronológico
(fecha ISO). Una entrada por hito.

## 2026-06-24 — Creación desde `JUEGO-2`

- Clonado de `juegos/JUEGO-2-la-semilla/` (el último juego terminado con el formato
  EDINUN aprobado), no de `_PLANTILLA`. Se limpiaron `visits.txt`, las capturas de
  QA y los PNG de planta de JUEGO-2.
- **Tema:** TEMA 2 del libro, "El Sol, la Luna y la vida en la Tierra". Tras barajar
  varias ideas (clasificar Sol/Luna, etc.) el usuario decidió enfocarlo en los
  **estados del agua**, "algo divertido", **exactamente 3 rondas**.
- **Mecánica elegida (la propuse yo con bosquejo en bloque de texto, el usuario la
  aprobó): "Calienta y enfría el agua".** El niño toca **☀️ CALENTAR** o
  **❄️ ENFRIAR** y el agua cambia de estado en la escala de temperatura
  `🧊 sólido → 💧 líquido → ☁️ gaseoso`. Cada ronda da una meta. 3 rondas
  (`ROUNDS = [{1→0},{1→2},{0→2}]`), de fácil a un pasito más.
- **Audiencia: 6 años.** Decisiones derivadas:
  - Una sola acción a la vez: dos botones enormes (CALENTAR naranja, ENFRIAR azul).
  - Barra de los 3 estados siempre visible: actual con borde dorado, meta con borde
    verde punteado → el niño ve dónde está y a dónde ir.
  - Sin presión de tiempo (el ⏱ es solo informativo para el reporte).
  - Lenguaje simple: "Usa el Sol y el hielo para cambiar el agua".
- **Sin imágenes generadas:** todo el vaso de agua (`WaterView`) es CSS + emoji
  (relleno con altura/color por estado, emoji dentro, vapor ☁️💨 saliendo en
  gaseoso). No hizo falta avisar al usuario para generar assets.
- **Personaje destacado y guía por defecto: Mía (`quimica`)** — "maestra de los
  experimentos", encaja con calentar/enfriar. Cambiado en `screens.jsx` (default sel)
  y en el card del landing.
- **Personalización de `screens.jsx`:** glifos del fondo a emojis de agua
  (💧🧊☁️❄️🌊🌧️💨⛄☀️), label "EDINUN · Estados del agua", subtítulo
  "Calienta y enfría el agua 💧", `currentCategory: "estados-del-agua"`.
- **`<title>`** de ambos HTML → "EDINUN GAMES — Estados del agua" (editado a mano, el
  bundle no lo toca). Bundle OK.
- **Invariantes ya heredadas correctas desde el día 1** (por clonar de JUEGO-2 y por
  los aprendizajes de base): bloque centrado en X con márgenes iguales
  (`left:183 / right:183`), bocadillo sin sombra oscura, modales en salir/reiniciar,
  fallar no penaliza. No hubo que corregirlas después.

## 2026-06-24 — Aprobación, landing y commit

- El usuario probó el juego construido (doble clic en `index.html`) y lo aprobó.
- Añadido al landing raíz: `{ slug: "JUEGO-3-estados-del-agua", title: "Estados del agua", charId: "quimica" }`.
- Registrada la audiencia (6 años) en `memory/audiencia_por_juego.md`.
- Docs del juego (CLAUDE.md, MEMORY.md) reescritos desde el contenido heredado de
  JUEGO-2.

## 2026-06-29 — Rediseño a "decisión única" + pulido tras feedback

Sesión de peros del usuario sobre el JUEGO-3 ya construido. Cambios:

- **Centrado y reparto vertical:** la zona central quedaba corrida y con una banda
  muerta arriba. Se centró en el eje X (`left:183/right:183`) y se subió la columna
  (`top:30`) con `space-evenly` → huecos iguales de arriba a abajo (≈39px).
- **RONDA como JUEGO-1:** se cambió la píldora con caja por la etiqueta "Ronda" +
  dots centrados arriba; HUD con logo izq y ⏱+⭐ der (aprendizaje base §10).
- **Enunciado = la meta** (no el título genérico): se quitó "Calienta y enfría el
  agua" y el texto grande pasó a ser "Convierte el {actual} en {meta}" (§11). Luego
  el enunciado pasó a **nombrar el estado actual** (corto: hielo/agua/vapor) porque
  "convierte el agua" confundía cuando el vaso mostraba vapor/hielo.
- **Mecánica → decisión única (quiz, como JUEGO-1).** El usuario pidió que al elegir
  mal salga el error y se avance. Se reemplazó el "deslizar paso a paso" por: cada
  ronda una sola decisión (ENFRIAR/CALENTAR), acierto transforma + ⭐, fallo revela
  (verde/rojo) y avanza. `ROUND_BANK` de 4 transiciones de un paso; acción correcta
  deducida (`correctActionFor`). Reporte con ✓/✗ + acción correcta.
- **Botones ENFRIAR (izq) · CALENTAR (der)** para seguir el orden de la barra
  (🧊 frío ← → ☁️ calor).
- **Barajado anti-repetición** (`pickRounds` + `RECENT_KEY`): 3 de 4 rondas, distinto
  en cada carga (aprendizaje base §12). Lo mismo se aplicó a JUEGO-2 (bandeja).
- **Vaso de vapor rediseñado:** antes una nube en un charquito (confuso); ahora vaso
  casi vacío con una nube ☁️ flotando dentro + wisps 💨 saliendo.
- **Textos del home:** label del tema = "El Sol, la Luna y la vida en la Tierra"
  (TEMA 2); subtítulo = "Estados del agua 💧". (Reporte/categoría siguen "Estados
  del agua".)
- QA con Chrome headless: ronda forzada vapor→líquido, los 3 estados del vaso y el
  home. Bundle OK (ambos HTML idénticos).
