# CLAUDE.md — PLANTILLA (Ciencias Naturales)

> Esta es la **plantilla base**. Al crear un juego nuevo se copia toda la carpeta
> `_PLANTILLA/` a `juegos/JUEGO-N-<slug>/` y se reemplazan los `{{PLACEHOLDERS}}`
> y el contenido de `game-screens.jsx`. No publicar `_PLANTILLA` en el landing.

## Project

**Juego: {{TÍTULO DEL JUEGO}}.** Carpeta autocontenida del repo multi-juego
`edinun-ccn-games` (Ciencias Naturales). {{Descripción de la mecánica y del tema
del libro/currículo al que mapea.}} Detalle del diseño en
`.planning/{{slug}}-design.md`.

**Audiencia {{EDAD}}** (registrar en `memory/audiencia_por_juego.md`).

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
- **El bundle reescribe desde `<script type="text/babel">` hasta `</html>`**.

### Contrato del shell

- `app.jsx` enruta por estado: `home → character → game → results`. No tocar salvo
  cambio de shell coordinado con los demás juegos.
- `screens.jsx`: `HomeScreen`, `CharacterScreen`, contador de visitas, `CosmosBg`.
  Personalizar solo los textos marcados `// ← PERSONALIZAR` y los glifos.
- `game-screens.jsx`: **aquí va la mecánica del juego.** Define `GameScreen` y
  `ResultsScreen`. La plantilla trae un quiz de opción múltiple (`DEMO_PREGUNTAS`)
  como ejemplo funcional — reemplazarlo.

### Mecánica del juego (`GameScreen`)

{{Describir aquí las rondas/mecánicas específicas cuando se implemente.}}

Reglas EDINUN que la mecánica debe respetar (ver `USER.md` y
`memory/aprendizajes-de-diseno.md`):
- Fallar no baja el progreso ya ganado; completar el objetivo cuenta como éxito.
- Al fallar, revelar la respuesta correcta dejando ver lo que eligió el niño.
- Salir/reiniciar siempre con modal.
- `markFirstAttempt()` en la primera respuesta; `incrementGamesCompleted()` al terminar.

### Personajes

Catálogo compartido: Merlín (mago), Nova (física), Cifra (numerólogo), Pita
(geómetra). **Personaje destacado en el landing: {{charId}}.**

## Contador de visitas

`counter.php` (idéntico en todos los juegos) cuenta visitas globales; cae a
`localStorage` si el servidor no ejecuta PHP. No personalizar. `visits.txt` está
gitignoreado — borrarlo antes de subir a producción.

## QA responsive

Antes de declarar completo, capturar el flujo en al menos: 1920×1080, 1280×800,
1024×768, 768×1024, 667×375, 375×667.
