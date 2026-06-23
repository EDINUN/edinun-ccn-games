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
- **Personaje destacado y guía por defecto:** Mía (química) — la "científica" que
  siembra (decisión del usuario).
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
