# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`edinun-ccn-games` — repo multi-juego para EDINUN GAMES, temática **Ciencias Naturales (CCNN)**. Comparte el mismo motor que `edinun-games` (matemáticas) y `edinun-language` (lengua): cada juego es una carpeta autocontenida y portable bajo `juegos/<slug>/`. La raíz aloja **solo el landing** (lista de juegos) más copias maestras de los assets que ese landing necesita.

Audiencia infantil/escolar; en móvil el lienzo es horizontal y el usuario gira el teléfono físicamente — el contenido **no rota** según orientación del sistema.

**Audiencia por juego:** registrar la edad objetivo de cada juego en [`memory/audiencia_por_juego.md`](memory/audiencia_por_juego.md). Para Ciencias Naturales el rango típico es 9-12 según el tema; consultar/actualizar ese archivo antes de tocar un juego existente. Para un juego nuevo, confirmar la edad objetivo con el usuario si no está clara.

## Estructura del repo

```
edinun-ccn-games/
├── index.html              ← landing del repo (regenerado por la skill)
├── styles.css              ← copia maestra que usa el landing
├── edinun-logo.png         ← copia maestra (favicon del landing)
├── assets/                 ← copias maestras (4 char-*.png + edinun-logo.svg/png)
├── memory/                 ← memorias del repo (audiencia por juego, aprendizajes)
├── COMO-SUBIR-EL-JUEGO.md  ← guía de deploy (no técnica, versión corta)
├── SUBIR-A-SERVIDOR.md     ← guía de deploy + diagnóstico del contador
├── CHECK-JUEGOS.md         ← checklist de QA por juego
├── .claude/skills/edinun-game-builder/  ← skill de orquestación (crear juego, shell, landing)
└── juegos/
    └── _PLANTILLA/         ← motor limpio listo para clonar al crear un juego nuevo
```

Aún no hay juegos publicados: el repo arranca con la **`_PLANTILLA`** (un juego demo funcional de opción múltiple) como fuente para clonar.

**Convención de slug:** los juegos nuevos usan el prefijo `JUEGO-N-<slug>` (N = siguiente ordinal libre, empezando en 1). El slug del folder debe coincidir byte a byte con la entrada `slug:` en el array `GAMES` del landing. `_PLANTILLA` no es un juego publicable: nunca aparece en `GAMES`.

Cada `juegos/<slug>/` debe seguir funcionando con doble clic aunque la copies fuera del repo (solo necesita internet para CDNs). Por eso duplica `styles.css`, `assets/`, los `.jsx` del shell y los HTML.

## Cómo trabajar en este repo

Para tareas que crucen varios juegos (editar el shell compartido, crear un juego nuevo, regenerar el landing) **usa la skill `edinun-game-builder`** (`.claude/skills/edinun-game-builder/SKILL.md`): define el flujo de aprobación previa, la propagación a todos los juegos cuando se toca el shell, y la regeneración del landing tras añadir un juego.

**Lee siempre el `CLAUDE.md` y `USER.md` del juego sobre el que vas a trabajar** (`juegos/<slug>/`) — contienen la arquitectura detallada, las invariantes técnicas y las preferencias del usuario. La `_PLANTILLA` trae estos docs como plantilla.

**Skills de especialista (Jeffallan/claude-skills):** usar siempre el método de las skills globales (`~/.claude/skills/`) para desarrollar y revisar. Relevantes para EDINUN: `playwright-expert` (QA/E2E), `react-expert`, `javascript-pro`, `test-master`, `code-reviewer`, `game-developer`, `secure-code-guardian`. Si no aparecen como invocables, leer su `SKILL.md` directo y aplicar su workflow.

## Sin build / sin tests

HTML estático con React 18 + Babel Standalone desde unpkg. No hay package manager, lint, ni suite de tests. Servir con `python -m http.server 8765` desde la raíz para QA, o doble clic en cualquier `index.html`.

## Editar un juego

Cada juego tiene 5 `.jsx` editables (`logo`, `characters`, `screens`, `game-screens`, `app`) y dos HTML (`index.html` + `EDINUN GAMES.html`, idénticos byte a byte). Los HTML cargan el JSX **inline** — no leen los `.jsx` en runtime. El flujo es: editar `.jsx` → re-empaquetar al HTML.

```bash
# Re-empaquetar tras editar cualquier .jsx (desde la carpeta del juego):
python .planning/bundle.py
```

