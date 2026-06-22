# USER.md — Preferencias del usuario

Cómo Estefano (EDINUN) prefiere trabajar. Aplica a este repo y a los juegos de
Ciencias Naturales. Léelo antes de hacer cambios para no romper expectativas
implícitas.

> **Mantener este archivo bajo 300 líneas.** Si crece, dividir en sub-docs en `.planning/`.

---

## Principios fundamentales

### 1. La usabilidad es la prioridad — y "usabilidad" empieza por responsive

Cualquier juego debe verse y funcionar bien en **móvil, tablet y desktop**. No es
aceptable una pantalla que solo se ve bien en una resolución. Si hay que elegir
entre una feature nueva o asegurar que lo existente es responsive, **se asegura
responsive primero**.

### 2. Audiencia: ajustada al tema (Ciencias Naturales, típico 9-12)

Confirmar la edad objetivo por juego y registrarla en `memory/audiencia_por_juego.md`.
Todo el copy de UI:
- **Corto y accionable.** Frases de una línea. Verbos directos.
- **Sin jerga innecesaria.** Si un término científico es el objeto de aprendizaje,
  introducirlo con apoyo (ejemplo, emoji, pista); si no, evitarlo.
- **Sin negaciones complejas.**

### 3. Acciones destructivas siempre con modal

Salir del juego, rendirse, reiniciar progreso — **siempre** modal de confirmación
antes de ejecutar, aunque parezca obvio. La fricción del modal es deseable: un
niño toca por curiosidad y perder progreso por un tap accidental frustra.

### 4. Fallar no penaliza lo ya logrado · revelar la respuesta correcta

Al fallar, mantener (no bajar) el progreso ganado y **revelar la respuesta
correcta dejando ver lo que eligió el niño**. Completar el objetivo es éxito
aunque haya habido errores. Ver `memory/aprendizajes-de-diseno.md`.

### 5. No inventar texto visible nuevo sin confirmar

Los nombres internos de rondas/mecánicas (de comentarios de código) no van como
rótulos visibles. Antes de añadir texto/rótulos nuevos a la pantalla, confirmar.

---

## Metodología de QA responsive

### Setup

1. **Servidor estático local:** `python -m http.server 8765` en la raíz del repo.
   (Para probar el contador PHP real: `php -S localhost:8000` desde la carpeta del juego.)
2. **Chrome headless** para capturas batch (`C:\Program Files\Google\Chrome\Application\chrome.exe`).
3. **Playwright** (devDependency) para emulación fiel de dispositivos pequeños.

### Comando de captura

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --disable-gpu --hide-scrollbars \
  --window-size=W,H --virtual-time-budget=4000 \
  --screenshot="/tmp/edinun-shots/<nombre>.png" \
  "http://127.0.0.1:8765/juegos/<slug>/index.html"
```

### Viewports a cubrir (mínimo)

| Categoría        | Tamaño     | Notas                                              |
|------------------|------------|----------------------------------------------------|
| Desktop FullHD   | 1920×1080  | Escritorio actual                                  |
| Desktop laptop   | 1280×800   | Portátil estándar                                  |
| Tablet landscape | 1024×768   | iPad clásico                                       |
| Tablet portrait  | 768×1024   | iPad clásico vertical (lienzo letterboxed)         |
| Mobile landscape | 667×375    | iPhone SE horizontal — la "vista correcta"         |
| Mobile portrait  | 375×667    | iPhone SE vertical — debe bloquear con "Gira tu teléfono" |

Cada pantalla del flujo (Home, Personaje, Juego, Resultados) en al menos los
viewports relevantes.

### Iteración

1. Capturar. 2. Revisar todas: ¿lienzo centrado? ¿contenido sin clipping? ¿el
bloqueo de rotación aparece donde debe? 3. Si hay problema, **arreglar en el
código** (no parchar el screenshot). Re-empaquetar y re-capturar. 4. Repetir
hasta que todos los viewports se vean correctos.

### Caveat: Chrome headless en Windows

`--window-size` tiene un mínimo (~482px ancho) y `innerHeight` reporta ~96px
menos. Para viewports muy pequeños (<482px) usar Playwright con
`Emulation.setDeviceMetricsOverride` o un teléfono real.

---

## Decisiones de diseño que se mantienen

- **Lienzo lógico fijo 900×540 (paisaje)** + escala uniforme *contain*. El centro
  del lienzo siempre coincide con el centro del viewport (`position:absolute;
  left:50%; top:50%; transform: translate(-50%,-50%) scale()`). NO usar
  `display:grid; placeItems:center` (bug: en mobile portrait el lienzo queda en
  la esquina superior izquierda).
- **Móvil portrait: el contenido NO rota.** El usuario gira físicamente el
  teléfono; un overlay bloqueante "Gira tu teléfono" cubre la pantalla hasta que
  rote a landscape.
- **Sin marco de teléfono ni notch decorativo.** Fondo cósmico edge-to-edge.
- **Personajes estilo Mario Kart:** Merlín (mago), Nova (física), Cifra
  (numerólogo), Pita (geómetra). PNG en `assets/char-<id>.png` con sparkles SVG.

---

## Cómo aplicar a juegos nuevos

1. **Clonar `_PLANTILLA`** (HTML estático + bundle inline + `bundle.py`/`.ps1`).
   No introducir build step salvo necesidad estricta.
2. **Mantener el lienzo 900×540** o documentar por qué se cambia.
3. **Aplicar la QA responsive** desde el primer commit jugable.
4. **Reusar paleta y tipografía** de `styles.css` (variables `--ed-*`).
5. **Ajustar este USER.md** si las preferencias evolucionan.

---

## Archivos relacionados

- `CLAUDE.md` — guía técnica del juego (arquitectura, comandos, invariantes).
- `MEMORY.md` — bitácora del juego.
- `.planning/` — notas técnicas por tema (cada archivo <200 líneas).
- `.planning/bundle.py` / `.planning/bundle.ps1` — re-empaquetado de los `.jsx`.
