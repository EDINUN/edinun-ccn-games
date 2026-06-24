# CLAUDE.md — JUEGO-3 · "Estados del agua"

> Juego publicable del repo `edinun-ccn-games`. Clonado de `JUEGO-2` (el último
> juego terminado con el formato EDINUN aprobado), no de `_PLANTILLA`. Aparece en
> el landing con `slug: "JUEGO-3-estados-del-agua"`.

## Project

**Juego: "Estados del agua".** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). Pertenece al **TEMA 2 "El Sol, la Luna y
la vida en la Tierra"**: el Sol calienta y el frío enfría, y eso cambia el agua de
estado. Enseña los **tres estados del agua** (🧊 sólido / 💧 líquido / ☁️ gaseoso)
y que el **calor y el frío** los transforman.

Mecánica **"Calienta y enfría el agua"**: el niño toca **☀️ CALENTAR** o
**❄️ ENFRIAR** y el agua avanza/retrocede en la escala de temperatura
(`sólido → líquido → gaseoso`). Cada ronda pide una **meta** (lleva el agua a tal
estado). **3 rondas**, de fácil a un pasito más.

**Audiencia: 6 años** (registrada en `memory/audiencia_por_juego.md`). Más pequeña
que el típico CCNN 9-12 → poco texto, objetivos grandes, sin presión de tiempo, dos
botones enormes y una sola acción a la vez.

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

**Ninguno.** A diferencia de JUEGO-2 (que usa 4 ilustraciones de etapas), este juego
es **100% CSS + emoji**: el vaso de agua (`WaterView`) es un `<div>` con borde y un
relleno cuya altura/color cambia por estado, con el emoji del estado dentro
(🧊/💧/☁️) y vapor (☁️💨) saliendo cuando es gaseoso. **No hubo que generar
imágenes.** Solo usa los compartidos (`char-*.png`, `edinun-logo.*`).

### Contrato del shell

- `app.jsx` enruta por estado: `home → character → game → results`. No tocar salvo
  cambio de shell coordinado con los demás juegos.
- `screens.jsx`: `HomeScreen`, `CharacterScreen`, contador de visitas, `CosmosBg`.
  Personalizado: label del tema ("Estados del agua"), subtítulo
  ("Calienta y enfría el agua 💧"), categoría (`estados-del-agua`), glifos del fondo
  (💧🧊☁️❄️🌊🌧️💨⛄☀️) y la guía por defecto (`quimica` = Mía).
- `game-screens.jsx`: **la mecánica de este juego.** Define `GameScreen`,
  `ResultsScreen`, `WaterView` (el vaso) y el `PrintableReport`.

### Mecánica del juego (`GameScreen`)

"Calienta y enfría el agua" sobre el **formato EDINUN**: HUD (logo + dots de RONDA +
⏱ tiempo + ⭐), **personaje guía con bocadillo** a la izquierda, **zona central
centrada** (título + barra de los 3 estados + vaso de agua + 2 botones) y columna de
botones a la derecha (REINICIAR/SALIR), overlay de feedback "¡EXCELENTE!" y
**ResultsScreen tipo reporte académico imprimible**.

- **Estados** (`STATES`, índice = posición en la escala de temperatura):
  `0 sólido 🧊 → 1 líquido 💧 → 2 gaseoso ☁️`. **CALENTAR** = `+1` (avanza),
  **ENFRIAR** = `-1` (retrocede). Se hace `clamp` a `0..2`: tocar más allá del tope
  no rompe nada, solo "rebota" (`bump`, animación `ed-pop-in`).
- **Rondas** (`ROUNDS`, `{start, goal}` por índice de estado): `{1→0}` (agua→hielo),
  `{1→2}` (agua→vapor), `{0→2}` (hielo→vapor). `N = 3`. Editar este array es lo único
  necesario para cambiar la dificultad o el número de rondas.
- **Barra de estados:** el estado **actual** va resaltado (borde dorado sólido); la
  **meta** va con borde verde **punteado**. El niño ve a dónde está y a dónde debe
  llegar.
- Al llegar la pieza al `goal` → `succeed()`: bloquea, suma ⭐, registra la ronda en
  el `log`, muestra el overlay "¡EXCELENTE!" 1.5 s y pasa a la siguiente ronda
  (o a `results` si era la última). El bocadillo es **estable** (no cambia en cada
  toque): "Usa el Sol y el hielo para cambiar el agua." y solo celebra al cumplir.
- **`perfect`** = llegó a la meta sin alejarse nunca (`wrongInRound`). En el reporte
  se marca "A la primera" / "Lograda" (✓✓ / ✓ en pantalla).
- El reporte lista las **3 rondas**: meta y si la logró a la primera.
- REINICIAR / "jugar otra vez" vuelven a la ronda 1 (mismas 3 rondas en orden).

Reglas EDINUN que la mecánica respeta (ver `USER.md` y `memory/aprendizajes-de-diseno.md`):
- Fallar no baja el progreso: pasarse de estado solo reacomoda, nunca resta ⭐.
- Salir/reiniciar siempre con modal.
- Bloque jugable **centrado en el eje X** con márgenes iguales (`left:183 / right:183`).
- Bocadillo **sin sombra oscura** (solo `inset 0 1px 0 rgba(255,255,255,0.08)`).
- `markFirstAttempt()` en el primer toque; `incrementGamesCompleted()` al terminar.

### Personajes

Catálogo compartido: Luna (astronauta), Bruno (naturalista), Mía (química), Tomi
(geólogo). **Personaje destacado en el landing y guía por defecto: `quimica`
(Mía)** — encaja con el tema (Mía es "maestra de los experimentos"). El niño puede
elegir otro guía en la pantalla de selección.

## Contador de visitas

`counter.php` (idéntico en todos los juegos) cuenta visitas globales; cae a
`localStorage` si el servidor no ejecuta PHP. No personalizar. `visits.txt` está
gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Antes de declarar completo, capturar el flujo en al menos: 1920×1080, 1280×800,
1024×768, 768×1024, 667×375, 375×667.
