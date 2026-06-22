# Checklist de revisión — EDINUN GAMES · Ciencias Naturales

Revisión juego por juego. Solo lo esencial (lo que más se rompe).
Marca con una `x` dentro de los `[ ]` a medida que verificas.

## Qué revisar (los 6 imprescindibles)

1. **HUD** — pregunta/ronda arriba‑izquierda pegado al logo; timer ⏱ y estrellas ⭐ a la derecha; nada se tapa.
2. **Responsive vertical** — en móvil portrait (375×667 / 768×1024) sale el bloqueo *"Gira tu teléfono"* y el lienzo queda **centrado** (no pegado a la esquina). Al girar a horizontal escala bien y nada se corta.
3. **Juego completo** — se juega de principio a fin hasta resultados; correcta avanza, incorrecta da feedback y no se traba. Funciona con mouse y con tap en móvil.
4. **Ciencia sin errores** — preguntas, respuestas y distractores correctos; sin typos ni imprecisiones científicas en los enunciados.
5. **Contador** — `counter.php` responde (F12 → Network) o cae a localStorage sin romper. **Borrar `visits.txt` antes de subir.**
6. **Resultados** — aciertos/tiempo/estrellas bien; "JUGAR OTRA RONDA" reinicia; salir pide confirmación.

## Avance

| # | Juego | HUD | Responsive | Completo | Ciencia | Contador | Resultados |
|---|-------|:---:|:----------:|:--------:|:-------:|:--------:|:----------:|
| — | (aún no hay juegos publicados) | | | | | | |

## Notas por juego

> Apunta aquí lo que encuentres (bug, ajuste pendiente, idea) por juego.
