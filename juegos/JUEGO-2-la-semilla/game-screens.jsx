// game-screens.jsx — JUEGO-2 · "La semilla" (Ciencias Naturales, 6 años).
// Mecánica "Mira y toca" sobre el FORMATO EDINUN (ref: edinun-language):
// HUD (logo + RONDA con dots + tiempo + estrellas), personaje guía con bocadillo
// de pista, PLANTA QUE CRECE en el centro, opciones tipo ficha candy, overlay de
// feedback "¡EXCELENTE!/¡UPS!" y ResultsScreen tipo reporte académico.
//
// Giro temático: la pieza central es una planta que CRECE con cada ronda
// (semilla → brote → tallito → plantita), usando
// assets/{semilla,brote,tallito,plantita}.png. Si las imágenes faltan, cae a un
// emoji por etapa (queda jugable igual).
//
// El niño TOCA la opción correcta directamente (no hay VERIFICAR/BORRAR).
// Cada partida son 4 RONDAS elegidas al azar de un banco de 12, evitando las
// vistas recientemente (localStorage) → recargar o cambiar de niño NO repite.
//
// CONTRATO: GameScreen/ResultsScreen({app,setApp,go}) expuestos en window;
// markFirstAttempt() en la 1ª respuesta; incrementGamesCompleted() al fin.
// Invariantes EDINUN: fallar NO baja progreso; al fallar se revela la correcta
// (verde) dejando ver lo que tocó el niño (rojo); salir/reiniciar con modal.

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

