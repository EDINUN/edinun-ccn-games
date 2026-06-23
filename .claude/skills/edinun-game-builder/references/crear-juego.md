# Referencia — Crear un juego nuevo

## 0. Confirmar antes de empezar

- **Tema** y a qué parte del currículo/libro mapea.
- **Mecánica** (opción múltiple, arrastrar, clasificar, ordenar, emparejar…).
- **Edad objetivo** (típico CCNN 9-12).
- **Personaje destacado** (`charId`: astronauta / naturalista / quimica / geologo).
- **Slug**: `JUEGO-N-<kebab-case>` con N = siguiente ordinal libre en `juegos/`.

## 1. Clonar la PLANTILLA

Copiar **toda** la carpeta `juegos/_PLANTILLA/` a `juegos/JUEGO-N-<slug>/`,
incluyendo `assets/`, `counter.php`, `.planning/bundle.*`, los 5 `.jsx`, los dos
HTML y los docs (`CLAUDE.md`, `USER.md`, `MEMORY.md`).

En PowerShell:
```powershell
Copy-Item -Recurse "juegos\_PLANTILLA" "juegos\JUEGO-N-<slug>"
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
