# Referencia — Crear un juego nuevo

## 0. Confirmar antes de empezar

- **Tema** y a qué parte del currículo/libro mapea.
- **Mecánica** (opción múltiple, arrastrar, clasificar, ordenar, emparejar…).
- **Edad objetivo** (típico CCNN 9-12).
- **Personaje destacado** (`charId`: astronauta / naturalista / quimica / geologo).
- **Slug**: `JUEGO-N-<kebab-case>` con N = siguiente ordinal libre en `juegos/`.

## 1. Clonar la base correcta

**Importante (de qué clonar):**
- La `_PLANTILLA` es un **demo mínimo** de opción múltiple: NO trae el formato
  EDINUN completo (personaje guía con bocadillo, botones laterales, zona central
  centrada).
- El **formato EDINUN real** vive en los juegos publicados. Para un juego nuevo con
  ese formato, **clonar del ÚLTIMO juego terminado** (hoy `JUEGO-2-la-semilla`),
  que ya trae los arreglos de pulido (ver `memory/aprendizajes-de-diseno.md`
  §6 centrado, §7 bocadillo sin sombra, §8 puntos finales) y el elenco en orden
  Luna · Bruno · Tomi · Mía sin `drop-shadow`. Así NO se re-corrige lo ya corregido.
- Clonar de `_PLANTILLA` solo si se quiere partir del demo simple a propósito.

Copiar **toda** la carpeta fuente a `juegos/JUEGO-N-<slug>/`, incluyendo `assets/`,
`counter.php`, `.planning/bundle.*`, los 5 `.jsx`, los dos HTML y los docs
(`CLAUDE.md`, `USER.md`, `MEMORY.md`). Tras clonar, **limpiar** lo específico del
juego fuente: `visits.txt` (si existe), `MEMORY.md`, el array de datos de la
mecánica y los textos del tema.

En PowerShell (clonando del último juego terminado):
```powershell
Copy-Item -Recurse "juegos\JUEGO-2-la-semilla" "juegos\JUEGO-N-<slug>"
# o, para el demo simple:  Copy-Item -Recurse "juegos\_PLANTILLA" "juegos\JUEGO-N-<slug>"
```

## 2. Implementar la mecánica (`game-screens.jsx`)

Reemplazar `DEMO_PREGUNTAS` / reescribir `GameScreen`. Contrato obligatorio:

- `GameScreen({ app, setApp, go })` — al terminar: `incrementGamesCompleted()` y `go("results")`.
- `ResultsScreen({ app, setApp, go })`.
- `Object.assign(window, { GameScreen, ResultsScreen })` al final del archivo.
- `markFirstAttempt()` en la **primera** respuesta del niño (cuenta la visita).

Invariantes de diseño (no negociables sin confirmar):
- Fallar **no** baja progreso ya ganado; completar el objetivo es éxito aunque
  haya errores.
- Al fallar, **revelar la respuesta correcta** dejando ver lo que eligió el niño.
- Salir/reiniciar **siempre con modal**.
- HUD: pregunta/ronda arriba-izq pegado al logo; timer ⏱ + estrellas ⭐ a la
  derecha; nada se tapa.
- Lienzo lógico 900×540; contenido en `position:absolute; inset:0`.

## 3. Personalizar el shell visible (`screens.jsx`)

Solo los textos marcados `// ← PERSONALIZAR` (label del tema, subtítulo,
categoría) y, si encaja, los glifos del `CosmosBg`. No tocar el bloque del
contador.

## 4. Docs

- `CLAUDE.md` y `MEMORY.md` del juego: reemplazar `{{PLACEHOLDERS}}`.
- `memory/audiencia_por_juego.md` (raíz): añadir fila con la edad objetivo.

## 5. Re-empaquetar

Desde la carpeta del juego:
```powershell
powershell -ExecutionPolicy Bypass -File .planning\bundle.ps1
```
Verificar: ambos HTML idénticos en bytes, sin `</script>` literal en los `.jsx`.

## 6. Landing + QA

- Añadir `{ slug, title, charId }` al array `GAMES` del `index.html` raíz.
- QA responsive en 1920×1080, 1280×800, 1024×768, 768×1024, 667×375, 375×667.
- Borrar `visits.txt` antes de subir a producción.
