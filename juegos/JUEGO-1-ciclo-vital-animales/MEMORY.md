# MEMORY.md — Bitácora · JUEGO-1 "El ciclo de la vida"

Bitácora de decisiones de diseño, bugs y resoluciones, en orden cronológico
(fecha ISO). Una entrada por hito.

## 2026-06-23 — Creación desde `_PLANTILLA`

- Clonado de `juegos/_PLANTILLA/`.
- **Tema:** Ciclo vital de los animales (TEMA 2 del libro de Ciencias Naturales).
  Mapea a: tipos de nacimiento (ovíparo / vivíparo), crecimiento y metamorfosis
  (mariposa, rana, gallina).
- **Mecánica:** "Mira y toca" — quiz visual: consigna corta + 3 opciones con emoji
  grande; el niño TOCA la correcta. 8 preguntas, posición de la correcta variada.
- **Audiencia: 6 años** (más pequeña que el típico CCNN 9-12). Decisiones derivadas:
  - Sin reloj/timer (sin presión de tiempo a esa edad).
  - Lenguaje simple, sin obligar "ovíparo/vivíparo": se dice "nace de un huevo" /
    "nace de su mamá".
  - Sin preguntas sobre la muerte (el juego se queda en nacer, crecer y cambiar).
  - Sin voz: solo texto + emoji (decisión del usuario).
  - Opciones grandes (188×188) tocables; emoji 84px.
- **Personaje destacado:** Bruno (naturalista).
- Glifos del fondo personalizados a animalitos del ciclo vital (🥚🦋🐣…).
- Nota: el elenco nuevo de CCNN (Luna/Bruno/Mía/Tomi) se cableó en el shell ANTES
  de crear este juego; ver `characters.jsx`.

## 2026-06-23 — Rework al formato EDINUN + 4 rondas aleatorias

- La 1ª versión usó el demo simplificado de la plantilla (tarjetas planas). La
  usuaria pidió respetar el **formato EDINUN** de sus otros juegos. Se clonó el
  formato de `edinun-language/juego-1` (HUD con dots de ronda, personaje con
  bocadillo de pista, cartel emoji, fichas candy, overlay "¡EXCELENTE!/¡UPS!",
  reporte académico imprimible). Se portó la clase CSS `ed-btn-restart` (faltaba
  en el `styles.css` de CCNN; ahora en raíz + _PLANTILLA + juego).
- Ajustes de la usuaria: pistas naturales **sin emoji**; **sin chip de tema** (es
  para 2+ niveles); espacios repartidos con `space-evenly`; **4 rondas** (antes 8).
- **Anti-repetición:** banco ampliado a 12; cada partida elige 4 al azar evitando
  las recientes (`localStorage`). Recargar / cambiar de niño da preguntas nuevas.
- Bug corregido: el cierre (`setTimeout` → `advance`) perdía la última ronda; se
  pasan los valores nuevos por argumento.

## 2026-06-24 — Centrado del bloque de juego en el eje X

- La usuaria notó (con una línea de referencia en el centro de la pantalla) que el
  enunciado + cartel + opciones quedaban corridos a la derecha. Causa: zona central
  con **márgenes asimétricos** (`left:240` vs `right:192`) → centro en x≈474 en vez
  de 450 (centro del lienzo 900×540).
- **Fix:** márgenes IGUALES `left:215 / right:215` (el enunciado mide hasta 470 →
  `(900-470)/2 = 215`). El personaje guía vive en el margen izquierdo y los botones
  REINICIAR/SALIR en el derecho; las opciones (420 de ancho) quedan centradas en
  240–660.
- **Invariante:** el bloque jugable va centrado en el eje X con márgenes iguales; no
  volver a asimetría al editar. Verificado en headless con línea roja en el centro
  real (pasa por el cartel y la opción del medio). Mismo criterio en JUEGO-2
  (`183/183`).

## 2026-06-24 — Más tiempo para ver la respuesta correcta (caso error)

- La usuaria pidió que, al equivocarse, la **pantalla LIMPIA** de revelación
  (correcta en VERDE, erróneas en ROJO, bocadillo "¡Casi! Mira la respuesta") dure
  más para alcanzar a estudiar cuál era. **Aclaración clave de la usuaria:** esa
  pantalla sale ANTES del overlay "¡UPS!"; el tiempo extra va a ESA, NO a una
  pantalla después del "¡UPS!". Tiempo final acordado: **2 s** (probó 3 s y lo
  sintió largo).
- **1er intento (descartado):** dejé el "¡UPS!" a 720 ms y lo retiraba a 1700 ms
  para mostrar las fichas limpias *después*. La usuaria corrigió: eso es "después
  del ups", no es lo que quería.
- **Fix correcto (rama de error en `answerTap`):** la revelación se ve LIMPIA y
  **sin overlay de 0 a 3000 ms**; recién a los **3000 ms** aparece el "¡UPS!" como
  reacción breve, y el avance es a **3700 ms**. Las fichas verde/rojo dependen de
  `picked` (se limpia solo en `advance`), por eso se mantienen reveladas todo ese
  tiempo aunque `feedback` siga en null.
- El caso de **acierto** se deja rápido (~1,05 s): no hay nada que estudiar.

## 2026-06-24 — La "sombra fea" era el box-shadow del BOCADILLO (no el personaje)

- La usuaria volvió a señalar una "sombra fea al lado izquierdo" del guía. En su
  momento se quitó por error el `drop-shadow` del PNG del personaje, pero la sombra
  que de verdad le molestaba es el **`box-shadow` del bocadillo**
  (`0 10px 24px rgba(0,0,0,0.55)`): contra el fondo verde proyecta un halo oscuro
  abajo-izquierda (el bocadillo está centrado sobre el bloque del guía, así que su
  borde izquierdo llega casi al borde del lienzo y la sombra cae en zona vacía).
- **Fix:** el bocadillo queda con `boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)"`
  (sin el halo oscuro); el borde dorado + el brillo interior ya lo definen. Aplicado
  IGUAL en JUEGO-2 (mismo bocadillo). Verificado en captura: el halo desaparece.
