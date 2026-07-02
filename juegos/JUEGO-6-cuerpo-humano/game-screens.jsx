// game-screens.jsx — JUEGO-6 · "Misión: Cuerpo Humano" (Ciencias Naturales, 9 años).
// TEMA 1 "Aparatos y sistemas del cuerpo humano". Mini-misión en 3 RONDAS
// (descubrir → descubrir → relacionar):
//   Ronda 1 "Rayos X"            — pasa la lente de rayos X, revela el sistema y toca su nombre.
//   Ronda 2 "Rayos X"            — igual que la 1, con OTRO sistema (misma mecánica, se juega 2 veces).
//   Ronda 3 "Une con su función" — conecta con líneas cada sistema con su función (imágenes grandes).
//
// POOLS: R1/R2 (rayos X) SOLO usan los 4 con ilustración real (xray:true): digestivo,
// respiratorio, circulatorio, excretor. R3 (unir) usa los aparatos/sistemas del libro
// (todos menos Reproductor) para dar variedad; si falta sis-<id>.png cae al emoji.
//
// CONTRATO: GameScreen/ResultsScreen({app,setApp,go}) en window; markFirstAttempt()
// en la 1ª acción; incrementGamesCompleted() al terminar. Invariantes EDINUN: fallar
// NO baja progreso; al fallar se revela lo correcto; salir/reiniciar con modal.

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

