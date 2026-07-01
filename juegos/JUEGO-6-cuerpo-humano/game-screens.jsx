// game-screens.jsx — JUEGO-6 · "Misión: Cuerpo Humano" (Ciencias Naturales, 9 años).
// TEMA 1 "Aparatos y sistemas del cuerpo humano". Mini-misión en 3 RONDAS, cada una
// con una mecánica DISTINTA (rampa reconocer → relacionar → ubicar):
//   Ronda 1 "¿Qué sistema es?"        — quiz: ve la imagen del sistema y toca su nombre.
//   Ronda 2 "Une con su función"      — conecta con líneas cada sistema con su función.
//   Ronda 3 "¿Dónde va cada órgano?"  — arrastra cada órgano a su lugar en el cuerpo.
//
// IMÁGENES: 6 ilustraciones de sistemas en assets/sis-<id>.png (digestivo, respiratorio,
// circulatorio, excretor, oseo, nervioso). Si falta alguna, cae a un emoji y sigue jugable.
// El cuerpo de la R3 es un SVG (no necesita imagen).
//
// CONTRATO: GameScreen/ResultsScreen({app,setApp,go}) en window; markFirstAttempt()
// en la 1ª acción; incrementGamesCompleted() al terminar. Invariantes EDINUN: fallar
// NO baja progreso; al fallar se revela lo correcto; salir/reiniciar con modal.

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

