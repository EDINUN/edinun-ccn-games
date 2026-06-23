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