function PortalToBody({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

const CAT_LABEL = "Cuerpo humano";

// Sistemas del cuerpo (orden del libro). id = archivo assets/sis-<id>.png · emoji = respaldo.
// fn = función tomada TAL CUAL del libro (declarativa, acaba en punto §8).
// xray:true → los 4 que tienen ilustración real y aparecen en las Rondas 1 y 2 (rayos X).
const SYSTEMS = [
  { id: "digestivo",    name: "Digestivo",    emoji: "🍎", xray: true, fn: "Desdobla los alimentos." },
  { id: "respiratorio", name: "Respiratorio", emoji: "🫁", xray: true, fn: "Obtiene la energía de los alimentos gracias a la respiración." },
  { id: "circulatorio", name: "Circulatorio", emoji: "❤️", xray: true, fn: "Transporta gases y nutrientes." },
  { id: "excretor",     name: "Excretor",     emoji: "🫘", xray: true, fn: "Elimina los desechos." },
  { id: "muscular",     name: "Muscular",     emoji: "💪", fn: "Permite el movimiento." },
  { id: "oseo",         name: "Óseo",         emoji: "🦴", fn: "Sostiene a los músculos, protege órganos internos." },
  { id: "inmunologico", name: "Inmunológico", emoji: "🛡️", fn: "Defiende al cuerpo de agentes infecciosos." },
  { id: "nervioso",     name: "Nervioso",     emoji: "🧠", fn: "Recibe los estímulos y emite respuestas." },
  { id: "endocrino",    name: "Endócrino",    emoji: "⚗️", fn: "Produce hormonas y regula funciones del cuerpo." },
  { id: "reproductor",  name: "Reproductor",  emoji: "👶", skipMatch: true, fn: "Produce gameto." },
];
const NS = SYSTEMS.length;

function range(n) { return Array.from({ length: n }, (_, i) => i); }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Pools por ronda: R1/R2 (rayos X) solo los 4 con ilustración real; R3 (unir) todos
// MENOS los marcados skipMatch (el Reproductor no aparece en la Ronda 3).
const XRAY = range(NS).filter((i) => SYSTEMS[i].xray);
const MATCHPOOL = range(NS).filter((i) => !SYSTEMS[i].skipMatch);

// Anti-repetición POR RONDA (§12).
const RK_R1 = "edinun_ccn_cuerpo_r1_v1"; // sistemas de las Rondas 1 y 2 (rayos X, 2 sistemas)
const RK_R2 = "edinun_ccn_cuerpo_r2_v1"; // sistemas de la Ronda 3 (une con función)
function getRecent(key) {
  try { const r = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(r) ? r : []; }
  catch (e) { return []; }
}
function pushRecent(key, ids, cap) {
  const prev = getRecent(key).filter((id) => ids.indexOf(id) === -1);
  const next = ids.concat(prev).slice(0, cap || 6);
  try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {}
}

// Rondas 1 y 2: elige n sistemas del pool de rayos X; cada uno con 3 opciones (correcto + 2),
// todas dentro de los mismos 4 sistemas (los que tienen ilustración).
function pickIdentify(n) {
  const recent = new Set(getRecent(RK_R1));
  const fresh = shuffle(XRAY.filter((s) => !recent.has(s)));
  const stale = shuffle(XRAY.filter((s) => recent.has(s)));
  const picks = fresh.concat(stale).slice(0, n);
  return picks.map((s) => {
    const distract = shuffle(XRAY.filter((i) => i !== s)).slice(0, 2);
    return { sys: s, options: shuffle([s].concat(distract)) };
  });
}
// Ronda 3: 4 aparatos/sistemas del pool (izquierda en orden) + sus funciones barajadas (derecha).
function pickMatch() {
  const recent = new Set(getRecent(RK_R2));
  const fresh = shuffle(MATCHPOOL.filter((s) => !recent.has(s)));
  const stale = shuffle(MATCHPOOL.filter((s) => recent.has(s)));
  const left = fresh.concat(stale).slice(0, 4);
  let right = shuffle(left.slice());
  let g = 0;
  while (right.every((v, i) => v === left[i]) && g++ < 25) right = shuffle(left.slice());
  return { left, right };
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de sistema — ilustración con respaldo a emoji.
// ─────────────────────────────────────────────────────────────
function SystemCard({ sys, size }) {
  const [err, setErr] = useStateG(false);
  const s = SYSTEMS[sys];
  return (
    <div style={{
      position: "relative", width: size, height: size, borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(180deg, #fdeee0 0%, #ffeef2 55%, #e9f3ff 100%)", userSelect: "none",
    }}>
      {err ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: Math.round(size * 0.5) }}>{s.emoji}</span>
        </div>
      ) : (
        <img src={`assets/sis-${s.id}.png`} alt="" draggable={false} onError={() => setErr(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", padding: 6, pointerEvents: "none" }} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de RAYOS X (Ronda 1) — "tapa" en canvas que se borra al pasar la lente.
// ─────────────────────────────────────────────────────────────
function XrayCard({ sys, size, forceReveal }) {
  const canvasRef = useRefG(null);
  const doneRef = useRefG(false);
  const [lens, setLens] = useStateG(null);

  function paintCover(ctx) {
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, size, size);
    const g = ctx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, "#0c2b3d"); g.addColorStop(1, "#091a2e");
    ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "rgba(120,200,255,0.10)"; ctx.lineWidth = 1;
    for (let y = 8; y < size; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke(); }
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(175,225,255,0.8)";
    ctx.font = "700 17px 'Fredoka','Baloo 2',sans-serif";
    ctx.fillText("Pasa los rayos X", size / 2, size / 2 - 12);
    ctx.font = "28px sans-serif";
    ctx.fillText("🔦", size / 2, size / 2 + 22);
  }
  useEffectG(() => {
    const cv = canvasRef.current; if (!cv) return;
    doneRef.current = false; setLens(null);
    paintCover(cv.getContext("2d"));
  }, [sys, size]);
  useEffectG(() => {
    if (!forceReveal) return;
    const cv = canvasRef.current; if (!cv) return;
    cv.getContext("2d").clearRect(0, 0, size, size);
    doneRef.current = true; setLens(null);
  }, [forceReveal, size]);

  function scan(clientX, clientY) {
    if (doneRef.current) return;
    const cv = canvasRef.current; if (!cv) return;
    const r = cv.getBoundingClientRect();
    const x = (clientX - r.left) / r.width * size, y = (clientY - r.top) / r.height * size;
    if (x < 0 || y < 0 || x > size || y > size) { setLens(null); return; }
    const ctx = cv.getContext("2d");
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath(); ctx.arc(x, y, size * 0.15, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    setLens({ x: x / size * 100, y: y / size * 100 });
  }
  return (
    <div data-xray={SYSTEMS[sys].id}
      onPointerDown={(e) => scan(e.clientX, e.clientY)} onPointerMove={(e) => scan(e.clientX, e.clientY)}
      style={{ position: "relative", width: size, height: size, borderRadius: 20, overflow: "hidden",
        border: "3px solid #f2c260", boxShadow: "0 12px 28px rgba(0,0,0,0.45)", touchAction: "none", cursor: "crosshair" }}>
      <div style={{ position: "absolute", inset: 0 }}><SystemCard sys={sys} size={size} /></div>
      <canvas ref={canvasRef} width={size} height={size} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
      {lens && !forceReveal && (
        <div style={{ position: "absolute", left: lens.x + "%", top: lens.y + "%", width: size * 0.32, height: size * 0.32,
          transform: "translate(-50%,-50%)", borderRadius: "50%", border: "3px solid rgba(180,230,255,0.95)",
          boxShadow: "0 0 20px rgba(120,200,255,0.85), inset 0 0 16px rgba(120,200,255,0.35)", pointerEvents: "none" }} />
      )}
    </div>
  );
}

// Geometría de la Ronda 3 (une con líneas) — nodos ALTOS para que la imagen del
// sistema se vea grande (la ilustración es el protagonista).
const MW = 524, MH = 432, MNW = 202, MNH = 96, MIMG = 80;
// Colores de las uniones (uno por fila; se evitan verde/rojo, reservados para el revelado).
const MLINE_COLORS = ["#3fc7f2", "#ffbe3d", "#c77dff", "#ff7eb6", "#5b8dff", "#ff9f45"];
function mLineColor(i) { return MLINE_COLORS[i % MLINE_COLORS.length]; }
function mRowTop(i) { const gap = (MH - 4 * MNH) / 5; return gap + i * (MNH + gap); }
function mLeftEdge() { return 8 + MNW; }
function mRightEdge() { return MW - 8 - MNW; }
function mRowCenterY(i) { return mRowTop(i) + MNH / 2; }

function GameScreen({ app, setApp, go }) {
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];

  const [phase, setPhase] = useStateG("r1"); // "r1" | "r2" | "r3"

  // ── Rondas 1 y 2 (rayos X, 2 sistemas: uno por ronda) ──
  const [r1Items, setR1Items] = useStateG(() => pickIdentify(2));
  const [r1Answered, setR1Answered] = useStateG(false);
  const [r1Picked, setR1Picked] = useStateG(null);
  const xrayIdx = phase === "r1" ? 0 : 1; // qué sistema de rayos X toca

  // ── Ronda 3 (une con líneas) ──
  const [match, setMatch] = useStateG(() => pickMatch());
  const [matchLink, setMatchLink] = useStateG(() => ({}));
  const matchLinkRef = useRefG(matchLink); matchLinkRef.current = matchLink;
  const [matchSel, setMatchSel] = useStateG(null);
  const [matchReveal, setMatchReveal] = useStateG(false);
  const [matchLocked, setMatchLocked] = useStateG(false);

  // ── Comunes ──
  const [stars, setStars] = useStateG(0);
  const [elapsed, setElapsed] = useStateG(0);
  const [feedback, setFeedback] = useStateG(null);
  const [feedbackMsg, setFeedbackMsg] = useStateG("");
  const [log, setLog] = useStateG([]);
  const [confirmingExit, setConfirmingExit] = useStateG(false);
  const [confirmingRestart, setConfirmingRestart] = useStateG(false);

  const started = useRefG(Date.now());
  const firstAct = useRefG(false);
  const logRef = useRefG(log); logRef.current = log;
  const starsRef = useRefG(stars); starsRef.current = stars;

  useEffectG(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(id);
  }, []);
  useEffectG(() => {
    pushRecent(RK_R1, r1Items.map((it) => it.sys), 2);
    pushRecent(RK_R2, match.left, 6);
  }, []);

  const roundIndex = phase === "r1" ? 0 : phase === "r2" ? 1 : 2;

  function formatTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  function markFirst() {
    if (!firstAct.current) { firstAct.current = true; if (typeof markFirstAttempt === "function") markFirstAttempt(); }
  }
  function addLog(entry) { const next = logRef.current.concat([entry]); logRef.current = next; setLog(next); }
  function addStar(n) { const v = starsRef.current + n; starsRef.current = v; setStars(v); }

  // ── RONDAS 1 y 2: rayos X → toca el nombre ──
  const r1Cur = r1Items[xrayIdx];
  function onIdentify(sysIdx) {
    if (r1Answered) return;
    markFirst();
    const fromPhase = phase;
    const isCorrect = sysIdx === r1Cur.sys;
    setR1Picked(sysIdx);
    setR1Answered(true);
    if (isCorrect) addStar(1);
    addLog({
      idx: logRef.current.length + 1, emoji: SYSTEMS[r1Cur.sys].emoji, a: "Rayos X",
      correctAnswer: SYSTEMS[r1Cur.sys].name, userAnswer: SYSTEMS[sysIdx].name, isCorrect,
    });
    const overlayDelay = isCorrect ? 500 : 1100;
    setTimeout(() => {
      setFeedback(isCorrect ? "ok" : "err");
      setFeedbackMsg(isCorrect ? "¡Muy bien! ⭐" : `Es: ${SYSTEMS[r1Cur.sys].name}.`);
    }, overlayDelay);
    setTimeout(() => {
      setFeedback(null); setFeedbackMsg("");
      setR1Answered(false); setR1Picked(null);
      setPhase(fromPhase === "r1" ? "r2" : "r3");
    }, overlayDelay + 1400);
  }
  function r1Ring(sysIdx) {
    const base = "0 8px 18px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.12)";
    if (!r1Answered) return base;
    if (sysIdx === r1Cur.sys) return "0 0 0 4px #2ecc8f, " + base;
    if (sysIdx === r1Picked) return "0 0 0 4px #ff6b6b, " + base;
    return base;
  }

  // ── RONDA 3: une cada aparato o sistema con su función ──
  function rightRowOf(funcIdx) { return match.right.indexOf(funcIdx); }
  function onPickLeft(sysIdx) {
    if (matchLocked) return;
    markFirst();
    setMatchSel(sysIdx);
  }
  function onPickRight(funcIdx) {
    if (matchLocked || matchSel == null) return;
    markFirst();
    const next = {};
    Object.keys(matchLinkRef.current).forEach((k) => { if (matchLinkRef.current[k] !== funcIdx) next[k] = matchLinkRef.current[k]; });
    next[matchSel] = funcIdx;
    matchLinkRef.current = next; setMatchLink(next); setMatchSel(null);
    if (Object.keys(next).length === 4) setTimeout(() => evaluateMatch(next), 380);
  }
  function evaluateMatch(linkMap) {
    let correct = 0;
    match.left.forEach((sys) => { if (linkMap[sys] === sys) correct++; });
    const ok = correct === 4;
    setMatchLocked(true);
    setMatchReveal(true);
    addStar(correct);
    match.left.forEach((sys) => {
      addLog({
        idx: logRef.current.length + 1, emoji: SYSTEMS[sys].emoji, a: SYSTEMS[sys].name,
        correctAnswer: SYSTEMS[sys].fn, userAnswer: linkMap[sys] != null ? SYSTEMS[linkMap[sys]].fn : "—",
        isCorrect: linkMap[sys] === sys,
      });
    });
    // Deja ver el revelado (verde/rojo + la unión correcta punteada) un buen rato ANTES
    // del splash, para que el niño pueda leer qué acertó y qué no.
    const overlayDelay = ok ? 1200 : 3600;
    setTimeout(() => {
      setFeedback(ok ? "ok" : "err");
      setFeedbackMsg(ok ? "¡Todo bien unido! ⭐" : "Mira las uniones correctas en verde.");
    }, overlayDelay);
    setTimeout(() => { setFeedback(null); setFeedbackMsg(""); finish(); }, overlayDelay + (ok ? 1500 : 1800));
  }

  function finish() {
    if (typeof incrementGamesCompleted === "function") incrementGamesCompleted();
    const finalLog = logRef.current;
    const solved = finalLog.filter((e) => e.isCorrect).length;
    setApp((s) => ({
      ...s, stars: starsRef.current,
      lastResult: {
        category: CAT_LABEL, solved, total: finalLog.length,
        time: Math.floor((Date.now() - started.current) / 1000),
        starsEarned: starsRef.current, log: finalLog,
      },
    }));
    go("results");
  }

  function confirmRestart() {
    setConfirmingRestart(false);
    setPhase("r1");
    const r1 = pickIdentify(2); setR1Items(r1); setR1Answered(false); setR1Picked(null);
    const m = pickMatch(); setMatch(m); const emptyLink = {}; matchLinkRef.current = emptyLink; setMatchLink(emptyLink);
    setMatchSel(null); setMatchReveal(false); setMatchLocked(false);
    pushRecent(RK_R1, r1.map((it) => it.sys), 2);
    pushRecent(RK_R2, m.left, 6);
    starsRef.current = 0; setStars(0); logRef.current = []; setLog([]); setFeedback(null); setFeedbackMsg("");
    firstAct.current = false; started.current = Date.now();
  }

  // Bocadillo del guía por ronda.
  let bocadillo;
  if (phase === "r1" || phase === "r2") bocadillo = !r1Answered ? "Pasa los rayos X." : (r1Picked === r1Cur.sys ? "¡Muy bien!" : "¡Casi! Mira el nombre.");
  else bocadillo = matchReveal ? (match.left.every((s) => matchLinkRef.current[s] === s) ? "¡Perfecto!" : "Mira las uniones.") : (matchSel != null ? "Ahora toca su función." : "Toca un aparato o sistema.");

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

      {/* ── RONDA con dots (3 rondas) ── */}
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8 }}>
        <span className="ed-label" style={{ color: "rgba(255,255,255,0.7)", fontSize: 11 }}>Ronda</span>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} style={{
            width: 11, height: 11, borderRadius: "50%",
            background: i < roundIndex ? "#fce9a8" : (i === roundIndex ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"),
            boxShadow: i < roundIndex ? "0 0 8px #fce9a8" : "none",
          }} />
        ))}
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

      {/* ── Zona central ── */}
      <div style={{ position: "absolute", top: 30, bottom: 14, left: 183, right: 183, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly" }}>
        {(phase === "r1" || phase === "r2") && (
          <React.Fragment>
            <div style={{ textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 23, lineHeight: 1.15, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", maxWidth: 470 }}>
                ¿Qué aparato o sistema es?
              </div>
              <div style={{ fontFamily: "var(--ed-font-ui)", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
                Pasa los rayos X para descubrirlo y toca su nombre.
              </div>
            </div>
            <div key={"xr" + phase} data-answer={SYSTEMS[r1Cur.sys].name} style={{ animation: "ed-pop-in 0.25s" }}>
              <XrayCard sys={r1Cur.sys} size={260} forceReveal={r1Answered} />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {r1Cur.options.map((opt) => (
                <button key={opt} onClick={() => onIdentify(opt)} disabled={r1Answered} title={SYSTEMS[opt].name}
                  style={{ position: "relative", minWidth: 148, height: 54, padding: "0 14px", borderRadius: 14, border: "3px solid #4f9fd6", cursor: r1Answered ? "default" : "pointer",
                    background: "linear-gradient(180deg,#bfe6ff,#7cc2f0)", color: "#0a3a5a",
                    fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 15,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: r1Ring(opt), transition: "all 0.2s ease", opacity: r1Answered && opt !== r1Cur.sys && opt !== r1Picked ? 0.45 : 1 }}>
                  <span style={{ fontSize: 18 }}>{SYSTEMS[opt].emoji}</span>{SYSTEMS[opt].name}
                  {r1Answered && (opt === r1Cur.sys || opt === r1Picked) && (
                    <span style={{ position: "absolute", top: -11, right: -9, width: 27, height: 27, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: opt === r1Cur.sys ? "#2ecc8f" : "#ff5a5a", color: "#fff", fontWeight: 900, fontSize: 15,
                      border: "2.5px solid #fff", boxShadow: "0 2px 7px rgba(0,0,0,0.4)" }}>
                      {opt === r1Cur.sys ? "✓" : "✗"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </React.Fragment>
        )}

        {phase === "r3" && (
          <React.Fragment>
            <div style={{ textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", lineHeight: 1.1 }}>
                Une cada aparato o sistema con su función.
              </div>
            </div>
            <div style={{ position: "relative", width: MW, height: MH }}>
              <svg viewBox={`0 0 ${MW} ${MH}`} width={MW} height={MH} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {match.left.map((sys, i) => {
                  const fj = matchLink[sys];
                  if (fj == null) return null;
                  const j = rightRowOf(fj);
                  const ok = matchReveal && fj === sys;
                  const bad = matchReveal && fj !== sys;
                  const col = ok ? "#2ecc8f" : bad ? "#ff6b6b" : mLineColor(i);
                  return <line key={"l" + sys} x1={mLeftEdge()} y1={mRowCenterY(i)} x2={mRightEdge()} y2={mRowCenterY(j)} stroke={col} strokeWidth="5" strokeLinecap="round" opacity={bad ? 0.85 : 1} />;
                })}
                {matchReveal && match.left.map((sys, i) => {
                  if (matchLink[sys] === sys) return null;
                  const j = rightRowOf(sys);
                  return <line key={"c" + sys} x1={mLeftEdge()} y1={mRowCenterY(i)} x2={mRightEdge()} y2={mRowCenterY(j)} stroke="#2ecc8f" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />;
                })}
              </svg>
              {match.left.map((sys, i) => {
                const sel = matchSel === sys;
                const linked = matchLink[sys] != null;
                const ok = matchReveal && matchLink[sys] === sys;
                const bad = matchReveal && matchLink[sys] !== sys;
                return (
                  <button key={"L" + sys} onClick={() => onPickLeft(sys)} disabled={matchLocked} data-sys={SYSTEMS[sys].id}
                    style={{ position: "absolute", left: 8, top: mRowTop(i), width: MNW, height: MNH, borderRadius: 14,
                      border: ok ? "3px solid #2ecc8f" : bad ? "3px solid #ff6b6b" : sel ? "3px solid #fce9a8" : "3px solid #4f9fd6",
                      background: "linear-gradient(180deg,#eef7ff,#cfe8fb)", cursor: matchLocked ? "default" : "pointer",
                      display: "flex", alignItems: "center", gap: 9, padding: "0 9px",
                      boxShadow: sel ? "0 0 0 3px rgba(252,233,168,0.6), 0 6px 14px rgba(0,0,0,0.3)" : "0 6px 14px rgba(0,0,0,0.3)",
                      transition: "all 0.15s ease" }}>
                    <div style={{ width: MIMG, height: MIMG, borderRadius: 12, overflow: "hidden", flexShrink: 0, border: "2px solid rgba(0,0,0,0.1)", background: "#fff" }}>
                      <SystemCard sys={sys} size={MIMG} />
                    </div>
                    <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 14, color: "#0a3a5a", lineHeight: 1.12, flex: 1, minWidth: 0 }}>{SYSTEMS[sys].name}</span>
                    {matchReveal && <span style={{ marginLeft: "auto", fontSize: 16, color: ok ? "#1e8a5d" : "#b3261e", fontWeight: 900 }}>{ok ? "✓" : "✗"}</span>}
                    <span style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: linked ? mLineColor(i) : "#4f9fd6", border: "2px solid #fff" }} />
                  </button>
                );
              })}
              {match.right.map((funcIdx, j) => {
                const usedBy = Object.keys(matchLink).find((k) => matchLink[k] === funcIdx);
                const usedRow = usedBy != null ? match.left.indexOf(parseInt(usedBy, 10)) : -1;
                const ok = matchReveal && usedBy != null && parseInt(usedBy, 10) === funcIdx;
                const highlightCorrect = matchReveal && (usedBy == null || parseInt(usedBy, 10) !== funcIdx);
                return (
                  <button key={"R" + funcIdx} onClick={() => onPickRight(funcIdx)} disabled={matchLocked} data-fn={SYSTEMS[funcIdx].id}
                    style={{ position: "absolute", right: 8, top: mRowTop(j), width: MNW, height: MNH, borderRadius: 14,
                      border: ok ? "3px solid #2ecc8f" : highlightCorrect ? "3px dashed #2ecc8f" : (matchSel != null ? "3px solid #fce9a8" : "3px solid #9b7be8"),
                      background: "linear-gradient(180deg,#f3eeff,#e0d4fb)", cursor: matchLocked ? "default" : "pointer",
                      display: "flex", alignItems: "center", padding: "0 10px",
                      boxShadow: "0 6px 14px rgba(0,0,0,0.3)", transition: "all 0.15s ease" }}>
                    <span style={{ position: "absolute", left: -7, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, borderRadius: "50%", background: usedRow >= 0 ? mLineColor(usedRow) : "#9b7be8", border: "2px solid #fff" }} />
                    <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 14.5, color: "#3a2a66", lineHeight: 1.18, textAlign: "left" }}>{SYSTEMS[funcIdx].fn}</span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        )}
      </div>

      {/* ── Acciones (derecha) ── */}
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
              fontSize: "clamp(56px, 11vmin, 120px)", color: feedback === "ok" ? "#2ecc8f" : "#ff6b6b",
              textShadow: "0 4px 0 rgba(0,0,0,0.45), 0 0 60px currentColor",
            }}>
              {feedback === "ok" ? "¡EXCELENTE!" : "¡UPS!"}
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
              <p className="ed-body" style={{ marginBottom: 16, fontSize: 14 }}>Vas a perder lo de esta partida.</p>
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
// RESULTS — reporte académico imprimible.
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
              <th style={printStyles.th}>Ítem</th>
              <th style={{ ...printStyles.th, ...printStyles.thR }}>Correcto</th>
              <th style={{ ...printStyles.th, ...printStyles.thR }}>Tu respuesta</th>
              <th style={{ ...printStyles.th, ...printStyles.thC }}>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {log.map((e) => (
              <tr key={e.idx} style={printStyles.tr}>
                <td style={{ ...printStyles.td, ...printStyles.tdNum }}>{e.idx}</td>
                <td style={{ ...printStyles.td, fontWeight: 700 }}>{e.emoji} {e.a}</td>
                <td style={{ ...printStyles.td, textAlign: "right" }}>{e.correctAnswer}</td>
                <td style={{ ...printStyles.td, textAlign: "right" }}>{e.userAnswer}</td>
                <td style={{ ...printStyles.td, ...(e.isCorrect ? printStyles.tdOk : printStyles.tdErr) }}>{e.isCorrect ? "Correcto" : "Incorrecto"}</td>
              </tr>
            ))}
            {log.length === 0 && (<tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "#888", fontStyle: "italic" }}>Sin ejercicios.</td></tr>)}
          </tbody>
        </table>
        <div style={printStyles.summary}>
          <div style={printStyles.cell}><div style={printStyles.cellL}>Ejercicios</div><div style={printStyles.cellV}>{attemptedCount}</div></div>
          <div style={printStyles.cell}><div style={printStyles.cellL}>Aciertos</div><div style={printStyles.cellV}>{res.solved}</div></div>
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
  const res = app.lastResult || { category: CAT_LABEL, solved: 0, total: 0, time: 0, starsEarned: 0, log: [] };
  const mm = Math.floor(res.time / 60), ss = res.time % 60;
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
            ¡Gran misión!
          </div>
          <char.Component size={176} />
          <div className="ed-body" style={{ fontStyle: "italic", textAlign: "center", maxWidth: 240, fontSize: 13 }}>
            "{app.studentName || "Campeón"}, acertaste {res.solved} de {attemptedCount}."
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
                  <th style={{ textAlign: "left", padding: "6px 8px" }}>Ítem</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Correcto</th>
                  <th style={{ textAlign: "right", padding: "6px 8px" }}>Tu respuesta</th>
                  <th style={{ textAlign: "center", padding: "6px 8px" }}>Logro</th>
                </tr>
              </thead>
              <tbody>
                {(res.log || []).map((e) => (
                  <tr key={e.idx} style={{ borderBottom: "1px solid rgba(148,120,255,0.18)" }}>
                    <td style={{ padding: "7px 8px", color: "var(--ed-ink-soft)" }}>{e.idx}</td>
                    <td style={{ padding: "7px 8px", fontWeight: 600 }}>{e.emoji} {e.a}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right" }}>{e.correctAnswer}</td>
                    <td style={{ padding: "7px 8px", textAlign: "right" }}>{e.userAnswer}</td>
                    <td style={{ padding: "7px 8px", textAlign: "center", fontFamily: "var(--ed-font-display)", fontWeight: 700, color: e.isCorrect ? "#2ecc8f" : "#ff6b6b" }}>{e.isCorrect ? "✓" : "✗"}</td>
                  </tr>
                ))}
                {(res.log || []).length === 0 && (<tr><td colSpan={5} style={{ padding: "16px 8px", textAlign: "center", color: "var(--ed-ink-soft)", fontStyle: "italic" }}>Sin ejercicios.</td></tr>)}
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: "2px solid rgba(242,194,96,0.45)", paddingTop: 10, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, fontFamily: "var(--ed-font-ui)", fontSize: 11 }}>
            <SummaryCell label="Ejercicios" value={`${attemptedCount}`} />
            <SummaryCell label="Aciertos" value={`${res.solved}`} tone="#2ecc8f" />
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
