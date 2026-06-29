# MEMORY.md — Bitácora · JUEGO-4 "Comida saludable"

Bitácora de decisiones de diseño, bugs y resoluciones, en orden cronológico
(fecha ISO). Una entrada por hito.

## 2026-06-29 — Creación desde `JUEGO-3`

- Clonado de `juegos/JUEGO-3-estados-del-agua/` (último juego terminado con el
  formato EDINUN). Se limpiaron `visits.txt` y las capturas de QA del fuente.
- **Tema:** TEMA 2 "Cuido mi salud física y mental". El usuario envió las capturas
  del libro (salud física/mental/social, alimentación, actividad física, salud
  emocional). Para 6 años se enfocó en **alimentación saludable** (lo abstracto —
  pirámide de nutrientes, proteínas/carbohidratos — se descartó por edad).
- **Mecánica (elegida por el usuario entre 3 bosquejos en bloque de texto):** unir
  las opciones A ("¿Es saludable?") y B ("Arma tu plato") en **un juego de 2 fases**:
  - Fase 1 "¿Es saludable?": 2 rondas de decisión única (toca ✅ SÍ / ❌ NO).
  - Fase 2 "Arma tu plato": arrastrar SOLO la comida sana al plato; la chatarra
    rebota con aviso. Es la 3ª "ronda".
  - El usuario pidió **2 rondas + plato** (antes eran 3 + plato).
- **Guía: Bruno (`naturalista`)** — encaja con comida/naturaleza/salud.
- **100% CSS + emoji**, sin imágenes generadas: alimentos como emoji en `FoodTile`,
  plato como `<div>` circular (zona `data-plate`).
- **Reutilización:** el quiz de decisión única viene de J3; el motor de arrastre
  (Pointer Events, `toLogical`, `ghost`, `elementFromPoint`) viene de J2.
- **Anti-repetición** (`RECENT_KEY`, §12): los alimentos de cada partida salen
  distintos en cada carga.
- **Personalización de `screens.jsx`:** label del tema "Cuido mi salud física y
  mental", subtítulo "Comida saludable 🍎", categoría `comida-saludable`, glifos del
  fondo a comida, guía por defecto `naturalista`.
- **`<title>`** de ambos HTML → "EDINUN GAMES — Comida saludable".

## 2026-06-29 — QA interactivo con Playwright + pulido

- **Distribución (feedback del usuario):** la bandeja de la Fase 2 se partía en 2
  filas (4+2); se pasó a **una sola fila** (fichas de 76px) y el plato se agrandó
  (232×178) como foco. Reparto parejo con `space-evenly`. Sin solapamientos (el
  bocadillo de Bruno despeja la primera ficha).
- **Bug corregido:** el borde del plato tenía un `.replace(" ","")` roto → puesto
  como `"8px solid #cfd8e3"`.
- **Playwright** (devDependency): se instaló y se escribió un script que **juega el
  flujo completo** (nombre → personaje → Fase 1 ×2 → Fase 2 → resultados). Verificó:
  responder y avanzar, transición de fase, **arrastrar sano al plato**, **rebote de
  la chatarra** (vuelve a la bandeja), y la pantalla de resultados (4/4). Se dejaron
  hooks `data-ok`/`data-tile` para re-correr el QA.
- **Punto en el enunciado declarativo (§8):** "Arrastra solo la comida sana al
  plato." (Fase 1 es pregunta → sin punto). Misma corrección aplicada a J2 y J3 en
  esta sesión.
- Añadido al landing raíz y a `memory/audiencia_por_juego.md` (6 años).