function PortalToBody({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

const CAT_LABEL = "Cuerpo humano";

// Sistemas del cuerpo. id = nombre de archivo assets/sis-<id>.png · emoji = respaldo.
// fn = función (declarativa, acaba en punto §8). color = acento de la ficha.
const SYSTEMS = [
  { id: "digestivo",    name: "Digestivo",    emoji: "🍎", color: "#ff9f56", fn: "Desdobla los alimentos." },
  { id: "respiratorio", name: "Respiratorio", emoji: "🫁", color: "#7cc2f0", fn: "Toma el oxígeno del aire." },
  { id: "circulatorio", name: "Circulatorio", emoji: "❤️", color: "#ff6b6b", fn: "Transporta gases y nutrientes." },
  { id: "excretor",     name: "Excretor",     emoji: "🫘", color: "#b89cff", fn: "Elimina los desechos." },
  { id: "oseo",         name: "Óseo",         emoji: "🦴", color: "#e7dcc3", fn: "Sostiene y protege el cuerpo." },
  { id: "nervioso",     name: "Nervioso",     emoji: "🧠", color: "#7fd99b", fn: "Recibe estímulos y da respuestas." },
];
const NS = SYSTEMS.length;

// Órganos de la Ronda 3, con su lugar (cx,cy) en el lienzo del cuerpo (BODY_W×BODY_H).
const ORGANS = [
  { id: 0, key: "cerebro",  name: "Cerebro",  emoji: "🧠", cx: 130, cy: 48  },
  { id: 1, key: "pulmones", name: "Pulmones", emoji: "🫁", cx: 130, cy: 138 },
  { id: 2, key: "corazon",  name: "Corazón",  emoji: "❤️", cx: 106, cy: 196 },
  { id: 3, key: "rinones",  name: "Riñones",  emoji: "🫘", cx: 130, cy: 270 },
];
const NORG = ORGANS.length;
const BODY_W = 260, BODY_H = 350;
const ZONE = 62;        // diámetro de la zona de destino
const ORGAN_TOKEN = 62; // diámetro de la ficha de órgano

function range(n) { return Array.from({ length: n }, (_, i) => i); }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Anti-repetición POR RONDA (§12): cada ronda recuerda lo último visto y lo evita,
// para que al recargar la página NO salga el mismo ejercicio.
const RK_R1 = "edinun_ccn_cuerpo_r1_v1"; // sistemas mostrados en la Ronda 1
const RK_R2 = "edinun_ccn_cuerpo_r2_v1"; // sistemas usados en la Ronda 2
const RK_R3 = "edinun_ccn_cuerpo_r3_v1"; // orden de la bandeja de la Ronda 3
function getRecent(key) {
  try { const r = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(r) ? r : []; }
  catch (e) { return []; }
}
function pushRecent(key, ids, cap) {
  const prev = getRecent(key).filter((id) => ids.indexOf(id) === -1);
  const next = ids.concat(prev).slice(0, cap || 6);
  try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {}
}

// Ronda 1: elige n sistemas para identificar; cada uno con 3 opciones (correcto + 2).
function pickIdentify(n) {
  const recent = new Set(getRecent(RK_R1));
  const fresh = shuffle(range(NS).filter((s) => !recent.has(s)));
  const stale = shuffle(range(NS).filter((s) => recent.has(s)));
  const picks = fresh.concat(stale).slice(0, n);
  return picks.map((s) => {
    const distract = shuffle(range(NS).filter((i) => i !== s)).slice(0, 2);
    return { sys: s, options: shuffle([s].concat(distract)) };
  });
}
// Ronda 2: 4 sistemas (izquierda en orden) + sus funciones barajadas (derecha).
function pickMatch() {
  const recent = new Set(getRecent(RK_R2));
  const fresh = shuffle(range(NS).filter((s) => !recent.has(s)));
  const stale = shuffle(range(NS).filter((s) => recent.has(s)));
  const left = fresh.concat(stale).slice(0, 4);
  let right = shuffle(left.slice());
  let g = 0;
  while (right.every((v, i) => v === left[i]) && g++ < 25) right = shuffle(left.slice());
  return { left, right };
}
// Ronda 3: orden de la bandeja de órganos (barajado, distinto al de la última carga).
function pickOrganTray() {
  const recent = new Set(getRecent(RK_R3));
  let a = shuffle(range(NORG)); let g = 0;
  while (recent.has(a.join(",")) && g++ < 30) a = shuffle(range(NORG));
  return a;
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de sistema — ilustración con respaldo a emoji (como StageCard de J5).
// ─────────────────────────────────────────────────────────────
function SystemCard({ sys, size, dim }) {
  const [err, setErr] = useStateG(false);
  const s = SYSTEMS[sys];
  return (
    <div style={{
      position: "relative", width: size, height: size, borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(180deg, #fdeee0 0%, #ffeef2 55%, #e9f3ff 100%)",
      opacity: dim ? 0.32 : 1, userSelect: "none",
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

// Silueta del cuerpo en SVG (Ronda 3) — sin imágenes, escala nítida.
function BodySilhouette() {
  return (
    <svg viewBox={`0 0 ${BODY_W} ${BODY_H}`} width={BODY_W} height={BODY_H}
      style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} aria-hidden="true">
      <defs>
        <linearGradient id="bodyfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbe6d4" />
          <stop offset="100%" stopColor="#f3cdb4" />
        </linearGradient>
      </defs>
      <g fill="url(#bodyfill)" stroke="rgba(140,80,50,0.35)" strokeWidth="2">
        {/* brazos */}
        <rect x="46" y="92" width="22" height="150" rx="11" />
        <rect x="192" y="92" width="22" height="150" rx="11" />
        {/* piernas */}
        <rect x="96" y="244" width="30" height="100" rx="14" />
        <rect x="134" y="244" width="30" height="100" rx="14" />
        {/* torso */}
        <path d="M86 86 Q70 92 72 150 L78 248 Q80 262 100 262 L160 262 Q180 262 182 248 L188 150 Q190 92 174 86 Z" />
        {/* cuello */}
        <rect x="120" y="68" width="20" height="20" rx="6" />
        {/* cabeza */}
        <circle cx="130" cy="44" r="30" />
      </g>
    </svg>
  );
}

// Ficha de órgano (bandeja / fantasma / colocado).
function OrganToken({ organ, size, dim, placed }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: placed ? "linear-gradient(180deg,#c8f2dc,#9fe6c0)" : "linear-gradient(180deg,#ffffff,#ffe9c2)",
      border: placed ? "3px solid #2ecc8f" : "3px solid #f2c260",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      boxShadow: "0 6px 14px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.08)",
      opacity: dim ? 0.3 : 1, userSelect: "none",
    }}>
      <span style={{ fontSize: Math.round(size * 0.4), lineHeight: 1 }}>{organ.emoji}</span>
      <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 9.5, color: "#7a4b12", marginTop: 1 }}>{organ.name}</span>
    </div>
  );
}

// Geometría de la Ronda 2 (une con líneas).
const R2_W = 504, R2_H = 300, R2_NW = 172, R2_NH = 56;
function r2RowTop(i) { const gap = (R2_H - 4 * R2_NH) / 5; return gap + i * (R2_NH + gap); }
function r2LeftEdge() { return 8 + R2_NW; }
function r2RightEdge() { return R2_W - 8 - R2_NW; }
function r2RowCenterY(i) { return r2RowTop(i) + R2_NH / 2; }

function GameScreen({ app, setApp, go }) {
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];

  const [phase, setPhase] = useStateG("r1"); // "r1" | "r2" | "r3"

  // ── Ronda 1 (quiz: ¿qué sistema es?) ──
  const [r1Items, setR1Items] = useStateG(() => pickIdentify(2));
  const [r1Idx, setR1Idx] = useStateG(0);
  const [r1Answered, setR1Answered] = useStateG(false);
  const [r1Picked, setR1Picked] = useStateG(null);

  // ── Ronda 2 (une con líneas) ──
  const [r2, setR2] = useStateG(() => pickMatch());      // {left:[..], right:[..]}
  const [r2Link, setR2Link] = useStateG(() => ({}));      // sysIdx -> funcIdx
  const r2LinkRef = useRefG(r2Link); r2LinkRef.current = r2Link;
  const [r2Sel, setR2Sel] = useStateG(null);              // sistema seleccionado
  const [r2Reveal, setR2Reveal] = useStateG(false);
  const [r2Locked, setR2Locked] = useStateG(false);

  // ── Ronda 3 (arrastra cada órgano a su lugar) ──
  const [r3Tray, setR3Tray] = useStateG(() => pickOrganTray());
  const [placed, setPlaced] = useStateG(() => ({}));      // organId -> true
  const placedRef = useRefG(placed); placedRef.current = placed;
  const [ghost, setGhost] = useStateG(null);
  const [r3Hint, setR3Hint] = useStateG(null);            // zona correcta a destacar tras fallo
  const [r3Bounce, setR3Bounce] = useStateG(null);        // ficha que rebota
  const [r3Msg, setR3Msg] = useStateG(null);

  // ── Comunes ──
  const [stars, setStars] = useStateG(0);
  const [elapsed, setElapsed] = useStateG(0);
  const [feedback, setFeedback] = useStateG(null);
  const [feedbackMsg, setFeedbackMsg] = useStateG("");
  const [log, setLog] = useStateG([]);
  const [confirmingExit, setConfirmingExit] = useStateG(false);
  const [confirmingRestart, setConfirmingRestart] = useStateG(false);

  const rootRef = useRefG(null);
  const started = useRefG(Date.now());
  const firstAct = useRefG(false);
  const logRef = useRefG(log); logRef.current = log;
  const starsRef = useRefG(stars); starsRef.current = stars;

  useEffectG(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(id);
  }, []);
  useEffectG(() => {
    pushRecent(RK_R1, r1Items.map((it) => it.sys), 3);
    pushRecent(RK_R2, r2.left, 4);
    pushRecent(RK_R3, [r3Tray.join(",")], 4);
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

  // ── RONDA 1: ¿qué sistema es? ──
  const r1Cur = r1Items[r1Idx];
  function onIdentify(sysIdx) {
    if (r1Answered) return;
    markFirst();
    const isCorrect = sysIdx === r1Cur.sys;
    setR1Picked(sysIdx);
    setR1Answered(true);
    if (isCorrect) addStar(1);
    addLog({
      idx: logRef.current.length + 1, emoji: SYSTEMS[r1Cur.sys].emoji, a: "¿Qué sistema es?",
      correctAnswer: SYSTEMS[r1Cur.sys].name, userAnswer: SYSTEMS[sysIdx].name, isCorrect,
    });
    const overlayDelay = isCorrect ? 350 : 1000;
    setTimeout(() => {
      setFeedback(isCorrect ? "ok" : "err");
      setFeedbackMsg(isCorrect ? "¡Muy bien! ⭐" : `Es el sistema ${SYSTEMS[r1Cur.sys].name}.`);
    }, overlayDelay);
    setTimeout(() => {
      setFeedback(null); setFeedbackMsg("");
      if (r1Idx + 1 < r1Items.length) { setR1Idx(r1Idx + 1); setR1Answered(false); setR1Picked(null); }
      else { setPhase("r2"); }
    }, overlayDelay + 1400);
  }
  function r1Ring(sysIdx) {
    const base = "0 8px 18px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.12)";
    if (!r1Answered) return base;
    if (sysIdx === r1Cur.sys) return "0 0 0 4px #2ecc8f, " + base;
    if (sysIdx === r1Picked) return "0 0 0 4px #ff6b6b, " + base;
    return base;
  }

  // ── RONDA 2: une cada sistema con su función ──
  function rightRowOf(funcIdx) { return r2.right.indexOf(funcIdx); }
  function onPickLeft(sysIdx) {
    if (r2Locked) return;
    markFirst();
    setR2Sel(sysIdx);
  }
  function onPickRight(funcIdx) {
    if (r2Locked || r2Sel == null) return;
    markFirst();
    const next = {};
    // copia quitando cualquier sistema ya enlazado a esta función (uso único)
    Object.keys(r2LinkRef.current).forEach((k) => { if (r2LinkRef.current[k] !== funcIdx) next[k] = r2LinkRef.current[k]; });
    next[r2Sel] = funcIdx;
    r2LinkRef.current = next; setR2Link(next); setR2Sel(null);
    if (Object.keys(next).length === 4) setTimeout(() => evaluateMatch(next), 380);
  }
  function evaluateMatch(linkMap) {
    let correct = 0;
    r2.left.forEach((sys) => { if (linkMap[sys] === sys) correct++; });
    const ok = correct === 4;
    setR2Locked(true);
    setR2Reveal(true);
    addStar(correct);
    r2.left.forEach((sys) => {
      addLog({
        idx: logRef.current.length + 1, emoji: SYSTEMS[sys].emoji, a: SYSTEMS[sys].name,
        correctAnswer: SYSTEMS[sys].fn, userAnswer: linkMap[sys] != null ? SYSTEMS[linkMap[sys]].fn : "—",
        isCorrect: linkMap[sys] === sys,
      });
    });
    const overlayDelay = ok ? 350 : 1700;
    setTimeout(() => {
      setFeedback(ok ? "ok" : "err");
      setFeedbackMsg(ok ? "¡Todo bien unido! ⭐" : "Mira las uniones correctas en verde.");
    }, overlayDelay);
    setTimeout(() => { setFeedback(null); setFeedbackMsg(""); setPhase("r3"); }, overlayDelay + (ok ? 1500 : 2000));
  }

  // ── RONDA 3: arrastra cada órgano a su lugar ──
  function toLogical(clientX, clientY) {
    const r = rootRef.current.getBoundingClientRect();
    return { x: (clientX - r.left) * 900 / r.width, y: (clientY - r.top) * 540 / r.height };
  }
  function onOrganDown(e, organId) {
    if (placedRef.current[organId]) return;
    e.preventDefault();
    markFirst();
    const cardRect = e.currentTarget.getBoundingClientRect();
    const tl = toLogical(cardRect.left, cardRect.top);
    const p = toLogical(e.clientX, e.clientY);
    const off = { x: p.x - tl.x, y: p.y - tl.y };
    setGhost({ organId, x: tl.x, y: tl.y });
    const onMove = (ev) => { const q = toLogical(ev.clientX, ev.clientY); setGhost((g) => (g ? { ...g, x: q.x - off.x, y: q.y - off.y } : g)); };
    const onUp = (ev) => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); handleOrganDrop(ev, organId); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function handleOrganDrop(ev, organId) {
    setGhost(null);
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const zoneEl = el && el.closest ? el.closest("[data-zone]") : null;
    if (zoneEl) {
      const zid = parseInt(zoneEl.getAttribute("data-zone"), 10);
      if (zid === organId && !placedRef.current[organId]) { placeOrgan(organId); return; }
    }
    bounceOrgan(organId);
  }
  function placeOrgan(organId) {
    const organ = ORGANS[organId];
    const next = { ...placedRef.current, [organId]: true };
    placedRef.current = next; setPlaced(next);
    addStar(1);
    setR3Hint(null);
    addLog({
      idx: logRef.current.length + 1, emoji: organ.emoji, a: "¿Dónde va?",
      correctAnswer: organ.name + " en su lugar", userAnswer: "Lo ubicaste bien", isCorrect: true,
    });
    const done = ORGANS.every((o) => next[o.id]);
    if (done) {
      setR3Msg("¡Cuerpo completo!");
      setTimeout(() => { setFeedback("ok"); setFeedbackMsg("¡Armaste el cuerpo! 🎉"); }, 320);
      setTimeout(() => { setFeedback(null); setFeedbackMsg(""); finish(); }, 1950);
    } else {
      setR3Msg("¡Ahí va! Sigue.");
    }
  }
  const bounceTimer = useRefG(null);
  function bounceOrgan(organId) {
    setR3Bounce(organId);
    setR3Hint(organId); // destaca en verde su lugar correcto (revelar)
    setR3Msg("Ahí no va. Mira dónde brilla.");
    if (bounceTimer.current) clearTimeout(bounceTimer.current);
    bounceTimer.current = setTimeout(() => { setR3Bounce(null); setR3Hint(null); }, 1100);
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
    const r1 = pickIdentify(2); setR1Items(r1); setR1Idx(0); setR1Answered(false); setR1Picked(null);
    const m = pickMatch(); setR2(m); const emptyLink = {}; r2LinkRef.current = emptyLink; setR2Link(emptyLink);
    setR2Sel(null); setR2Reveal(false); setR2Locked(false);
    const tray = pickOrganTray(); setR3Tray(tray); const noPlaced = {}; placedRef.current = noPlaced; setPlaced(noPlaced);
    setGhost(null); setR3Hint(null); setR3Bounce(null); setR3Msg(null);
    pushRecent(RK_R1, r1.map((it) => it.sys), 3);
    pushRecent(RK_R2, m.left, 4);
    pushRecent(RK_R3, [tray.join(",")], 4);
    starsRef.current = 0; setStars(0); logRef.current = []; setLog([]); setFeedback(null); setFeedbackMsg("");
    firstAct.current = false; started.current = Date.now();
  }

  // Bocadillo del guía por ronda.
  let bocadillo;
  if (phase === "r1") bocadillo = !r1Answered ? "Mira la imagen." : (r1Picked === r1Cur.sys ? "¡Muy bien!" : "¡Casi! Mira el nombre.");
  else if (phase === "r2") bocadillo = r2Reveal ? (r2.left.every((s) => r2LinkRef.current[s] === s) ? "¡Perfecto!" : "Mira las uniones.") : (r2Sel != null ? "Ahora toca su función." : "Toca un sistema.");
  else { const rem = NORG - Object.keys(placed).length; bocadillo = r3Msg || (rem === NORG ? "Arrastra cada órgano a su lugar." : rem === 1 ? "¡Bien! Falta 1." : `¡Bien! Faltan ${rem}.`); }

  return (
    <div ref={rootRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
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

      {/* ── RONDA con dots (igual que JUEGO-1: centrado arriba, sin caja) ── */}
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

      {/* ── Zona central (centrada en X: left/right 183) ── */}
      <div style={{ position: "absolute", top: 30, bottom: 14, left: 183, right: 183, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-evenly" }}>
        {phase === "r1" && (
          <React.Fragment>
            <div style={{ textAlign: "center", fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 23, lineHeight: 1.15, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", pointerEvents: "none", maxWidth: 470 }}>
              ¿Qué sistema del cuerpo es?
            </div>
            <div key={r1Idx} data-answer={SYSTEMS[r1Cur.sys].name} style={{ animation: "ed-pop-in 0.25s", width: 156, height: 156, borderRadius: 18, border: "3px solid #f2c260", overflow: "hidden", boxShadow: "0 12px 28px rgba(0,0,0,0.45)" }}>
              <SystemCard sys={r1Cur.sys} size={156} />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {r1Cur.options.map((opt) => (
                <button key={opt} onClick={() => onIdentify(opt)} disabled={r1Answered} title={SYSTEMS[opt].name}
                  style={{ minWidth: 148, height: 54, padding: "0 14px", borderRadius: 14, border: "3px solid #4f9fd6", cursor: r1Answered ? "default" : "pointer",
                    background: "linear-gradient(180deg,#bfe6ff,#7cc2f0)", color: "#0a3a5a",
                    fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 15,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: r1Ring(opt), transition: "all 0.2s ease", opacity: r1Answered && opt !== r1Cur.sys && opt !== r1Picked ? 0.45 : 1 }}>
                  <span style={{ fontSize: 18 }}>{SYSTEMS[opt].emoji}</span>{SYSTEMS[opt].name}
                </button>
              ))}
            </div>
          </React.Fragment>
        )}

        {phase === "r2" && (
          <React.Fragment>
            <div style={{ textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", lineHeight: 1.1 }}>
                Une cada sistema con su función.
              </div>
              <div style={{ fontFamily: "var(--ed-font-ui)", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
                Toca un sistema y luego su función.
              </div>
            </div>
            <div style={{ position: "relative", width: R2_W, height: R2_H }}>
              {/* Líneas */}
              <svg viewBox={`0 0 ${R2_W} ${R2_H}`} width={R2_W} height={R2_H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                {r2.left.map((sys, i) => {
                  const fj = r2Link[sys];
                  if (fj == null) return null;
                  const j = rightRowOf(fj);
                  const ok = r2Reveal && fj === sys;
                  const bad = r2Reveal && fj !== sys;
                  const col = ok ? "#2ecc8f" : bad ? "#ff6b6b" : "#fce9a8";
                  return <line key={"l" + sys} x1={r2LeftEdge()} y1={r2RowCenterY(i)} x2={r2RightEdge()} y2={r2RowCenterY(j)} stroke={col} strokeWidth="4" strokeLinecap="round" opacity={bad ? 0.85 : 1} />;
                })}
                {/* al revelar, la unión correcta de los fallados (verde punteada) */}
                {r2Reveal && r2.left.map((sys, i) => {
                  if (r2Link[sys] === sys) return null;
                  const j = rightRowOf(sys);
                  return <line key={"c" + sys} x1={r2LeftEdge()} y1={r2RowCenterY(i)} x2={r2RightEdge()} y2={r2RowCenterY(j)} stroke="#2ecc8f" strokeWidth="3" strokeDasharray="6 6" strokeLinecap="round" />;
                })}
              </svg>
              {/* Nodos izquierdos: sistemas */}
              {r2.left.map((sys, i) => {
                const sel = r2Sel === sys;
                const linked = r2Link[sys] != null;
                const ok = r2Reveal && r2Link[sys] === sys;
                const bad = r2Reveal && r2Link[sys] !== sys;
                return (
                  <button key={"L" + sys} onClick={() => onPickLeft(sys)} disabled={r2Locked} data-sys={SYSTEMS[sys].id}
                    style={{ position: "absolute", left: 8, top: r2RowTop(i), width: R2_NW, height: R2_NH, borderRadius: 14,
                      border: ok ? "3px solid #2ecc8f" : bad ? "3px solid #ff6b6b" : sel ? "3px solid #fce9a8" : "3px solid #4f9fd6",
                      background: "linear-gradient(180deg,#eef7ff,#cfe8fb)", cursor: r2Locked ? "default" : "pointer",
                      display: "flex", alignItems: "center", gap: 8, padding: "0 8px",
                      boxShadow: sel ? "0 0 0 3px rgba(252,233,168,0.6), 0 6px 14px rgba(0,0,0,0.3)" : "0 6px 14px rgba(0,0,0,0.3)",
                      transition: "all 0.15s ease" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, overflow: "hidden", flexShrink: 0, border: "2px solid rgba(0,0,0,0.1)" }}>
                      <SystemCard sys={sys} size={40} />
                    </div>
                    <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 15, color: "#0a3a5a" }}>{SYSTEMS[sys].name}</span>
                    {r2Reveal && <span style={{ marginLeft: "auto", fontSize: 16, color: ok ? "#1e8a5d" : "#b3261e", fontWeight: 900 }}>{ok ? "✓" : "✗"}</span>}
                    <span style={{ position: "absolute", right: -7, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: "50%", background: linked ? "#fce9a8" : "#4f9fd6", border: "2px solid #fff" }} />
                  </button>
                );
              })}
              {/* Nodos derechos: funciones (barajadas) */}
              {r2.right.map((funcIdx, j) => {
                const usedBy = Object.keys(r2Link).find((k) => r2Link[k] === funcIdx);
                const ok = r2Reveal && usedBy != null && parseInt(usedBy, 10) === funcIdx;
                const highlightCorrect = r2Reveal && (usedBy == null || parseInt(usedBy, 10) !== funcIdx);
                return (
                  <button key={"R" + funcIdx} onClick={() => onPickRight(funcIdx)} disabled={r2Locked} data-fn={SYSTEMS[funcIdx].id}
                    style={{ position: "absolute", right: 8, top: r2RowTop(j), width: R2_NW, height: R2_NH, borderRadius: 14,
                      border: ok ? "3px solid #2ecc8f" : highlightCorrect ? "3px dashed #2ecc8f" : (r2Sel != null ? "3px solid #fce9a8" : "3px solid #9b7be8"),
                      background: "linear-gradient(180deg,#f3eeff,#e0d4fb)", cursor: r2Locked ? "default" : "pointer",
                      display: "flex", alignItems: "center", padding: "0 10px",
                      boxShadow: "0 6px 14px rgba(0,0,0,0.3)", transition: "all 0.15s ease" }}>
                    <span style={{ position: "absolute", left: -7, top: "50%", transform: "translateY(-50%)", width: 12, height: 12, borderRadius: "50%", background: usedBy != null ? "#fce9a8" : "#9b7be8", border: "2px solid #fff" }} />
                    <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 13.5, color: "#3a2a66", lineHeight: 1.15, textAlign: "left" }}>{SYSTEMS[funcIdx].fn}</span>
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        )}

        {phase === "r3" && (
          <React.Fragment>
            <div style={{ textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", lineHeight: 1.1 }}>
                ¿Dónde va cada órgano?
              </div>
              <div style={{ fontFamily: "var(--ed-font-ui)", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
                Arrastra cada órgano a su lugar en el cuerpo.
              </div>
            </div>
            {/* Cuerpo con zonas de destino */}
            <div style={{ position: "relative", width: BODY_W, height: BODY_H }}>
              <BodySilhouette />
              {ORGANS.map((organ) => {
                const isPlaced = !!placed[organ.id];
                const isHint = r3Hint === organ.id;
                return (
                  <div key={organ.id} data-zone={organ.id}
                    style={{ position: "absolute", left: organ.cx - ZONE / 2, top: organ.cy - ZONE / 2, width: ZONE, height: ZONE, borderRadius: "50%",
                      border: isPlaced ? "3px solid #2ecc8f" : isHint ? "3px solid #2ecc8f" : "2px dashed rgba(255,255,255,0.75)",
                      background: isPlaced ? "transparent" : "rgba(255,255,255,0.14)",
                      boxShadow: isHint ? "0 0 20px rgba(46,204,143,0.9)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      animation: isHint ? "ed-pop-in 0.3s" : "none", transition: "box-shadow .2s, border-color .2s" }}>
                    {isPlaced && <OrganToken organ={organ} size={ZONE - 8} placed />}
                  </div>
                );
              })}
            </div>
            {/* Bandeja de órganos */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", padding: "8px 14px", borderRadius: 20, background: "rgba(0,0,0,0.22)", border: "1.5px solid rgba(242,194,96,0.25)", minHeight: ORGAN_TOKEN + 14 }}>
              {r3Tray.map((organId) => {
                const organ = ORGANS[organId];
                if (placed[organId]) return <div key={organId} style={{ width: ORGAN_TOKEN, height: ORGAN_TOKEN, borderRadius: "50%", border: "2px dashed rgba(255,255,255,0.12)" }} />;
                if (ghost && ghost.organId === organId) return <div key={organId} style={{ width: ORGAN_TOKEN, height: ORGAN_TOKEN }}><OrganToken organ={organ} size={ORGAN_TOKEN} dim /></div>;
                return (
                  <div key={organId} data-organ={organId} onPointerDown={(e) => onOrganDown(e, organId)}
                    style={{ width: ORGAN_TOKEN, height: ORGAN_TOKEN, touchAction: "none", cursor: "grab",
                      animation: r3Bounce === organId ? "ed-pop-in 0.4s" : "none" }}>
                    <OrganToken organ={organ} size={ORGAN_TOKEN} />
                  </div>
                );
              })}
            </div>
          </React.Fragment>
        )}
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

      {/* ── Ficha fantasma que sigue al dedo (Ronda 3) ── */}
      {ghost && (
        <div style={{ position: "absolute", left: ghost.x, top: ghost.y, width: ORGAN_TOKEN, height: ORGAN_TOKEN, pointerEvents: "none", zIndex: 2000, transform: "scale(1.08)" }}>
          <OrganToken organ={ORGANS[ghost.organId]} size={ORGAN_TOKEN} />
        </div>
      )}

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