Si Python no está disponible (caso del autor: el `python` del PATH son stubs del Microsoft Store), usar el equivalente PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .planning\bundle.ps1
```

Ambos concatenan los 5 `.jsx` en el orden `logo → characters → screens → game-screens → app` y reescriben en ambos HTML **desde la etiqueta ancla `<script type="text/babel" data-presets="react">` hasta `</html>`** (regeneran el cierre `</script></body></html>` de cero, lo que sana un HTML corrompido por un bundle previo roto), manteniéndolos idénticos. Si esa etiqueta ancla falta en un HTML, el bundle aborta con «No se encontró el bloque `<script babel>`» — no la renombres ni le cambies los atributos.

**Invariante crítica del bundle:** ningún `.jsx` puede contener literal `</script>` (cerraría el bloque del navegador). Si se necesita dentro de un template literal, partirlo: `${"<\\/scr"+"ipt>"}`.

**Contrato del shell** (`app.jsx` enruta por estado `home → character → game → results`):
- `screens.jsx` define `HomeScreen`, `CharacterScreen`, el contador de visitas y `CosmosBg`.
- `game-screens.jsx` define `GameScreen` y `ResultsScreen` (la mecánica específica del juego).
- Ambos exponen sus componentes en `window` vía `Object.assign`.
- `GameScreen` llama `markFirstAttempt()` en la primera respuesta (cuenta la visita) e `incrementGamesCompleted()` al terminar, y hace `go("results")`.

## Invariantes de diseño (ver memory/ y USER.md de la plantilla)

- **Fallar NO baja el progreso ya ganado** (barra/estrellas/aciertos): solo no suma. Completar el objetivo cuenta como éxito aunque haya errores.
- **Al fallar, revelar la respuesta correcta** dejando ver lo que eligió el niño (no solo la solución).
- **Acciones destructivas (salir, reiniciar) siempre con modal** de confirmación.
- **No mostrar nombres de trabajo internos** (de comentarios de código) como rótulos visibles; confirmar antes de añadir texto visible nuevo.
- Copy corto, accionable, sin jerga. Lienzo lógico fijo **900×540**, centrado con `translate(-50%,-50%) scale()`.

## Contador de visitas (server-side con fallback)

Cada juego muestra un contador de visitas global. El patrón vive en `juegos/_PLANTILLA/`:

- **`counter.php`** en la raíz del juego: `GET` → `{"count": N}`; `GET ?inc=1` → incremento atómico (`flock(LOCK_EX)`) guardado en **`visits.txt` en la misma carpeta** del juego. Requiere Apache + PHP con permiso de escritura sobre la carpeta. **No crea subcarpetas** y **suprime warnings** para que el body sea JSON puro.
- **`screens.jsx`** (`useVisitorCount` / `markFirstAttempt`) hace `fetch` al endpoint y **cae a `localStorage`** si el servidor no ejecuta PHP (GitHub Pages, `python -m http.server`, doble clic `file://`). En ese modo el conteo es per-navegador.
- **Probar el contador real localmente:** `php -S localhost:8000` desde la carpeta del juego (no `python -m http.server`, que sirve el `.php` como texto).
- **`visits.txt` está gitignoreado** (`juegos/*/visits.txt`); nunca commitearlo.

`counter.php` no se personaliza por juego: al crear un juego nuevo, copiar el de `_PLANTILLA` tal cual.

## Deploy a producción

Los juegos se suben a `https://www.edinun.com/...` (Apache + PHP) carpeta por carpeta. Dos guías en la raíz, en lenguaje no técnico:

- [`COMO-SUBIR-EL-JUEGO.md`](COMO-SUBIR-EL-JUEGO.md) — versión corta.
- [`SUBIR-A-SERVIDOR.md`](SUBIR-A-SERVIDOR.md) — incluye diagnóstico del contador (F12 → Network → `counter.php`) y cómo arreglar permisos (755 / 775).

**Antes de subir, borrar `visits.txt` del juego** si existe (estado de prueba local). El juego se incrusta en producción dentro de un `<iframe>` desde una página envoltorio — subir la **carpeta completa** del juego (`index.html` + `assets/` + `counter.php`).

## Artefactos gitignoreados

`.gitignore` excluye: `juegos/*/visits.txt`, `juegos/*/counts/`, `juegos/*/.planning/qa-screenshots/`, `juegos/*/.planning/qa-results.json`, `uploads/`, `node_modules/`, `package-lock.json`, `reponsive/`, `.claude/settings.local.json`. No commitear ninguno. (La skill `.claude/skills/edinun-game-builder/` SÍ se versiona.)

`package.json` declara **Playwright** como `devDependency` — se usa para las capturas de QA responsive, no para el runtime.

## Editar el shell (afecta a todos los juegos)

`app.jsx`, `characters.jsx`, `logo.jsx`, `styles.css` y los assets son idénticos entre juegos. Cambiar uno implica: (1) avisar qué juegos se regenerarán; (2) replicar el archivo en cada `juegos/<slug>/` (y en `_PLANTILLA`); (3) si es `.jsx`, re-empaquetar cada juego; (4) si es `styles.css`/`logo.jsx`/`characters.jsx`/asset, copiarlo también a la raíz (los usa el landing); (5) si fue `logo.jsx` o `characters.jsx`, regenerar el landing. La skill `edinun-game-builder` automatiza esto.

## Regenerar el landing

`index.html` raíz embebe inline el código de `logo.jsx` + `characters.jsx` y un literal `GAMES = [{ slug, title, charId }, ...]` con un card por juego. Tras añadir / quitar / renombrar un juego, regenerar este array verificando que cada `slug:` coincide con un folder real en `juegos/` y que `charId` ∈ {`astronauta`, `naturalista`, `quimica`, `geologo`}.

**Catálogo de personajes** (compartido por todos los juegos; el `charId` del card debe matchear al personaje destacado): `astronauta` = Luna, `naturalista` = Bruno, `quimica` = Mía, `geologo` = Tomi. Cada uno tiene su `assets/char-<charId>.png`.
