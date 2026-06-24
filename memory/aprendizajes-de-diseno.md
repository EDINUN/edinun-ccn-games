# Aprendizajes de diseño EDINUN (heredados de edinun-games / edinun-language)

Invariantes de UX confirmadas por la autora en juegos previos. Aplican a todos
los juegos EDINUN, incluida la línea de Ciencias Naturales. Cambiarlas requiere
conversación explícita, no un commit silencioso.

## 1. Fallar no baja el progreso ya ganado

Al fallar, NO bajar el progreso acumulado (barra de vitalidad, puntos, estrellas,
contador de aciertos): lo acumulado solo se **mantiene**, nunca se reduce. Y
**completar el objetivo cuenta como éxito aunque haya habido errores** — los
errores se marcan (✗ / rojo) pero no reprueban la ronda. La condición de éxito
se basa en lograr el objetivo (p. ej. `aciertos >= meta`), no en un tope de
errores. Penalizar lo ya logrado se siente injusto para la audiencia infantil.

## 2. Al fallar, revelar la respuesta correcta mostrando ambas

En el revelado al fallar, mostrar **tanto lo que eligió el niño como la
respuesta correcta**, no solo la solución. Para aprender, el niño necesita
comparar su respuesta equivocada contra la correcta. En opción múltiple: la
correcta en verde + la elegida (si es incorrecta) en rojo.

## 3. Acciones destructivas siempre con modal

Salir del juego, rendirse, reiniciar progreso → **siempre** modal de
confirmación antes de ejecutar, aunque parezca obvio. La fricción es deseable:
un niño toca por curiosidad y perder progreso por un tap accidental frustra.

## 4. No mostrar nombres de trabajo internos como UI

Los nombres de ronda/mecánica que viven en los comentarios del código son
**nombres internos**, NO texto para el niño. No convertirlos en rótulos
visibles. Cuando un hallazgo de revisión recomiende **añadir texto/rótulos
visibles nuevos**, confirmar con el usuario antes de aplicarlo, aunque el
alcance aprobado sea "todo". Distinguir: cambios de lógica/UX/ortografía →
aplicar; texto nuevo visible al niño → confirmar primero.

## 5. Responsive primero

La usabilidad empieza por responsive: móvil, tablet y desktop. Si hay que elegir
entre una feature nueva o asegurar que lo existente es responsive, se asegura
responsive primero. QA en los 6 viewports del `USER.md` desde el primer commit
jugable, no al final.

## 6. El bloque jugable va CENTRADO en el eje X del lienzo

El enunciado + el área de juego (cartel/casilleros/opciones/bandeja) deben quedar
centrados en el eje X del lienzo lógico (900). Como el personaje guía ocupa el
margen izquierdo y los botones (REINICIAR/SALIR) el derecho, es fácil dejar
**márgenes asimétricos** en la zona central y que todo quede corrido a la derecha
(le pasó a J1 y J2). Regla: la zona central usa **márgenes IGUALES**
(`left == right`), calculados a partir del ancho del contenido más ancho
(`(900 - ancho)/2`). El personaje y los botones viven en esos márgenes. Verificar
con una línea vertical en el centro real (debe pasar por el medio del contenido).

## 7. El bocadillo del guía SIN sombra oscura

El globo de diálogo del guía NO lleva `box-shadow` oscuro (tipo
`0 10px 24px rgba(0,0,0,0.55)`): contra el fondo proyecta un halo gris/negro feo a
la izquierda (el bocadillo está centrado sobre el personaje y su borde llega casi
al borde del lienzo). Definirlo solo con su **borde dorado + brillo interior**
(`boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)"`). (Ojo: la queja "sombra fea
al lado izquierdo" era esto, NO el `drop-shadow` del PNG del personaje.)

## 8. Bocadillos/pistas declarativos terminan en PUNTO

Las frases del bocadillo (pistas, instrucciones) llevan **punto final**: "Sale de
un cascarón.", "De pequeño nada, de grande salta." Excepción: las que cierran con
**¡…!** o **¿…?** NO llevan punto después ("¡Muy bien!"), según la RAE.

## 9. El formato EDINUN (guía + bocadillo) se clona del ÚLTIMO juego terminado

La `_PLANTILLA` es un demo mínimo de opción múltiple (sin guía con bocadillo, sin
botones laterales). El **formato EDINUN real** (HUD, personaje guía con bocadillo,
zona central centrada, botones REINICIAR/SALIR, modales, reporte) vive en los
juegos publicados. Para un juego nuevo con ese formato, **clonar del último juego
terminado** (hoy `JUEGO-2-la-semilla`), que ya trae los arreglos 6-8 y el elenco
en orden Luna · Bruno · Tomi · Mía sin `drop-shadow`. Así no se re-corrige lo ya
corregido. Luego se reemplaza solo la mecánica en `game-screens.jsx`.
