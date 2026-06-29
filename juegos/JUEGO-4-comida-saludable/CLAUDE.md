# CLAUDE.md — JUEGO-4 · "Comida saludable"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `JUEGO-3` (el último
> juego terminado con el formato EDINUN aprobado), no de `_PLANTILLA`. Aparece en
> el landing con `slug: "JUEGO-4-comida-saludable"`.

## Project

**Juego: "Comida saludable".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). Pertenece al **TEMA 2 "Cuido mi salud
física y mental"**: enseña a distinguir **alimentos saludables** de la chatarra y a
**armar un plato sano**.

Mecánica en **2 fases** sobre el formato EDINUN:
- **Fase 1 "¿Es saludable?"** — 2 rondas: aparece un alimento y el niño da **un
  toque** a **✅ SÍ, SANO** o **❌ NO SANO** (decisión única, como JUEGO-1/3).
- **Fase 2 "Arma tu plato"** (la 3ª ronda) — el niño **arrastra SOLO la comida sana**
  al plato; la chatarra rebota con un aviso (motor de arrastre de JUEGO-2).

**Audiencia: 6 años** (registrada en `memory/audiencia_por_juego.md`). Poco texto,
emojis grandes, sin presión de tiempo; alimentos que el niño reconoce.

En móvil el diseño es horizontal pero el dispositivo se sostiene vertical: el
usuario gira físicamente el teléfono (overlay bloqueante hasta rotar).

- **Bitácora del proyecto:** `MEMORY.md`.
- **Preferencias del usuario** (usabilidad, QA responsive, invariantes): `USER.md`.
  **Léelo antes de cualquier cambio de UI o flujo.**

## Running / deploying

No build system, no package manager. HTML estático que carga React 18 + Babel
Standalone desde unpkg.

- **Abrir local:** doble clic en `index.html`.
- **Servir local:** `python -m http.server 8765` desde la raíz del repo.
- **Contador PHP real:** `php -S localhost:8000` desde esta carpeta.

## Architecture

Mismo shell que los demás juegos. Los 5 `.jsx` (`logo`, `characters`, `screens`,
`game-screens`, `app`) son la fuente editable. Tras editar, re-empaquetar:

```powershell
powershell -ExecutionPolicy Bypass -File .planning\bundle.ps1
```
o `python .planning/bundle.py` si hay Python real.

Invariantes:
- **No incluir `</script>` literal en ningún `.jsx`** (partir el token si hace falta).
- **El bundle reescribe desde `<script type="text/babel">` hasta `</html>`** — el
  `<title>` del `<head>` NO lo toca (se edita a mano en ambos HTML).

### Assets propios del juego

**Ninguno.** Es **100% CSS + emoji**: los alimentos son emojis (🍎🥦🍔🥤…) en
fichas (`FoodTile`), y el plato es un `<div>` circular (zona de soltado). No hubo
que generar imágenes. Solo usa los compartidos (`char-*.png`, `edinun-logo.*`).

### Contrato del shell

- `app.jsx` enruta por estado: `home → character → game → results`. No tocar salvo
  cambio de shell coordinado con los demás juegos.
- `screens.jsx`: `HomeScreen`, `CharacterScreen`, contador de visitas, `CosmosBg`.
  Personalizado: label del tema (TEMA 2 "Cuido mi salud física y mental"), subtítulo
  ("Comida saludable 🍎"), categoría (`comida-saludable`), glifos del fondo
  (🍎🥦🥕🍓🍌🥑🍅🌽🍇🥗…) y la guía por defecto (`naturalista` = Bruno).
- `game-screens.jsx`: **la mecánica de este juego.** Define `GameScreen`,
  `ResultsScreen`, `FoodTile` y el `PrintableReport`.

### Mecánica del juego (`GameScreen`)

Dos fases con el estado `phase` (`"clasificar"` | `"plato"`); HUD (logo + "Ronda"
con dots centrado arriba + ⏱ tiempo + ⭐), personaje guía con bocadillo a la
izquierda, zona central centrada (`left/right 183`, `space-evenly` desde `top:30`),
botones REINICIAR/SALIR a la derecha, overlay "¡EXCELENTE!/¡UPS!" y ResultsScreen
imprimible.

- **Banco `FOODS`**: cada alimento `{e, t, ok}` (`ok` = saludable). `HEALTHY_IDS` /
  `JUNK_IDS` derivados. `pickClassify(N_CLASSIFY)` elige los de la Fase 1 (mezcla 1
  sano + 1 chatarra, evitando recientes) y `pickPlate()` arma la bandeja del plato
  (`PLATE_HEALTHY` sanos + `PLATE_JUNK` chatarra). Anti-repetición con `RECENT_KEY`
  → distinto en cada carga (§12).
- **Constantes de balance:** `N_CLASSIFY = 2` (rondas de quiz), `PLATE_HEALTHY = 4`,
  `PLATE_JUNK = 2`, `N = N_CLASSIFY + 1` (dots de RONDA = 3: 2 quiz + el plato).
- **Fase 1 (`onClassify`)**: acierto → ⭐ + "¡EXCELENTE!"; fallo → revela (aro verde
  en el botón correcto, rojo en el tocado) y avanza. Tras `N_CLASSIFY` → `phase = "plato"`.
- **Fase 2 (arrastre, Pointer Events como JUEGO-2)**: `toLogical` convierte
  pantalla→lógico; `ghost` sigue al dedo; al soltar, `elementFromPoint` +
  `closest('[data-plate]')`. Si el alimento es sano → se queda en el plato; si es
  chatarra → **rebota** (flash rojo del plato + bocadillo "¡Esa no es sana!"). Al
  colocar los `PLATE_HEALTHY` sanos → `finishPlate()` → ⭐ + resultados.
- **Enunciados:** Fase 1 "¿Es saludable este alimento?" (pregunta, sin punto); Fase 2
  "Arrastra solo la comida sana al plato." (declarativo, con punto §8).
- El reporte lista los ejercicios (alimentos clasificados + el plato) con ✓/✗.
- REINICIAR / "jugar otra vez" rebarajan (`pickClassify`/`pickPlate`).
- **Hooks de test** `data-ok` (carta) y `data-tile`/`data-ok` (fichas de bandeja)
  para el QA con Playwright (inofensivos en producción).

Reglas EDINUN que respeta (ver `USER.md` y `memory/aprendizajes-de-diseno.md`):
fallar no baja progreso; al fallar se revela lo correcto; RONDA como J1 (§10);
enunciado = la meta con punto (§8/§11); barajado anti-repetición (§12);
salir/reiniciar con modal; bloque centrado en X; bocadillo sin sombra oscura;
`markFirstAttempt()` en la 1ª acción; `incrementGamesCompleted()` al terminar.

### Personajes

Catálogo compartido: Luna (astronauta), Bruno (naturalista), Mía (química), Tomi
(geólogo). **Personaje destacado en el landing y guía por defecto: `naturalista`
(Bruno)** — encaja con comida/naturaleza/salud. El niño puede elegir otro guía.

## Contador de visitas

`counter.php` (idéntico en todos los juegos) cuenta visitas globales; cae a
`localStorage` si el servidor no ejecuta PHP. No personalizar. `visits.txt` está
gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Antes de declarar completo, capturar el flujo en al menos: 1920×1080, 1280×800,
1024×768, 768×1024, 667×375, 375×667. El arrastre de la Fase 2 se puede probar de
verdad con Playwright (declarado como devDependency).
