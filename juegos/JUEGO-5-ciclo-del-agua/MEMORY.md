# MEMORY.md — Bitácora · JUEGO-5 "El viaje del agua"

Bitácora de decisiones de diseño, bugs y resoluciones, en orden cronológico
(fecha ISO). Una entrada por hito.

## 2026-06-29 — Creación desde `JUEGO-4`

- Clonado de `juegos/JUEGO-4-comida-saludable/`. Tema: **TEMA 3 "Ciclo vital del
  agua en la naturaleza"**, para **8 años** (mayores que los juegos de 6 → términos
  reales y más reto).
- **Diseño elegido vía panel de diseñadores (Workflow):** 4 enfoques en paralelo +
  síntesis. Ganó un "viaje del agua" con guía **Luna** (planeta azul). Adaptado a
  **3 rondas, cada una con mecánica distinta** (rampa reconocer → ordenar → aplicar).
- **3 rondas:** R1 "¿Qué proceso es?" (quiz), R2 "Ordena el ciclo" (arrastre, motor
  de J2), R3 (al inicio "Verdadero/Falso", luego el usuario la cambió a
  **"Encuentra lo que gasta agua"** — tocar las fugas).
- **Imágenes:** 4 ilustraciones de etapas (`evaporacion/condensacion/precipitacion/
  recoleccion.png`) generadas por el usuario. Prompts ajustados 2 veces (primero
  "con basura visual", luego "muy simples", al final estilo limpio/cuento). El juego
  cae a emoji por etapa si falta alguna (`StageCard`).
- Personalización `screens.jsx`: tema, subtítulo "El viaje del agua 💧", categoría
  `ciclo-del-agua`, glifos de agua, guía por defecto `astronauta`.

## 2026-06-29 — Pulido tras feedback del usuario

- **R1 a UNA sola pregunta** (antes 2): `pickIdentify(1)`.
- **Anti-repetición que faltaba (§12):** al recargar salían los mismos ejercicios.
  Causa: R1/R2 no tenían anti-repeat (solo R3). Se añadió **por ronda** (`RK_R1`,
  `RK_R2`, `RK_R3`) y se amplió el banco de la R3. **Auditado con Playwright** en los
  5 juegos (reload-test): todos varían. Aprendizaje base §12 reforzado: cada ronda
  con azar necesita SU anti-repeat; verificar de verdad, no asumir.
- **R3 colores invertidos (bug de convención):** tocar una fuga (acierto) salía
  ROJA. Se invirtió: **fuga acertada = verde ✓**, **buena tocada por error = roja ✗**.
- **R3 opción confusa:** "Regar con regadera" → **"Cerrar al enjabonarte"** (más clara).
- **R2 revelado:** al equivocarte no se veía el orden correcto (el overlay lo tapaba).
  Se retrasó el overlay y se hizo el revelado más visible (✗ rojo en lo mal + la etapa
  correcta en píldora verde debajo). El usuario pidió explícitamente: **NO corregir en
  vivo** y **sí ver cuál era el correcto** → se descartó un intento de feedback en
  vivo y se dejó el patrón "comprometes → revela el correcto → no rehace" (gracia
  corta de 600 ms).
- QA: e2e completo con Playwright (R1 1 pregunta → R2 arrastre → R3 fugas →
  resultados) + reveal-test de la R2 + reload-test de anti-repetición.
- Añadido al landing y a `memory/audiencia_por_juego.md` (8 años).
