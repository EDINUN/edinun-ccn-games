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
