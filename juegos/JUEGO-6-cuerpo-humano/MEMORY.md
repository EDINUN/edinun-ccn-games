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

## 2026-07-02 — Rediseño mayor: 3 rondas (Rayos X ×2 + Une) con el usuario

El diseño de las 3 mecánicas del 29-jun **se descartó** iterando con el usuario
(imágenes chiquitas, R1≈R2, la ronda de órganos "salía fea"). Quedó así:

- **R1 y R2 = "Rayos X"** (misma mecánica, 2 veces). Reemplaza el quiz plano: se pasa
  una lente sobre un `<canvas>` oscuro (`destination-out`) para revelar la ilustración
  y tocar el nombre. Al responder, badges **✓ verde / ✗ roja** sobre las opciones. Solo
  usan los **4 aparatos/sistemas con ilustración** (`xray:true`).
- **R2 vieja "une con líneas" pasó a ser R3** con **imágenes grandes** (nodo 96 px,
  imagen 80 px) y **líneas de colores** (`MLINE_COLORS`, una por fila; puntitos a
  juego). El revelado se **mantiene ~3.6 s** (fallo) para poder leerlo.
- **Se quitó la ronda de órganos (arrastre a silueta)** y sus assets
  (`silueta-cuerpo.png`, `org-*.png` borrados).
- **`SYSTEMS` pasó de 6 a 10** = lista completa del libro con **funciones textuales**.
  R3 (`MATCHPOOL`) rota entre 9 (**Reproductor excluido** con `skipMatch:true`, a
  pedido del usuario; queda como dato pero no aparece).
- **Textos:** "sistema" → **"aparato o sistema"** (título R3, enunciado R1/R2, guía,
  reporte y feedback), porque el libro los agrupa como *Aparato/sistema*. Se quitó el
  subtítulo "Toca un sistema y luego su función". El ítem de R1/R2 en el reporte se
  acortó a **"Rayos X"** (antes ocupaba 3 líneas y tapaba las demás filas).

### Imágenes (todas regeneradas por el usuario, iterando el prompt)

- Estilo final: **caricatura coral de cuerpo entero, SIN ROPA**, sistema directo sobre
  el cuerpo, fondo transparente, cuadrada. Antes probamos gris ("aburrido") y coral
  fuerte con ropa ("feo") → quedó **peach suave**.
- **Digestivo y Respiratorio con cabeza de perfil** (a pedido del usuario) para que se
  vean boca/faringe/laringe; en Digestivo el recto baja hasta el final del tronco.
- Set final (9): `sis-{digestivo,respiratorio,circulatorio,excretor,oseo,nervioso,
  muscular,inmunologico,endocrino}.png`. Prompts (ES e EN) entregados al usuario.

### QA

- `pw-j6.js` reescrito al flujo de 3 rondas (R1/R2 rayos X → R3 une); `pw-j6-badge.js`
  verifica los ✓/✗ al fallar. E2E OK, sin errores de JS (solo `counter.php`/imágenes
  faltantes en `file://` → fallback esperado).
