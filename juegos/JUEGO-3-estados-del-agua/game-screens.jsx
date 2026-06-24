// game-screens.jsx — JUEGO-3 · "Estados del agua" (Ciencias Naturales, 6 años).
// Mecánica "Calienta y enfría el agua" sobre el FORMATO EDINUN: el niño toca
// ☀️ CALENTAR o ❄️ ENFRIAR y el agua cambia de estado:
//   🧊 Sólido  →  💧 Líquido  →  ☁️ Gaseoso   (calentar avanza, enfriar retrocede).
// Cada ronda da una META (lleva el agua a tal estado). 3 rondas.
//
// CONTRATO: GameScreen/ResultsScreen({app,setApp,go}) expuestos en window;
// markFirstAttempt() en el primer toque; incrementGamesCompleted() al terminar.
// Invariantes EDINUN: fallar NO baja progreso (aquí solo se reacomoda, no penaliza);
// salir/reiniciar con modal; bocadillo estable (no cambia en cada toque).

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

function PortalToBody({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

const CAT_LABEL = "Estados del agua";

// Estados en su orden físico (índice = posición en la escala de temperatura).
const STATES = [
  { key: "solido",  label: "Sólido",  corto: "hielo", emoji: "🧊", color: "#9db4ff" },
  { key: "liquido", label: "Líquido", corto: "agua",  emoji: "💧", color: "#5fb0e6" },
  { key: "gaseoso", label: "Gaseoso", corto: "vapor", emoji: "☁️", color: "#c9cdd6" },
];

// Rondas: { start, goal } por índice de estado. Pensadas de fácil a un pasito más.
const ROUNDS = [
  { start: 1, goal: 0 }, // agua → hielo (enfriar 1)
  { start: 1, goal: 2 }, // agua → vapor (calentar 1)
  { start: 0, goal: 2 }, // hielo → vapor (calentar 2)
];
const N = ROUNDS.length;

// ─────────────────────────────────────────────────────────────
// Vaso de agua que cambia de estado (todo CSS + emoji, sin imágenes).
// ─────────────────────────────────────────────────────────────
function WaterView({ state }) {
  const s = STATES[state];
  const fillH = state === 0 ? "90%" : state === 1 ? "68%" : "30%";
  const fillBg = state === 0
    ? "linear-gradient(180deg,#eaf6ff,#a9d4f5)"
    : state === 1
    ? "linear-gradient(180deg,#8fd0ff,#3a86d6)"
    : "linear-gradient(180deg,#cdecff,#8fcdf0)";
  return (
    <div style={{ position: "relative", width: 150, height: 168, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {/* Vapor saliendo (solo gaseoso) */}
      {state === 2 && (
        <div style={{ position: "absolute", top: -4, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 4 }}>
          <span className="ed-float-soft" style={{ fontSize: 30 }}>☁️</span>
          <span className="ed-float-soft" style={{ fontSize: 22, marginTop: 6 }}>💨</span>
        </div>
      )}
      {/* Vaso */}
      <div style={{ position: "relative", width: 112, height: 124, borderRadius: "12px 12px 24px 24px", border: "5px solid rgba(255,255,255,0.92)", borderTop: "none", overflow: "hidden", background: "rgba(255,255,255,0.06)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.15), 0 10px 22px rgba(0,0,0,0.35)" }}>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: fillH, background: fillBg, transition: "height 0.45s ease, background 0.45s ease", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: state === 0 ? "8px 8px 0 0" : 0 }}>
          <span style={{ fontSize: 46, lineHeight: 1, filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.25))" }}>{s.emoji}</span>
        </div>
      </div>
    </div>
  );
}

function GameScreen({ app, setApp, go }) {
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];

  const [round, setRound] = useStateG(0);
  const [cur, setCur] = useStateG(ROUNDS[0].start);
  const [stars, setStars] = useStateG(0);
  const [elapsed, setElapsed] = useStateG(0);
  const [feedback, setFeedback] = useStateG(null);     // "ok" overlay al cumplir
  const [feedbackMsg, setFeedbackMsg] = useStateG("");
  const [locked, setLocked] = useStateG(false);        // durante la transición de ronda
  const [bump, setBump] = useStateG(0);                // animación cuando no puede más
  const [log, setLog] = useStateG([]);
  const [confirmingExit, setConfirmingExit] = useStateG(false);
  const [confirmingRestart, setConfirmingRestart] = useStateG(false);

  const started = useRefG(Date.now());
  const firstTap = useRefG(false);
  const wrongInRound = useRefG(false);

  useEffectG(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(id);
  }, []);

  const goal = ROUNDS[round].goal;

  function formatTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function startRound(r) {
    setRound(r);
    setCur(ROUNDS[r].start);
    setLocked(false);
    wrongInRound.current = false;
  }

  function onAction(dir) {
    if (locked) return;
    if (!firstTap.current) {
      firstTap.current = true;
      if (typeof markFirstAttempt === "function") markFirstAttempt();
    }
    const next = Math.max(0, Math.min(STATES.length - 1, cur + dir));
    if (next === cur) { setBump((b) => b + 1); return; } // ya está al tope
    if (Math.abs(next - goal) > Math.abs(cur - goal)) wrongInRound.current = true; // se alejó
    setCur(next);
    if (next === goal) succeed(next);
  }

  function succeed(reached) {
    setLocked(true);
    const perfect = !wrongInRound.current;
    const newStars = stars + 1;
    setStars(newStars);
    setFeedback("ok");
    setFeedbackMsg(perfect ? "¡Perfecto! ⭐" : "¡Lo lograste! ⭐");
    const entry = {
      idx: round + 1,
      emoji: STATES[goal].emoji,
      a: `Ronda ${round + 1}`,
      userAnswer: `${STATES[reached].emoji} ${STATES[reached].label}`,
      correctAnswer: `${STATES[goal].emoji} ${STATES[goal].label}`,
      isCorrect: true,
      perfect,
    };
    const newLog = [...log, entry];
    setLog(newLog);
    setApp((s) => ({ ...s, stars: (s.stars || 0) + 1 }));

    const isLast = round + 1 >= N;
    setTimeout(() => {
      setFeedback(null);
      setFeedbackMsg("");
      if (isLast) {
        if (typeof incrementGamesCompleted === "function") incrementGamesCompleted();
        setApp((s) => ({
          ...s,
          stars: newStars,
          lastResult: {
            category: CAT_LABEL,
            solved: newLog.length,
            total: N,
            time: Math.floor((Date.now() - started.current) / 1000),
            starsEarned: newStars,
            log: newLog,
          },
        }));
        go("results");
      } else {
        startRound(round + 1);
      }
    }, 1500);
  }

  function confirmRestart() {
    setConfirmingRestart(false);
    setStars(0); setLog([]); setFeedback(null); setFeedbackMsg("");
    firstTap.current = false;
    started.current = Date.now();
    startRound(0);
  }

  // Bocadillo ESTABLE (no cambia en cada toque); solo celebra al cumplir.
  const bocadillo = feedback === "ok"
    ? "¡Muy bien, lo lograste!"
    : "Usa el Sol y el hielo para cambiar el agua.";

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* ── HUD: logo · RONDA dots · tiempo + estrellas ── */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <EdinunLogoMini size={56} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(0,0,0,0.35)", borderRadius: 999, padding: "6px 14px", border: "1px solid rgba(242,194,96,0.4)" }}>
          <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 12, letterSpacing: "0.12em", color: "#fce9a8" }}>RONDA</span>
          {Array.from({ length: N }).map((_, i) => (
            <span key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: i < log.length ? "#fce9a8" : i === round ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)", boxShadow: i < log.length ? "0 0 8px #fce9a8" : "none" }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.35)", borderRadius: 999, padding: "6px 12px", border: "1px solid rgba(242,194,96,0.4)", fontFamily: "var(--ed-font-mono)", fontSize: 13, color: "#fce9a8" }}>
            ⏱ {formatTime(elapsed)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.35)", borderRadius: 999, padding: "6px 12px", border: "1px solid rgba(242,194,96,0.4)", fontFamily: "var(--ed-font-display)", fontWeight: 600, color: "#fce9a8" }}>
            ⭐ {stars}
          </div>
        </div>
      </div>

      {/* ── Personaje guía + bocadillo (izquierda) ── */}
      <div style={{ position: "absolute", left: 0, bottom: 76, width: 210, pointerEvents: "none", textAlign: "center" }}>
        <div className="ed-float-soft" style={{ position: "absolute", left: 0, right: 0, bottom: "100%", display: "flex", justifyContent: "center" }}>
          <div style={{
            position: "relative", display: "inline-block", maxWidth: 168,
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

      {/* ── Zona central: título + barra de estados + vaso + botones (centrada) ── */}
      <div style={{ position: "absolute", top: 56, bottom: 14, left: 183, right: 183, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly" }}>
        {/* Título + misión de la ronda */}
        <div style={{ textAlign: "center", pointerEvents: "none" }}>
          <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", lineHeight: 1.1 }}>
            Calienta y enfría el agua
          </div>
          <div style={{ marginTop: 4, fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 15, color: "#fff" }}>
            🎯 Conviértela en <span style={{ color: "#fce9a8" }}>{STATES[goal].emoji} {STATES[goal].label}</span>
          </div>
        </div>

        {/* Barra de estados: el actual resaltado */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {STATES.map((s, i) => (
            <React.Fragment key={s.key}>
              {i > 0 && <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 20 }}>→</span>}
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2, padding: "6px 12px", borderRadius: 14, minWidth: 78,
                background: i === cur ? "rgba(242,194,96,0.22)" : i === goal ? "rgba(46,204,143,0.14)" : "rgba(0,0,0,0.18)",
                border: i === cur ? "3px solid #f2c260" : i === goal ? "3px dashed rgba(46,204,143,0.8)" : "3px solid rgba(255,255,255,0.12)",
                transition: "all 0.25s ease",
              }}>
                <span style={{ fontSize: 28, lineHeight: 1 }}>{s.emoji}</span>
                <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 12, color: i === cur ? "#fce9a8" : "rgba(255,255,255,0.75)" }}>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Vaso de agua */}
        <div key={bump} style={{ animation: "ed-pop-in 0.25s" }}>
          <WaterView state={cur} />
        </div>

        {/* Botones de acción */}
        <div style={{ display: "flex", gap: 16 }}>
          <button onClick={() => onAction(+1)} disabled={locked} title="Calentar con el Sol"
            style={{ width: 154, height: 60, borderRadius: 16, border: "3px solid #e8902f", cursor: locked ? "default" : "pointer",
              background: "linear-gradient(180deg,#ffd27a,#f2992f)", color: "#5a2e00",
              fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 17, letterSpacing: "0.02em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 8px 18px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.12)", opacity: locked ? 0.7 : 1 }}>
            <span style={{ fontSize: 26 }}>☀️</span>CALENTAR
          </button>
          <button onClick={() => onAction(-1)} disabled={locked} title="Enfriar con el hielo"
            style={{ width: 154, height: 60, borderRadius: 16, border: "3px solid #4f9fd6", cursor: locked ? "default" : "pointer",
              background: "linear-gradient(180deg,#bfe6ff,#7cc2f0)", color: "#0a3a5a",
              fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 17, letterSpacing: "0.02em",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 8px 18px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.12)", opacity: locked ? 0.7 : 1 }}>
            <span style={{ fontSize: 26 }}>❄️</span>ENFRIAR
          </button>
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

      {/* ── Overlay de feedback ── */}
      {feedback && (
        <PortalToBody>
          <div style={{
            position: "fixed", inset: 0, zIndex: 1000, pointerEvents: "none",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", animation: "ed-pop-in 0.3s",
          }}>
            <div style={{
              fontFamily: "'Fredoka','Baloo 2',system-ui,sans-serif", fontWeight: 700,
              fontSize: "clamp(56px, 11vmin, 120px)", color: "#2ecc8f",
              textShadow: "0 4px 0 rgba(0,0,0,0.45), 0 0 60px currentColor",
            }}>
              ¡EXCELENTE!
            </div>
            {feedbackMsg && (
              <div style={{
                fontFamily: "'Fredoka','Baloo 2',system-ui,sans-serif", fontWeight: 700,
                fontSize: "clamp(18px, 2.6vmin, 30px)", color: "#fce9a8",
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
              <p className="ed-body" style={{ marginBottom: 16, fontSize: 14 }}>Vuelves a la ronda 1.</p>
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
// RESULTS — reporte académico (mismo formato que los otros juegos).
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
              <th style={printStyles.th}>Ronda</th>
              <th style={{ ...printStyles.th, ...printStyles.thR }}>Meta</th>
              <th style={{ ...printStyles.th, ...printStyles.thC }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {log.map((e) => (
              <tr key={e.idx} style={printStyles.tr}>
                <td style={{ ...printStyles.td, ...printStyles.tdNum }}>{e.idx}</td>
                <td style={{ ...printStyles.td, fontWeight: 700 }}>{e.emoji} {e.a}</td>
                <td style={{ ...printStyles.td, textAlign: "right" }}>{e.correctAnswer}</td>
                <td style={{ ...printStyles.td, ...printStyles.tdOk }}>{e.perfect ? "A la primera" : "Lograda"}</td>
              </tr>
            ))}
            {log.length === 0 && (<tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "#888", fontStyle: "italic" }}>Sin rondas.</td></tr>)}
          </tbody>
        </table>
        <div style={printStyles.summary}>
          <div style={printStyles.cell}><div style={printStyles.cellL}>Rondas</div><div style={printStyles.cellV}>{attemptedCount} / {res.total}</div></div>
          <div style={printStyles.cell}><div style={printStyles.cellL}>Logradas</div><div style={printStyles.cellV}>{res.solved}</div></div>
          <div style={printStyles.cell}><div style={printStyles.cellL}>Estrellas</div><div style={printStyles.cellV}>{res.starsEarned}</div></div>
          <div style={{ ...printStyles.cell, ...printStyles.cellEmp }}><div style={printStyles.cellL}>Logro</div><div style={printStyles.cellV}>{accuracy}%</div></div>
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
            ¡Lo lograste!
          </div>
          <char.Component size={176} />
          <div className="ed-body" style={{ fontStyle: "italic", textAlign: "center", maxWidth: 240, fontSize: 13 }}>
            "{app.studentName || "Campeón"}, cambiaste el agua {res.solved} de {totalEx} veces."
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
                  <th style={{ textAlign: "left", padding: "6px 8px" }}>Ronda</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Meta</th>
                  <th style={{ textAlign: "center", padding: "6px 8px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {(res.log || []).map((e) => (
                  <tr key={e.idx} style={{ borderBottom: "1px solid rgba(148,120,255,0.18)" }}>
                    <td style={{ padding: "7px 8px", color: "var(--ed-ink-soft)" }}>{e.idx}</td>
                    <td style={{ padding: "7px 8px", fontWeight: 600 }}>{e.emoji} {e.a}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right" }}>{e.correctAnswer}</td>
                    <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--ed-font-display)", fontWeight: 700, color: "#2ecc8f" }}>{e.perfect ? "✓✓" : "✓"}</td>
                  </tr>
                ))}
                {(res.log || []).length === 0 && (<tr><td colSpan={4} style={{ padding: "16px 8px", textAlign: "center", color: "var(--ed-ink-soft)", fontStyle: "italic" }}>Sin rondas.</td></tr>)}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "2px solid rgba(242,194,96,0.45)", paddingTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, fontFamily: "var(--ed-font-ui)", fontSize: 11 }}>
            <SummaryCell label="Rondas" value={`${attemptedCount} / ${totalEx}`} />
            <SummaryCell label="Logradas" value={`${res.solved}`} tone="#2ecc8f" />
            <SummaryCell label="Estrellas" value={`${res.starsEarned}`} tone="#fce9a8" />
            <SummaryCell label="Logro" value={`${accuracy}%`} tone="#fce9a8" emphasis />
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
