# MEMORY.md — Bitácora · JUEGO-2 "La semilla"

Bitácora de decisiones de diseño, bugs y resoluciones, en orden cronológico
(fecha ISO). Una entrada por hito.

## 2026-06-23 — Creación desde `JUEGO-1`

- Clonado de `juegos/JUEGO-1-ciclo-vital-animales/` (que ya traía el formato
  EDINUN aprobado), no de `_PLANTILLA`.
- **Tema:** La semilla (TEMA 2 del libro de Ciencias Naturales). El usuario envió
  7 capturas del libro. Mapea a: qué necesita la semilla (agua/sol/tierra), el
  fruto guarda las semillas, frutos con semillas, dispersión (viento/agua/animal)
  y partes de la planta (raíz/hoja/flor).
- **Mecánica:** "Mira y toca" + **planta que crece** — la pieza central es una
  planta que avanza de etapa con cada ronda (semilla → brote → tallito → plantita),
  conectando con la secuencia de germinación del libro. La propuse yo (el usuario
  delegó la mecánica) y la aprobó en versión ilustrada. La etapa final es una
  plantita con hojas (sin flor), por decisión del usuario.
- **Audiencia: 6 años.** Decisiones derivadas:
  - Se descartan los términos abstractos del libro (cotiledón, plúmula,
    micrópilo, radícula) por ser demasiado.
  - Lenguaje simple: "la semilla bebe agua", "le sale la raíz", etc.
  - Distractores divertidos y claramente erróneos (juguete, tele, pelota, cama,
    carro, teléfono) que a los niños les causan gracia.
  - Opciones grandes (128×128) tocables; emoji 60px.
- **4 rondas** al azar de un banco de **12**, anti-repetición (`localStorage`,
  `RECENT_KEY = "edinun_ccn_semilla_recientes_v1"`): recargar o cambiar de niño NO
  repite.
- **Personaje destacado y guía por defecto:** primero fue Mía (química); luego el
  usuario lo cambió a **Bruno (naturalista)** porque encaja mejor con el tema de
  plantas ("amigo de plantas y animales"). Cambiado en `screens.jsx` (default sel)
  y en el card del landing.
- **Assets nuevos del juego:** 4 ilustraciones de etapas de crecimiento
  (`assets/semilla.png`, `brote.png`, `tallito.png`, `plantita.png`), generadas
  por el usuario con prompts en inglés. Se renombraron de `crece-1..4` a nombres
  descriptivos por etapa (mapa en `STAGE_FILES`). Tras varios errores del
  generador con la versión larga (`transparent background` / `preschool`), se pasó
  a **escenas cuadradas completas** (cielo + tierra) sin transparencia, mostradas
  a pantalla completa con `object-fit: cover`. `GrowingPlant` cae a emoji por etapa
  (🫘🌱🌿🪴) si alguna falta.
- Glifos del fondo personalizados al tema (🌱🌻🍎🍉💧🥥🫘🌷…).
- Título visible: **"La semilla"** (confirmado con el usuario). Se corrigió el
  `<title>` de ambos HTML (JUEGO-1 lo había dejado como "(PLANTILLA)").
- Se reaprovecha la corrección de cierre del JUEGO-1: `advance()` recibe los
  valores nuevos por argumento (el `setTimeout` capturaría el closure viejo).

## 2026-06-23 — Cambio de mecánica: de quiz a "Ordena la germinación"

- A la usuaria no le terminó de gustar el quiz ("Mira y toca"). Ella propuso
  **ordenar las imágenes de la germinación** (= actividad 2 del libro). Se
  reemplazó la mecánica del JUEGO-2 (mismo tema, mismas 4 imágenes).
- **Nueva mecánica:** el niño **arrastra** las 4 fotos (semilla/brote/tallito/
  plantita) a 4 casilleros numerados (1·2·3·4). Interacción elegida por la usuaria:
  **arrastrar** (no tocar-en-orden).
- **Drag con Pointer Events** (mouse + táctil). Como el lienzo 900×540 se escala
  con `transform`, se convierten coords pantalla→lógicas con el rect de `rootRef`
  (`toLogical`); `ghost` sigue al dedo; al soltar, `document.elementFromPoint` +
  `closest('[data-slot]')`. Tarjetas con `touch-action: none`. Estado
  `placement[stageId] = "tray" | 0..3`.
- Se eliminó el banco de preguntas, `GrowingPlant`, `RECENT_KEY`/anti-repetición
  (ya no aplica: una sola secuencia correcta). Se añadieron `PlantCard` y
  `Draggable`. El reporte ahora lista las **4 posiciones** (lo que puso vs. correcto).
- Reto cortito (una sola solución): REINICIAR / "jugar otra vez" barajan la bandeja
  (`initialTrayOrder`, nunca arranca resuelta). Si se quiere más reto → más etapas.
- **QA:** layout verificado en escritorio y móvil-horizontal; **arrastre probado de
  verdad** simulando Pointer Events en headless (colocó 3 fotos en sus casilleros).
  Reporte de resultados verificado.

## 2026-06-24 — Centrado del bloque de juego en el eje X

- La usuaria notó que el enunciado + casilleros + bandeja NO quedaban centrados en
  el medio de la pantalla (se veían corridos a la derecha). Causa: la zona central
  tenía **márgenes asimétricos** (`left:214` vs `right:132`), así que su centro caía
  en x≈491 en vez de 450 (centro del lienzo 900×540).
- **Fix:** márgenes IGUALES `left:183 / right:183`. La bandeja mide 534 →
  `(900-534)/2 = 183`, así el bloque queda centrado exacto en el eje X. El personaje
  guía vive en el margen izquierdo y los botones REINICIAR/SALIR en el derecho.
- **Invariante:** el bloque jugable va centrado en el eje X del lienzo con márgenes
  iguales; al editar el layout, NO volver a márgenes asimétricos. Verificado en
  headless con una línea roja en el centro real de la pantalla (pasa justo entre los
  casilleros 2 y 3). Es geometría dentro del lienzo lógico → idéntico en toda
  resolución (`DeviceStage` siempre centra el lienzo).
- Mismo arreglo aplicado a JUEGO-1 (allí `left:240/right:192` → `215/215`).