function PortalToBody({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

const CAT_LABEL = "La semilla";
const ROUNDS = 4;

// ─────────────────────────────────────────────────────────────
// Banco de preguntas — La semilla (TEMA 2). 12 ítems, lenguaje de 6 años.
// Cubre: qué necesita para crecer (agua/sol/tierra), dónde se guardan las
// semillas (el fruto), frutos con semillas, dispersión (viento/agua/animal) y
// partes de la planta (raíz/hoja/flor).
// { ctx: emoji de contexto (para el reporte), enunciado, pista (bocadillo, sin
//   emoji), opciones:[{e,t}], correcta: idx }. Posición de la correcta variada.
// ─────────────────────────────────────────────────────────────
const PREGUNTAS = [
  { ctx: "💧", enunciado: "¿Qué necesita la semilla para crecer?", pista: "La bebemos y cae cuando llueve",
    opciones: [{ e: "💧", t: "Agua" }, { e: "🧸", t: "Juguete" }, { e: "📺", t: "Tele" }], correcta: 0 },
  { ctx: "☀️", enunciado: "¿Qué más ayuda a la planta a crecer?", pista: "Sale de día y da calorcito",
    opciones: [{ e: "🍬", t: "Dulce" }, { e: "☀️", t: "Sol" }, { e: "⚽", t: "Pelota" }], correcta: 1 },
  { ctx: "🪴", enunciado: "¿Dónde sembramos la semilla?", pista: "Es de color café y está en el jardín",
    opciones: [{ e: "🌊", t: "En el agua" }, { e: "🪨", t: "En una piedra" }, { e: "🟤", t: "En la tierra" }], correcta: 2 },
  { ctx: "🍎", enunciado: "¿Dónde se guardan las semillas?", pista: "Es la parte rica que nos comemos",
    opciones: [{ e: "🍎", t: "El fruto" }, { e: "🍃", t: "La hoja" }, { e: "🌸", t: "La flor" }], correcta: 0 },
  { ctx: "🌻", enunciado: "¿Qué planta mira al sol y tiene muchas semillas?", pista: "Es grande y amarilla",
    opciones: [{ e: "🌵", t: "Cactus" }, { e: "🌻", t: "Girasol" }, { e: "🌹", t: "Rosa" }], correcta: 1 },
  { ctx: "🍉", enunciado: "¿Qué fruta tiene muchas semillas negras?", pista: "Verde por fuera y roja por dentro",
    opciones: [{ e: "🍌", t: "Banana" }, { e: "🍇", t: "Uvas" }, { e: "🍉", t: "Sandía" }], correcta: 2 },
  { ctx: "💨", enunciado: "Una semilla muy ligerita viaja con…", pista: "Sopla y mueve las hojas de los árboles",
    opciones: [{ e: "💨", t: "El viento" }, { e: "🧱", t: "Una pared" }, { e: "🛏️", t: "Una cama" }], correcta: 0 },
  { ctx: "🥥", enunciado: "El coco viaja muy lejos flotando en el…", pista: "Hay muchísima en el mar",
    opciones: [{ e: "🔥", t: "Fuego" }, { e: "🌊", t: "El agua" }, { e: "🪨", t: "Una roca" }], correcta: 1 },
  { ctx: "🐿️", enunciado: "Algunas semillas viajan pegadas a…", pista: "Tiene pelito y corre por el bosque",
    opciones: [{ e: "🚗", t: "Un carro" }, { e: "📱", t: "Un teléfono" }, { e: "🐿️", t: "Un animal" }], correcta: 2 },
  { ctx: "🌱", enunciado: "¿Qué le sale primero a la semilla?", pista: "Crece hacia abajo y bebe el agua",
    opciones: [{ e: "🌱", t: "La raíz" }, { e: "🌸", t: "La flor" }, { e: "🍎", t: "El fruto" }], correcta: 0 },
  { ctx: "🍃", enunciado: "¿Qué parte verde atrapa la luz del sol?", pista: "Es plana y crece en el tallo",
    opciones: [{ e: "🌸", t: "La flor" }, { e: "🍃", t: "La hoja" }, { e: "🍎", t: "El fruto" }], correcta: 1 },
  { ctx: "🌸", enunciado: "¿Qué parte es bonita y huele rico?", pista: "Atrae a las abejas con sus colores",
    opciones: [{ e: "🍃", t: "La hoja" }, { e: "🍎", t: "El fruto" }, { e: "🌸", t: "La flor" }], correcta: 2 },
];

// Memoria de preguntas recientes (localStorage) para no repetir entre cargas/
// niños en el mismo navegador. Recuerda los últimos 8 índices vistos.
const RECENT_KEY = "edinun_ccn_semilla_recientes_v1";

function getRecent() {
  try {
    const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(r) ? r : [];
  } catch (e) { return []; }
}

function pushRecent(ids) {
  const prev = getRecent().filter((id) => ids.indexOf(id) === -1);
  const next = ids.concat(prev).slice(0, 8);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch (e) {}
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Elige n índices del banco: primero los NO vistos recientemente (barajados),
// completando con los vistos si hiciera falta. Garantiza variación al recargar.
function pickRounds(n) {
  const recent = new Set(getRecent());
  const all = PREGUNTAS.map((_, i) => i);
  const fresh = shuffle(all.filter((i) => !recent.has(i)));
  const stale = shuffle(all.filter((i) => recent.has(i)));
  return fresh.concat(stale).slice(0, n);
}

const ANIMOS = [
  "¡Casi! Sigue intentándolo.",
  "¡La próxima es tuya!",
  "Equivocarse también es aprender.",
  "¡Vamos a la siguiente!",
];

// Colores de borde para las fichas de opción.
const OPTION_COLORS = ["#ef5a5a", "#4fa0ff", "#2ecc8f"];

// ─────────────────────────────────────────────────────────────
// Planta que crece — pieza central. La etapa (1..4) sube con cada ronda.
// Usa assets/{semilla,brote,tallito,plantita}.png (ver STAGE_FILES); si falta la
// imagen, cae a un emoji por etapa.
// ─────────────────────────────────────────────────────────────
const STAGE_NAMES = ["Semilla", "Brote", "Tallito", "¡Plantita!"];
const STAGE_FALLBACK = ["🫘", "🌱", "🌿", "🪴"];
const STAGE_FILES = ["semilla", "brote", "tallito", "plantita"];

function GrowingPlant({ stage }) {
  const s = Math.max(1, Math.min(stage || 1, 4));
  const [imgError, setImgError] = useStateG(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{
        position: "relative",
        width: 152, height: 140, borderRadius: 22,
        background: "linear-gradient(180deg, #cfeafe 0%, #eaf7df 58%, #d6edc2 100%)",
        border: "3px solid #f2c260",
        boxShadow: "0 12px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(242,194,96,0.35), inset 0 -4px 0 rgba(0,0,0,0.08)",
        display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden",
      }}>
        {imgError ? (
          <span style={{ fontSize: 82, lineHeight: 1, paddingBottom: 14 }}>{STAGE_FALLBACK[s - 1]}</span>
        ) : (
          <img
            src={`assets/${STAGE_FILES[s - 1]}.png`}
            alt=""
            onError={() => setImgError(true)}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>
      <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 13, color: "#fce9a8", letterSpacing: "0.05em", textShadow: "0 2px 5px rgba(0,0,0,0.55)" }}>
        {STAGE_NAMES[s - 1]}
      </div>
    </div>
  );
}

function GameScreen({ app, setApp, go }) {
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];

  const [rounds, setRounds] = useStateG(() => pickRounds(ROUNDS));
  const [idx, setIdx] = useStateG(0);
  const [picked, setPicked] = useStateG(null);
  const [feedback, setFeedback] = useStateG(null);
  const [feedbackMsg, setFeedbackMsg] = useStateG("");
  const [aciertos, setAciertos] = useStateG(0);
  const [stars, setStars] = useStateG(0);
  const [elapsed, setElapsed] = useStateG(0);
  const [log, setLog] = useStateG([]);
  const [confirmingExit, setConfirmingExit] = useStateG(false);
  const [confirmingRestart, setConfirmingRestart] = useStateG(false);

  const started = useRefG(Date.now());
  const exerciseStart = useRefG(Date.now());
  const advancing = useRefG(false);

  // Registrar las preguntas de esta partida como recientes (una sola vez).
  useEffectG(() => { pushRecent(rounds); }, []);

  useEffectG(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - started.current) / 1000));
    }, 500);
    return () => clearInterval(id);
  }, []);

  const q = PREGUNTAS[rounds[idx]];
  const answered = picked !== null;
  const correcta = q.opciones[q.correcta];

  function formatTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  function confirmRestart() {
    setConfirmingRestart(false);
    advancing.current = false;
    const nuevas = pickRounds(ROUNDS);
    pushRecent(nuevas);
    setRounds(nuevas);
    setIdx(0); setPicked(null); setFeedback(null); setFeedbackMsg("");
    setAciertos(0); setStars(0); setLog([]);
    started.current = Date.now();
    exerciseStart.current = Date.now();
  }

  function answerTap(i) {
    if (answered || advancing.current) return;
    if (typeof markFirstAttempt === "function") markFirstAttempt();
    setPicked(i);
    const isCorrect = i === q.correcta;
    const exSec = Math.max(0, Math.floor((Date.now() - exerciseStart.current) / 1000));
    const entry = {
      idx: idx + 1,
      emoji: q.ctx,
      a: q.enunciado,
      userAnswer: `${q.opciones[i].e} ${q.opciones[i].t}`,
      correctAnswer: `${correcta.e} ${correcta.t}`,
      isCorrect,
      time: exSec,
    };

    // Calcular valores nuevos aquí (el setTimeout captura este closure).
    const newLog = [...log, entry];
    const newAciertos = aciertos + (isCorrect ? 1 : 0);
    const newStars = stars + (isCorrect ? 1 : 0);
    const isLast = idx + 1 >= ROUNDS;

    setLog(newLog);
    setAciertos(newAciertos);
    setStars(newStars);
    advancing.current = true;

    if (isCorrect) {
      setApp((s) => ({ ...s, stars: (s.stars || 0) + 1 }));
      setFeedback("ok");
      setFeedbackMsg("+1 ⭐");
      setTimeout(() => advance(newLog, newAciertos, newStars, isLast), 1050);
    } else {
      setTimeout(() => {
        setFeedback("err");
        setFeedbackMsg(ANIMOS[idx % ANIMOS.length]);
      }, 720);
      setTimeout(() => advance(newLog, newAciertos, newStars, isLast), 2000);
    }
  }

  function advance(newLog, newAciertos, newStars, isLast) {
    setFeedback(null);
    setFeedbackMsg("");
    if (!isLast) {
      setIdx((i) => i + 1);
      setPicked(null);
      exerciseStart.current = Date.now();
      advancing.current = false;
    } else {
      setApp((s) => ({
        ...s,
        stars: newStars,
        lastResult: {
          category: CAT_LABEL,
          solved: newAciertos,
          total: ROUNDS,
          time: Math.floor((Date.now() - started.current) / 1000),
          starsEarned: newStars,
          log: newLog,
        },
      }));
      if (typeof incrementGamesCompleted === "function") incrementGamesCompleted();
      go("results");
    }
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* ── HUD: logo izq, tiempo + estrellas der ── */}
      <div style={{ position: "absolute", top: 10, left: 16, right: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <EdinunLogoMini size={60} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.35)", borderRadius: 999, padding: "6px 12px", border: "1px solid rgba(242,194,96,0.4)", fontFamily: "var(--ed-font-mono)", fontSize: 13, color: "#fce9a8" }}>
            ⏱ {formatTime(elapsed)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.35)", borderRadius: 999, padding: "6px 12px", border: "1px solid rgba(242,194,96,0.4)", fontFamily: "var(--ed-font-display)", fontWeight: 600, color: "#fce9a8" }}>
            ⭐ {stars}
          </div>
        </div>
      </div>

      {/* ── RONDA con dots (sin chip de tema: juego de 1 solo nivel) ── */}
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="ed-label" style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Ronda</span>
        {Array.from({ length: ROUNDS }).map((_, i) => {
          const done = i < log.length;
          const ok = done && log[i] && log[i].isCorrect;
          return (
            <div key={i} style={{
              width: 11, height: 11, borderRadius: "50%",
              background: done ? (ok ? "#fce9a8" : "#ff6b6b") : (i === idx ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"),
              boxShadow: done ? "0 0 8px currentColor" : "none",
              color: ok ? "#fce9a8" : "#ff6b6b",
            }} />
          );
        })}
      </div>

      {/* ── Personaje guía + bocadillo de pista (izquierda) ── */}
      <div style={{ position: "absolute", left: 8, bottom: 78, width: 220, pointerEvents: "none", textAlign: "center" }}>
        <div className="ed-float-soft" style={{ position: "absolute", left: 0, right: 0, bottom: "100%", display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <div style={{
            position: "relative", display: "inline-block", maxWidth: 210,
            background: "linear-gradient(180deg, rgba(20,12,55,0.95), rgba(10,6,35,0.95))",
            border: "1.5px solid rgba(242,194,96,0.65)", borderRadius: 16, padding: "10px 14px",
            fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 14, lineHeight: 1.3,
            color: "#fce9a8", textAlign: "center",
            boxShadow: "0 10px 24px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}>
            {answered ? (picked === q.correcta ? "¡Muy bien!" : "¡Casi! Mira la respuesta.") : (q.pista || "Toca al correcto")}
            <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "10px solid rgba(20,12,55,0.95)", filter: "drop-shadow(0 1px 0 rgba(242,194,96,0.55))" }} />
          </div>
        </div>
        <div style={{ position: "relative", display: "flex", justifyContent: "center" }}>
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", width: 140, height: 16, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(242,194,96,0.45), transparent 70%)", filter: "blur(5px)" }} />
          <char.Component size={186} floating />
        </div>
        <div style={{ marginTop: -2, fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 14, color: "#fce9a8", letterSpacing: "0.04em", textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>{char.name}</div>
      </div>

      {/* ── Zona central: enunciado + planta que crece + opciones, repartidos parejo ── */}
      <div style={{ position: "absolute", top: 60, bottom: 18, left: 240, right: 192, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly" }}>
        {/* Enunciado */}
        <div style={{ textAlign: "center", fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 23, lineHeight: 1.15, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", pointerEvents: "none", maxWidth: 470 }}>
          {q.enunciado}
        </div>

        {/* Planta que crece (etapa = ronda actual) */}
        <GrowingPlant stage={idx + 1} />

        {/* Opciones — fichas grandes tocables */}
        <div style={{ display: "flex", gap: 18, justifyContent: "center", flexWrap: "nowrap" }}>
          {q.opciones.map((op, i) => {
            const correctOne = i === q.correcta;
            const baseColor = OPTION_COLORS[i % OPTION_COLORS.length];
            let borderColor = baseColor;
            let bg = "linear-gradient(180deg, #fff8e6 0%, #f7e3a8 100%)";
            let nameColor = "#3a2608";
            if (answered) {
              if (correctOne) {
                borderColor = "#2ecc8f";
                bg = "linear-gradient(180deg, rgba(72,224,154,0.95), rgba(26,143,95,0.92))";
                nameColor = "#06381f";
              } else if (i === picked) {
                borderColor = "#ff6b6b";
                bg = "linear-gradient(180deg, rgba(255,139,139,0.92), rgba(178,47,47,0.9))";
                nameColor = "#fff";
              } else {
                bg = "linear-gradient(180deg, rgba(255,248,230,0.5), rgba(247,227,168,0.5))";
              }
            }
            return (
              <button
                key={i}
                onClick={() => answerTap(i)}
                disabled={answered}
                style={{
                  width: 128, height: 128, borderRadius: 18,
                  border: `3px solid ${borderColor}`,
                  background: bg,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
                  cursor: answered ? "default" : "pointer",
                  boxShadow: answered && correctOne
                    ? "0 0 22px rgba(46,204,143,0.6), inset 0 1px 0 rgba(255,255,255,0.4)"
                    : "inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -3px 0 rgba(0,0,0,0.12), 0 6px 14px rgba(0,0,0,0.3)",
                  transform: answered && correctOne ? "translateY(-4px)" : "none",
                  transition: "all 0.15s ease",
                }}
                title="Toca para responder"
              >
                <span style={{ fontSize: 60, lineHeight: 1, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))" }}>{op.e}</span>
                <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 15, color: nameColor }}>{op.t}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Acciones (derecha): REINICIAR · SALIR ── */}
      <div style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 12, width: 150 }}>
        <button className="ed-btn ed-btn-restart" onClick={() => setConfirmingRestart(true)} title="Empezar de nuevo" style={{ fontSize: 15, padding: "0 10px", height: 56, fontWeight: 800, letterSpacing: "0.04em" }}>
          REINICIAR
        </button>
        <button className="ed-btn ed-btn-ghost" onClick={() => setConfirmingExit(true)} title="Salir al inicio" style={{ fontSize: 15, padding: "0 10px", height: 56, fontWeight: 800, letterSpacing: "0.04em" }}>
          SALIR
        </button>
      </div>

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
              {feedback === "ok" ? "¡EXCELENTE!" : "¡UPS!"}
            </div>
            {feedbackMsg && (
              <div style={{
                fontFamily: "'Fredoka','Baloo 2',system-ui,sans-serif", fontWeight: 700,
                fontSize: "clamp(18px, 2.6vmin, 30px)",
                color: feedback === "ok" ? "#fce9a8" : "#fff",
                background: "rgba(0,0,0,0.55)", padding: "8px 26px", borderRadius: 999,
                textShadow: "0 2px 6px rgba(0,0,0,0.6)", textAlign: "center",
              }}>
                {feedback === "err" ? `${feedbackMsg} — ${char.name}` : feedbackMsg}
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
              <p className="ed-body" style={{ marginBottom: 16, fontSize: 14 }}>Vas a jugar con preguntas nuevas.</p>
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
              <th style={printStyles.th}>Pregunta</th>
              <th style={{ ...printStyles.th, ...printStyles.thR }}>Respuesta del estudiante</th>
              <th style={{ ...printStyles.th, ...printStyles.thR }}>Respuesta correcta</th>
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
          <div style={printStyles.cell}><div style={printStyles.cellL}>Preguntas</div><div style={printStyles.cellV}>{attemptedCount} / {res.total}</div></div>
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
  const res = app.lastResult || { category: CAT_LABEL, solved: 0, total: ROUNDS, time: 0, starsEarned: 0, log: [] };
  const mm = Math.floor(res.time / 60), ss = res.time % 60;
  const totalEx = res.total || ROUNDS;
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
          <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 34, background: "linear-gradient(180deg, #fce9a8, #d9a441)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: 4 }}>
            ¡Tu planta creció!
          </div>
          <char.Component size={176} />
          <div className="ed-body" style={{ fontStyle: "italic", textAlign: "center", maxWidth: 240, fontSize: 13 }}>
            "{app.studentName || "Campeón"}, acertaste {res.solved} de {totalEx}."
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
                  <th style={{ textAlign: "left", padding: "6px 8px" }}>Pregunta</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Tocó</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Correcta</th>
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
                {(res.log || []).length === 0 && (<tr><td colSpan={5} style={{ padding: "16px 8px", textAlign: "center", color: "var(--ed-ink-soft)", fontStyle: "italic" }}>Sin preguntas.</td></tr>)}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "2px solid rgba(242,194,96,0.45)", paddingTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, fontFamily: "var(--ed-font-ui)", fontSize: 11 }}>
            <SummaryCell label="Preguntas" value={`${attemptedCount} / ${totalEx}`} />
            <SummaryCell label="Correctas" value={`${res.solved}`} tone="#2ecc8f" />
            <SummaryCell label="Estrellas" value={`${res.starsEarned}`} tone="#fce9a8" />
            <SummaryCell label="Precisión" value={`${accuracy}%`} tone="#fce9a8" emphasis />
          </div>

          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button className="ed-btn ed-btn-ghost" onClick={() => window.print()} style={{ padding: "0 10px", fontSize: 13, height: 44, fontWeight: 800, letterSpacing: "0.04em" }}>IMPRIMIR REPORTE</button>
            <button className="ed-btn ed-btn-primary" onClick={() => go("game")} style={{ padding: "0 10px", fontSize: 13, height: 44, fontWeight: 800, letterSpacing: "0.04em" }}>JUGAR OTRA RONDA</button>
          </div>
        </div>
      </div>

      <PrintableReport studentName={app.studentName} res={res} dateStr={dateStr} mm={mm} ss={ss} attemptedCount={attemptedCount} accuracy={accuracy} />
    </div>
  );
}

Object.assign(window, { GameScreen, ResultsScreen });
