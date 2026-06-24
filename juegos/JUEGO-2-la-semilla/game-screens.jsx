// game-screens.jsx — JUEGO-2 · "La semilla" (Ciencias Naturales, 6 años).
// Mecánica "Ordena la germinación" sobre el FORMATO EDINUN (ref: edinun-language):
// el niño ARRASTRA las 4 imágenes de la planta a sus casilleros (1·2·3·4) en el
// orden en que crece la semilla (semilla → brote → tallito → plantita).
//
// El arrastre usa Pointer Events (funciona con mouse Y táctil). El lienzo lógico
// es 900×540 y el escenario lo escala con transform; por eso convertimos las
// coordenadas de pantalla a coords lógicas con el rect del contenedor raíz.
//
// CONTRATO: GameScreen/ResultsScreen({app,setApp,go}) expuestos en window;
// markFirstAttempt() en el primer arrastre; incrementGamesCompleted() al fin.
// Invariantes EDINUN: fallar NO baja progreso; al fallar se revela el orden
// correcto dejando ver lo que puso el niño; salir/reiniciar con modal.

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

function PortalToBody({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

const CAT_LABEL = "La semilla";

// Etapas de la germinación, en su orden correcto (índice = posición 0..3).
const STAGE_FILES = ["semilla", "brote", "tallito", "plantita"]; // assets/<file>.png
const STAGE_LABEL = ["Semilla", "Brote", "Tallito", "Plantita"];
const STAGE_FALLBACK = ["🫘", "🌱", "🌿", "🪴"]; // si falta la imagen
const POS_BADGE = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];
const N = 4;

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Orden inicial de la bandeja: barajado y nunca ya resuelto.
function initialTrayOrder() {
  let a = shuffle([0, 1, 2, 3]);
  let guard = 0;
  while (a.join() === "0,1,2,3" && guard++ < 20) a = shuffle([0, 1, 2, 3]);
  return a;
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de planta — imagen de la etapa con respaldo a emoji.
// ─────────────────────────────────────────────────────────────
function PlantCard({ stageId, size, dim }) {
  const [err, setErr] = useStateG(false);
  return (
    <div style={{
      position: "relative", width: size, height: size, borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(180deg, #cfeafe 0%, #eaf7df 58%, #d6edc2 100%)",
      opacity: dim ? 0.32 : 1, userSelect: "none",
    }}>
      {err ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <span style={{ fontSize: Math.round(size * 0.5), paddingBottom: 8 }}>{STAGE_FALLBACK[stageId]}</span>
        </div>
      ) : (
        <img
          src={`assets/${STAGE_FILES[stageId]}.png`}
          alt=""
          draggable={false}
          onError={() => setErr(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
        />
      )}
    </div>
  );
}

const CARD = 116;

function GameScreen({ app, setApp, go }) {
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];

  // placement[stageId] = "tray" | 0..3 (índice de casillero)
  const [placement, setPlacement] = useStateG(() => ["tray", "tray", "tray", "tray"]);
  const placementRef = useRefG(placement);
  placementRef.current = placement;

  const [trayOrder, setTrayOrder] = useStateG(() => initialTrayOrder());
  const [ghost, setGhost] = useStateG(null);        // { stageId, x, y } en coords lógicas
  const [reveal, setReveal] = useStateG(null);      // slotsArr evaluado, o null
  const [locked, setLocked] = useStateG(false);
  const [stars, setStars] = useStateG(0);
  const [elapsed, setElapsed] = useStateG(0);
  const [feedback, setFeedback] = useStateG(null);
  const [feedbackMsg, setFeedbackMsg] = useStateG("");
  const [confirmingExit, setConfirmingExit] = useStateG(false);
  const [confirmingRestart, setConfirmingRestart] = useStateG(false);

  const rootRef = useRefG(null);
  const started = useRefG(Date.now());
  const firstDrag = useRefG(false);

  useEffectG(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Limpia el conteo de revisión si la pantalla se desmonta.
  useEffectG(() => () => cancelCheck(), []);

  // slotsArr[i] = stageId colocado en el casillero i (o null)
  const slotsArr = [null, null, null, null];
  placement.forEach((loc, id) => { if (typeof loc === "number") slotsArr[loc] = id; });
  const placedCount = slotsArr.filter((x) => x != null).length;
  const draggingId = ghost ? ghost.stageId : null;

  function formatTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function toLogical(clientX, clientY) {
    const r = rootRef.current.getBoundingClientRect();
    return { x: (clientX - r.left) * 900 / r.width, y: (clientY - r.top) * 540 / r.height };
  }

  function onCardDown(e, stageId) {
    if (locked) return;
    cancelCheck();
    e.preventDefault();
    if (!firstDrag.current) {
      firstDrag.current = true;
      if (typeof markFirstAttempt === "function") markFirstAttempt();
    }
    const cardRect = e.currentTarget.getBoundingClientRect();
    const tl = toLogical(cardRect.left, cardRect.top);
    const p = toLogical(e.clientX, e.clientY);
    const off = { x: p.x - tl.x, y: p.y - tl.y };
    setGhost({ stageId, x: tl.x, y: tl.y });

    const onMove = (ev) => {
      const q = toLogical(ev.clientX, ev.clientY);
      setGhost((g) => (g ? { ...g, x: q.x - off.x, y: q.y - off.y } : g));
    };
    const onUp = (ev) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      handleDrop(ev, stageId);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleDrop(ev, stageId) {
    setGhost(null);
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const slotEl = el && el.closest ? el.closest("[data-slot]") : null;
    if (slotEl) {
      placeCard(stageId, parseInt(slotEl.getAttribute("data-slot"), 10));
      return;
    }
    const trayEl = el && el.closest ? el.closest("[data-tray]") : null;
    if (trayEl) {
      const next = placementRef.current.slice();
      next[stageId] = "tray";
      placementRef.current = next;
      setPlacement(next);
      scheduleCheck(next);
    }
    // Si se soltó fuera de todo: no cambia (vuelve solo a su lugar).
  }

  function placeCard(stageId, slot) {
    const next = placementRef.current.slice();
    for (let id = 0; id < N; id++) { if (next[id] === slot) next[id] = "tray"; } // desaloja al ocupante
    next[stageId] = slot;
    placementRef.current = next;
    setPlacement(next);
    scheduleCheck(next);
  }

  // NO es instantáneo al colocar la última ficha: hay un margen ("tiempito") por
  // si el niño quiere reacomodar. Cada cambio o arrastre REINICIA el conteo;
  // cuando se queda quieto con las 4 puestas, recién se revisa solo.
  const GRACE_MS = 2000;
  const checkTimer = useRefG(null);

  function cancelCheck() {
    if (checkTimer.current) { clearTimeout(checkTimer.current); checkTimer.current = null; }
  }

  function scheduleCheck(p) {
    cancelCheck();
    if (!locked && p.every((v) => typeof v === "number")) {
      checkTimer.current = setTimeout(() => evaluate(placementRef.current), GRACE_MS);
    }
  }

  function evaluate(finalPlacement) {
    const arr = [null, null, null, null];
    finalPlacement.forEach((loc, id) => { if (typeof loc === "number") arr[loc] = id; });
    let solved = 0;
    for (let i = 0; i < N; i++) if (arr[i] === i) solved++;
    const ok = solved === N;

    setLocked(true);
    setReveal(arr);
    setStars(solved);
    setFeedback(ok ? "ok" : "err");
    setFeedbackMsg(ok ? `¡${solved} de ${N}! ⭐` : "Así crece la semilla 🌱");

    const log = arr.map((sid, i) => ({
      idx: i + 1,
      emoji: POS_BADGE[i],
      a: `Posición ${i + 1}`,
      userAnswer: sid != null ? STAGE_LABEL[sid] : "—",
      correctAnswer: STAGE_LABEL[i],
      isCorrect: sid === i,
      time: 0,
    }));

    setApp((s) => ({
      ...s,
      stars: solved,
      lastResult: {
        category: CAT_LABEL,
        solved,
        total: N,
        time: Math.floor((Date.now() - started.current) / 1000),
        starsEarned: solved,
        log,
      },
    }));
    if (typeof incrementGamesCompleted === "function") incrementGamesCompleted();
    setTimeout(() => go("results"), ok ? 1700 : 2700);
  }

  function confirmRestart() {
    setConfirmingRestart(false);
    cancelCheck();
    const fresh = ["tray", "tray", "tray", "tray"];
    placementRef.current = fresh;
    setPlacement(fresh);
    setTrayOrder(initialTrayOrder());
    setGhost(null); setReveal(null); setLocked(false); setStars(0);
    setFeedback(null); setFeedbackMsg("");
    firstDrag.current = false;
    started.current = Date.now();
  }

  // Bocadillo fijo durante el juego (no cambia al mover fichas); solo cambia al
  // final para mostrar el resultado.
  const bocadillo = locked
    ? (reveal && reveal.every((sid, i) => sid === i) ? "¡Perfecto, lo ordenaste!" : "¡Casi! Mira el orden correcto.")
    : "Ordena: semilla, brote, tallito y plantita.";

  // Estilo de borde de cada casillero según estado.
  function slotBorder(i) {
    if (reveal) return slotsArr[i] === i ? "3px solid #2ecc8f" : "3px solid #ff6b6b";
    if (slotsArr[i] != null) return "3px solid #f2c260";
    return "3px dashed rgba(252,233,168,0.7)";
  }

  // Tarjeta arrastrable (envuelve PlantCard con el handler de pointer).
  function Draggable({ stageId }) {
    return (
      <div
        onPointerDown={(e) => onCardDown(e, stageId)}
        style={{ width: CARD, height: CARD, touchAction: "none", cursor: locked ? "default" : "grab",
          borderRadius: 16, border: "3px solid #f2c260",
          boxShadow: "0 8px 18px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.10)" }}
      >
        <PlantCard stageId={stageId} size={CARD - 6} />
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* ── HUD: logo izq, tiempo + estrellas der ── */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <EdinunLogoMini size={56} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.35)", borderRadius: 999, padding: "6px 12px", border: "1px solid rgba(242,194,96,0.4)", fontFamily: "var(--ed-font-mono)", fontSize: 13, color: "#fce9a8" }}>
            ⏱ {formatTime(elapsed)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.35)", borderRadius: 999, padding: "6px 12px", border: "1px solid rgba(242,194,96,0.4)", fontFamily: "var(--ed-font-display)", fontWeight: 600, color: "#fce9a8" }}>
            ⭐ {stars}
          </div>
        </div>
      </div>

      {/* ── Personaje guía + bocadillo (izquierda) ──
          left:0 (pegado al borde) para que el bocadillo despeje el casillero 1,
          que con el juego centrado (zona central en 183) empieza en x≈197. */}
      <div style={{ position: "absolute", left: 0, bottom: 76, width: 210, pointerEvents: "none", textAlign: "center" }}>
        <div className="ed-float-soft" style={{ position: "absolute", left: 0, right: 0, bottom: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{
            position: "relative", display: "inline-block", maxWidth: 156,
            background: "linear-gradient(180deg, rgba(20,12,55,0.95), rgba(10,6,35,0.95))",
            border: "1.5px solid rgba(242,194,96,0.65)", borderRadius: 16, padding: "9px 12px",
            fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 13, lineHeight: 1.3,
            color: "#fce9a8", textAlign: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
            {bocadillo}
            <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "10px solid rgba(20,12,55,0.95)", filter: "drop-shadow(0 1px 0 rgba(242,194,96,0.55))" }} />
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", width: 140, height: 16, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(242,194,96,0.45), transparent 70%)", filter: "blur(5px)" }} />
          <char.Component size={182} floating />
        </div>
        <div style={{ marginTop: -2, fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 13, color: "#fce9a8", letterSpacing: "0.04em", textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>{char.name}</div>
      </div>

      {/* ── Zona central: título + casilleros + bandeja, repartidos parejo ──
          Márgenes IGUALES (183/183) para que el bloque quede centrado en el
          eje X del lienzo (900): la bandeja mide 534 → (900-534)/2 = 183. El
          personaje vive en el margen izquierdo y los botones en el derecho. */}
      <div style={{ position: "absolute", top: 58, bottom: 14, left: 183, right: 183, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly" }}>
        {/* Título / instrucción */}
        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", lineHeight: 1.1 }}>
            Ordena cómo crece la semilla
          </div>
          <div style={{ fontFamily: "var(--ed-font-ui)", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
            Arrastra las imágenes en orden, del 1 al 4.
          </div>
        </div>

        {/* Casilleros numerados */}
        <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
          {Array.from({ length: N }).map((_, i) => {
            const occ = slotsArr[i];
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 14, color: "#fce9a8" }}>{i + 1}</div>
                <div
                  data-slot={i}
                  style={{
                    width: CARD, height: CARD, borderRadius: 18, border: slotBorder(i),
                    background: occ != null ? "transparent" : "rgba(0,0,0,0.18)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: reveal && slotsArr[i] === i ? "0 0 18px rgba(46,204,143,0.55)" : "inset 0 2px 6px rgba(0,0,0,0.25)",
                  }}
                >
                  {occ == null ? (
                    <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 40, color: "rgba(252,233,168,0.5)" }}>{i + 1}</span>
                  ) : occ === draggingId ? (
                    <PlantCard stageId={occ} size={CARD - 6} dim />
                  ) : (
                    <Draggable stageId={occ} />
                  )}
                </div>
                {reveal && slotsArr[i] !== i && (
                  <div style={{ fontFamily: "var(--ed-font-ui)", fontSize: 11, fontWeight: 700, color: "#7CF2BF" }}>✓ {STAGE_LABEL[i]}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bandeja con las fotos para arrastrar */}
        <div data-tray="1" style={{ display: "flex", gap: 14, justifyContent: "center", alignItems: "center", padding: "10px 14px", borderRadius: 20, background: "rgba(0,0,0,0.22)", border: "1.5px solid rgba(242,194,96,0.25)", minHeight: CARD + 20 }}>
          {trayOrder.map((stageId, k) => {
            const inTray = placement[stageId] === "tray";
            if (!inTray) {
              return <div key={k} style={{ width: CARD, height: CARD, borderRadius: 16, border: "2px dashed rgba(255,255,255,0.12)" }} />;
            }
            if (stageId === draggingId) {
              return <div key={k} style={{ width: CARD, height: CARD, borderRadius: 16, border: "3px solid rgba(242,194,96,0.3)" }}><PlantCard stageId={stageId} size={CARD - 6} dim /></div>;
            }
            return <Draggable key={k} stageId={stageId} />;
          })}
        </div>
      </div>

      {/* ── Acciones (derecha): REINICIAR · SALIR ── */}
      <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 12, width: 116 }}>
        <button className="ed-btn ed-btn-restart" onClick={() => setConfirmingRestart(true)} title="Empezar de nuevo" style={{ fontSize: 14, padding: "0 8px", height: 54, fontWeight: 800, letterSpacing: "0.03em" }}>
          REINICIAR
        </button>
        <button className="ed-btn ed-btn-ghost" onClick={() => setConfirmingExit(true)} title="Salir al inicio" style={{ fontSize: 14, padding: "0 8px", height: 54, fontWeight: 800, letterSpacing: "0.03em" }}>
          SALIR
        </button>
      </div>

      {/* ── Tarjeta fantasma que sigue al dedo/cursor ── */}
      {ghost && (
        <div style={{ position: "absolute", left: ghost.x, top: ghost.y, width: CARD, height: CARD, pointerEvents: "none", zIndex: 2000, transform: "scale(1.06)", borderRadius: 18, border: "3px solid #f2c260", boxShadow: "0 16px 26px rgba(0,0,0,0.5)" }}>
          <PlantCard stageId={ghost.stageId} size={CARD - 6} />
        </div>
      )}

      {/* ── Overlay de feedback ── */}
      {feedback && (
        <PortalToBody>
          <div style={{
            position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "none",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)", animation: "ed-pop-in 0.3s",
          }}>
            <div style={{
              fontFamily: "'Fredoka','Baloo 2',system-ui,sans-serif", fontWeight: 700,
              fontSize: "clamp(56px, 11vmin, 120px)",
              color: feedback === "ok" ? "#2ecc8f" : "#ff6b6b",
              textShadow: "0 4px 0 rgba(0,0,0,0.45), 0 0 60px currentColor",
            }}>
              {feedback === "ok" ? "¡EXCELENTE!" : "¡CASI!"}
            </div>
            {feedbackMsg && (
              <div style={{
                fontFamily: "'Fredoka','Baloo 2',system-ui,sans-serif", fontWeight: 700,
                fontSize: "clamp(18px, 2.6vmin, 30px)",
                color: feedback === "ok" ? "#fce9a8" : "#fff",
                background: "rgba(0,0,0,0.55)", padding: "8px 26px", borderRadius: 999,
                textShadow: "0 2px 6px rgba(0,0,0,0.6)", textAlign: "center",
              }}>
                {feedbackMsg}
              </div>
            )}
          </div>
        </PortalToBody>
      )}

      {/* ── Modal SALIR ── */}
      {confirmingExit && (
        <PortalToBody>
          <div onClick={() => setConfirmingExit(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "ed-pop-in 0.18s", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} className="ed-card" style={{ padding: 24, maxWidth: 440, textAlign: "center", boxShadow: "var(--ed-shadow-card), 0 0 40px rgba(255,107,107,0.3)" }}>
              <div className="ed-label" style={{ color: "#ff8b8b", marginBottom: 6 }}>Salir del juego</div>
              <h2 className="ed-h1" style={{ fontSize: 22, lineHeight: 1.15, marginBottom: 8 }}>¿Volver al inicio?</h2>
              <p className="ed-body" style={{ marginBottom: 16, fontSize: 14 }}>Vas a perder lo de esta ronda.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button className="ed-btn ed-btn-ghost" onClick={() => setConfirmingExit(false)} style={{ height: 44, fontWeight: 800, letterSpacing: "0.04em" }}>SEGUIR JUGANDO</button>
                <button className="ed-btn ed-btn-primary" onClick={() => { setConfirmingExit(false); go("home"); }} style={{ height: 44, fontWeight: 800, letterSpacing: "0.04em" }}>SÍ, SALIR</button>
              </div>
            </div>
          </div>
        </PortalToBody>
      )}

      {/* ── Modal REINICIAR ── */}
      {confirmingRestart && (
        <PortalToBody>
          <div onClick={() => setConfirmingRestart(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "ed-pop-in 0.18s", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} className="ed-card" style={{ padding: 24, maxWidth: 440, textAlign: "center", boxShadow: "var(--ed-shadow-card), 0 0 40px rgba(155,123,232,0.3)" }}>
              <div className="ed-label" style={{ color: "#c4a8ff", marginBottom: 6 }}>Reiniciar juego</div>
              <h2 className="ed-h1" style={{ fontSize: 22, lineHeight: 1.15, marginBottom: 8 }}>¿Empezar de nuevo?</h2>
              <p className="ed-body" style={{ marginBottom: 16, fontSize: 14 }}>Se mezclan las imágenes otra vez.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button className="ed-btn ed-btn-ghost" onClick={() => setConfirmingRestart(false)} style={{ height: 44, fontWeight: 800, letterSpacing: "0.04em" }}>SEGUIR JUGANDO</button>
                <button className="ed-btn ed-btn-primary" onClick={confirmRestart} style={{ height: 44, fontWeight: 800, letterSpacing: "0.04em" }}>SÍ, REINICIAR</button>
              </div>
            </div>
          </div>
        </PortalToBody>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RESULTS — reporte académico (mismo formato que la ref de Lenguaje).
// ─────────────────────────────────────────────────────────────
const printStyles = {
  doc: { padding: 0, margin: 0, color: "#111", background: "#fff" },
  head: { display: "flex", alignItems: "center", gap: 14, borderBottom: "2px solid #d9a441", paddingBottom: 10, marginBottom: 14 },
  logo: { width: 56, height: 56, objectFit: "contain" },
  org: { fontFamily: "'Fredoka','Baloo 2','Nunito',sans-serif", fontWeight: 700, fontSize: "16pt", letterSpacing: "0.03em", lineHeight: 1.1, margin: 0 },
  sub: { fontSize: "9pt", color: "#555", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 4 },
  date: { fontFamily: "ui-monospace,Consolas,monospace", fontSize: "10pt", color: "#555", textAlign: "right", whiteSpace: "nowrap" },
  fields: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 },
  field: { padding: "8px 10px", borderRadius: 6, border: "1px solid #ddd" },
  fieldL: { fontSize: "8pt", textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" },
  fieldV: { fontSize: "12pt", fontWeight: 700, marginTop: 2 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "11pt" },
  thHead: { borderBottom: "2px solid #111" },
  th: { padding: 8, textAlign: "left", fontSize: "9pt", textTransform: "uppercase", letterSpacing: "0.08em", color: "#555", fontWeight: 700 },
  thC: { textAlign: "center" },
  thR: { textAlign: "right" },
  tr: { borderBottom: "1px solid #ccc" },
  td: { padding: "9px 8px", fontFamily: "'Nunito',sans-serif" },
  tdNum: { color: "#888", width: 36, fontFamily: "ui-monospace,Consolas,monospace" },
  tdOk: { color: "#1e8a5d", textAlign: "center", fontWeight: 700 },
  tdErr: { color: "#c33b3b", textAlign: "center", fontWeight: 700 },
  summary: { marginTop: 16, borderTop: "2px solid #d9a441", paddingTop: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  cell: { padding: 10, borderRadius: 6, border: "1px solid #ddd", textAlign: "center" },
  cellEmp: { background: "#faf3df", borderColor: "#d9a441" },
  cellL: { fontSize: "8pt", textTransform: "uppercase", letterSpacing: "0.08em", color: "#666" },
  cellV: { fontSize: "18pt", fontWeight: 800, marginTop: 4 },
  foot: { marginTop: 16, fontSize: "9pt", color: "#888", textAlign: "center" },
};

function PrintableReport({ studentName, res, dateStr, mm, ss, attemptedCount, accuracy }) {
  const log = res.log || [];
  return (
    <PortalToBody>
      <div className="ed-print-doc" style={printStyles.doc} aria-hidden="true">
        <div style={printStyles.head}>
          <img src="assets/edinun-logo.png" alt="" style={printStyles.logo} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={printStyles.org}>EDINUN — Ediciones Nacionales Unidas</h1>
            <div style={printStyles.sub}>Reporte académico · Ciencias Naturales</div>
          </div>
          <div style={printStyles.date}>{dateStr}</div>
        </div>
        <div style={printStyles.fields}>
          <div style={printStyles.field}><div style={printStyles.fieldL}>Estudiante</div><div style={printStyles.fieldV}>{studentName || "—"}</div></div>
          <div style={printStyles.field}><div style={printStyles.fieldL}>Tema</div><div style={printStyles.fieldV}>{res.category || "—"}</div></div>
          <div style={printStyles.field}><div style={printStyles.fieldL}>Tiempo total</div><div style={printStyles.fieldV}>{String(mm).padStart(2,"0")}:{String(ss).padStart(2,"0")}</div></div>
        </div>
        <table style={printStyles.table}>
          <thead>
            <tr style={printStyles.thHead}>
              <th style={printStyles.th}>#</th>
              <th style={printStyles.th}>Posición</th>
              <th style={{ ...printStyles.th, ...printStyles.thR }}>Lo que puso</th>
              <th style={{ ...printStyles.th, ...printStyles.thR }}>Correcto</th>
              <th style={{ ...printStyles.th, ...printStyles.thC }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {log.map((e) => (
              <tr key={e.idx} style={printStyles.tr}>
                <td style={{ ...printStyles.td, ...printStyles.tdNum }}>{e.idx}</td>
                <td style={{ ...printStyles.td, fontWeight: 700 }}>{e.emoji} {e.a}</td>
                <td style={{ ...printStyles.td, textAlign: "right" }}>{e.userAnswer}</td>
                <td style={{ ...printStyles.td, textAlign: "right" }}>{e.correctAnswer}</td>
                <td style={{ ...printStyles.td, ...(e.isCorrect ? printStyles.tdOk : printStyles.tdErr) }}>{e.isCorrect ? "Correcto" : "Incorrecto"}</td>
              </tr>
            ))}
            {log.length === 0 && (<tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#888", fontStyle: "italic" }}>Sin ejercicios.</td></tr>)}
          </tbody>
        </table>
        <div style={printStyles.summary}>
          <div style={printStyles.cell}><div style={printStyles.cellL}>Posiciones</div><div style={printStyles.cellV}>{attemptedCount} / {res.total}</div></div>
          <div style={printStyles.cell}><div style={printStyles.cellL}>Correctas</div><div style={printStyles.cellV}>{res.solved}</div></div>
          <div style={printStyles.cell}><div style={printStyles.cellL}>Estrellas</div><div style={printStyles.cellV}>{res.starsEarned}</div></div>
          <div style={{ ...printStyles.cell, ...printStyles.cellEmp }}><div style={printStyles.cellL}>Precisión</div><div style={printStyles.cellV}>{accuracy}%</div></div>
        </div>
        <div style={printStyles.foot}>EDINUN GAMES · Reporte generado automáticamente</div>
      </div>
    </PortalToBody>
  );
}

function ReportField({ label, value }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 10, background: "rgba(10,6,35,0.45)", border: "1px solid rgba(148,120,255,0.25)" }}>
      <div className="ed-label" style={{ fontSize: 9, color: "var(--ed-ink-soft)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 600, fontSize: 14, color: "var(--ed-ink)" }}>{value}</div>
    </div>
  );
}

function SummaryCell({ label, value, tone = "var(--ed-ink)", emphasis = false }) {
  return (
    <div style={{ padding: "8px 10px", borderRadius: 10, background: emphasis ? "rgba(242,194,96,0.12)" : "rgba(10,6,35,0.4)", border: `1px solid ${emphasis ? "rgba(242,194,96,0.5)" : "rgba(148,120,255,0.25)"}`, textAlign: "center" }}>
      <div className="ed-label" style={{ fontSize: 9, color: "var(--ed-ink-soft)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: emphasis ? 22 : 18, color: tone, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function ResultsScreen({ app, setApp, go }) {
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];
  const res = app.lastResult || { category: CAT_LABEL, solved: 0, total: N, time: 0, starsEarned: 0, log: [] };
  const mm = Math.floor(res.time / 60), ss = res.time % 60;
  const totalEx = res.total || N;
  const attemptedCount = (res.log || []).length;
  const accuracy = attemptedCount > 0 ? Math.round((res.solved / attemptedCount) * 100) : 0;
  const dateStr = new Date().toLocaleDateString("es-EC", { year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 14, left: 24, right: 24, display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
        <button className="ed-btn ed-btn-ghost" onClick={() => go("home")} style={{ padding: "8px 14px", fontWeight: 800, letterSpacing: "0.04em" }}>← VOLVER AL INICIO</button>
      </div>

      <div style={{ position: "absolute", inset: "70px 32px 20px 32px", display: "grid", gridTemplateColumns: "0.85fr 1.4fr", gap: 24, alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 32, background: "linear-gradient(180deg, #fce9a8, #d9a441)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: 4 }}>
            ¡Orden completo!
          </div>
          <char.Component size={176} />
          <div className="ed-body" style={{ fontStyle: "italic", textAlign: "center", maxWidth: 240, fontSize: 13 }}>
            "{app.studentName || "Campeón"}, ordenaste bien {res.solved} de {totalEx}."
            <div style={{ marginTop: 4, color: "var(--ed-ink-soft)", fontSize: 12 }}>— {char.name}</div>
          </div>
        </div>

        <div className="ed-card" style={{ padding: 16, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, borderBottom: "2px solid rgba(242,194,96,0.45)", paddingBottom: 10, marginBottom: 12 }}>
            <EdinunLogoMini size={52} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 17, letterSpacing: "0.04em", lineHeight: 1.1 }}>EDINUN — Ediciones Nacionales Unidas</div>
              <div style={{ fontFamily: "var(--ed-font-ui)", fontSize: 11, color: "var(--ed-ink-soft)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>Reporte académico · Ciencias Naturales</div>
            </div>
            <div style={{ fontFamily: "var(--ed-font-mono)", fontSize: 11, color: "var(--ed-ink-dim)", textAlign: "right" }}>{dateStr}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, fontFamily: "var(--ed-font-ui)", fontSize: 12, marginBottom: 10 }}>
            <ReportField label="Estudiante" value={app.studentName || "—"} />
            <ReportField label="Tema" value={res.category} />
            <ReportField label="Tiempo" value={`${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`} />
          </div>

          <div style={{ flex: 1, minHeight: 0, overflow: "auto", marginBottom: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--ed-font-ui)", fontSize: 12 }}>
              <thead>
                <tr style={{ fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ed-ink-dim)", borderBottom: "1px solid rgba(148,120,255,0.3)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", width: 30 }}>#</th>
                  <th style={{ textAlign: "left", padding: "6px 8px" }}>Posición</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Puso</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Correcto</th>
                  <th style={{ textAlign: "center", padding: "6px 8px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {(res.log || []).map((e) => (
                  <tr key={e.idx} style={{ borderBottom: "1px solid rgba(148,120,255,0.18)" }}>
                    <td style={{ padding: "7px 8px", color: "var(--ed-ink-soft)" }}>{e.idx}</td>
                    <td style={{ padding: "7px 8px", fontWeight: 600 }}>{e.emoji} {e.a}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right" }}>{e.userAnswer}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right" }}>{e.correctAnswer}</td>
                    <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--ed-font-display)", fontWeight: 700, color: e.isCorrect ? "#2ecc8f" : "#ff6b6b" }}>{e.isCorrect ? "✓" : "✗"}</td>
                  </tr>
                ))}
                {(res.log || []).length === 0 && (<tr><td colSpan={5} style={{ padding: "16px 8px", textAlign: "center", color: "var(--ed-ink-soft)", fontStyle: "italic" }}>Sin posiciones.</td></tr>)}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "2px solid rgba(242,194,96,0.45)", paddingTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, fontFamily: "var(--ed-font-ui)", fontSize: 11 }}>
            <SummaryCell label="Posiciones" value={`${attemptedCount} / ${totalEx}`} />
            <SummaryCell label="Correctas" value={`${res.solved}`} tone="#2ecc8f" />
            <SummaryCell label="Estrellas" value={`${res.starsEarned}`} tone="#fce9a8" />
            <SummaryCell label="Precisión" value={`${accuracy}%`} tone="#fce9a8" emphasis />
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button className="ed-btn ed-btn-ghost" onClick={() => window.print()} style={{ padding: "0 10px", fontSize: 13, height: 44, fontWeight: 800, letterSpacing: "0.04em" }}>IMPRIMIR REPORTE</button>
            <button className="ed-btn ed-btn-primary" onClick={() => go("game")} style={{ padding: "0 10px", fontSize: 13, height: 44, fontWeight: 800, letterSpacing: "0.04em" }}>JUGAR OTRA VEZ</button>
          </div>
        </div>
      </div>

      <PrintableReport studentName={app.studentName} res={res} dateStr={dateStr} mm={mm} ss={ss} attemptedCount={attemptedCount} accuracy={accuracy} />
    </div>
  );
}

Object.assign(window, { GameScreen, ResultsScreen });
