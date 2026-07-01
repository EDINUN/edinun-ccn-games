# MEMORY.md — Bitácora · JUEGO-6 "Misión: Cuerpo Humano"

Bitácora de decisiones de diseño, bugs y resoluciones, en orden cronológico
(fecha ISO). Una entrada por hito.

## 2026-06-29 — Creación desde `JUEGO-5`

- Clonado de `juegos/JUEGO-5-ciclo-del-agua/`. Tema: **TEMA 1 "Aparatos y sistemas
  del cuerpo humano"**, para **9 años** (capturas del libro enviadas por el usuario).
- **Mecánicas elegidas con el usuario** (insistió: "cada mecánica debe ser DISTINTA"
  y "que sea super cool"). Rampa **reconocer → relacionar → ubicar**:
  - **R1 "¿Qué sistema es?"** — quiz con **imagen** del sistema, toca el nombre (2
    preguntas).
  - **R2 "Une cada sistema con su función"** — tocar sistema y luego su función → se
    dibuja una **línea** (la actividad "Une con líneas" del libro). Mecánica nueva.
  - **R3 "¿Dónde va cada órgano?"** — arrastrar cada órgano a su zona en una
    **silueta del cuerpo (SVG)**. Mecánica nueva (motor de arrastre de J5 + zonas
    `data-zone` por `elementFromPoint`).
- **Imágenes:** el usuario las genera (6 `sis-*.png`, una por sistema; transparentes,
  estilo limpio de cuento, sin texto). El juego cae a emoji por sistema si falta
  alguna (`SystemCard`). **El cuerpo y los órganos son SVG/emoji** → no requieren
  imágenes. Prompts entregados al usuario.
- **Guía: Mía (química)** — la "científica" encaja con anatomía/biología.
- Personalización `screens.jsx`: tema, subtítulo "Misión: Cuerpo Humano 🧠", categoría
  `cuerpo-humano`, glifos de cuerpo (🧠❤️🫁🦴💪🩸🫀🦷🦵), guía por defecto `quimica`
  (tratando el `astronauta` inicial del shell como "sin elegir").

## 2026-06-29 — QA con Playwright (verificado de verdad)

- **E2E completo** (`pw-j6.js`): inicio → personaje (Mía) → R1 (2 quiz) → R2 (4
  uniones) → R3 (4 órganos arrastrados) → resultados 10/10. Sin errores de JS (solo
  `counter.php`/`sis-*.png` faltantes en `file://` → fallback esperado).
- **Revelado al fallar** (`pw-j6-reveal.js`): R2 mal unido muestra líneas rojas + ✗ y
  la unión correcta en **verde punteado**; R3 órgano mal soltado **rebota** y **brilla
  en verde la zona correcta** ("Ahí no va. Mira dónde brilla.").
- **Anti-repetición al recargar** (`pw-j6-audit.js`): 4 cargas → **4/4 distintos** en
  R1 (primer sistema), R2 (set de sistemas) y R3 (orden de bandeja). Cumple §12.
- Añadido al landing (`Misión: Cuerpo Humano`, charId `quimica`) y a
  `memory/audiencia_por_juego.md` (9 años).
