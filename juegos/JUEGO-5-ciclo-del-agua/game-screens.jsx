// game-screens.jsx — JUEGO-5 · "El viaje del agua" (Ciencias Naturales, 8 años).
// TEMA 3 "Ciclo del agua en la naturaleza". Mini-recorrido en 3 RONDAS, cada una
// con una mecánica DISTINTA (rampa reconocer → ordenar → aplicar):
//   Ronda 1 "¿Qué proceso es?" — quiz de decisión (toca el nombre del proceso).
//   Ronda 2 "Ordena el ciclo"  — arrastra las 4 etapas a los casilleros 1·2·3·4.
//   Ronda 3 "Encuentra las fugas" — toca en la escena lo que desperdicia agua (cuidado del agua).
//
// IMÁGENES: 4 ilustraciones de etapas en assets/<file>.png (evaporacion, condensacion,
// precipitacion, recoleccion). Si falta alguna, cae a un emoji por etapa y sigue jugable.
//
// CONTRATO: GameScreen/ResultsScreen({app,setApp,go}) en window; markFirstAttempt()
// en la 1ª acción; incrementGamesCompleted() al terminar. Invariantes EDINUN: fallar
// NO baja progreso; al fallar se revela lo correcto; salir/reiniciar con modal.

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

function PortalToBody({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

const CAT_LABEL = "Ciclo del agua";

// Etapas del ciclo, EN ORDEN (índice = posición correcta 0..3).
const STAGE_FILES = ["evaporacion", "condensacion", "precipitacion", "recoleccion"]; // assets/<file>.png
const STAGE_LABEL = ["Evaporación", "Condensación", "Precipitación", "Recolección"];
const STAGE_EMOJI = ["☀️", "☁️", "🌧️", "🏞️"]; // respaldo si falta la imagen
const N_STAGES = 4;

// Banco de acciones para la Ronda 3 "Encuentra las fugas" (cuidado del agua).
// waste:true = desperdicia agua (son las que el niño debe tocar y marcar).
const LEAK_BANK = [
  { e: "🚰", t: "Grifo abierto", waste: true },
  { e: "🚿", t: "Ducha muy larga", waste: true },
  { e: "💧", t: "Llave que gotea", waste: true },
  { e: "🚗", t: "Lavar con manguera", waste: true },
  { e: "🚽", t: "Inodoro que gotea", waste: true },
  { e: "💦", t: "Manguera al regar", waste: true },
  { e: "🛁", t: "Tina muy llena", waste: true },
  { e: "🍽️", t: "Platos con grifo abierto", waste: true },
  { e: "🪥", t: "Cerrar el grifo", waste: false },
  { e: "🪣", t: "Lavar con balde", waste: false },
  { e: "🌧️", t: "Juntar la lluvia", waste: false },
  { e: "🔧", t: "Arreglar la llave", waste: false },
  { e: "♻️", t: "Reusar el agua", waste: false },
  { e: "🧼", t: "Cerrar al enjabonarte", waste: false },
  { e: "⏳", t: "Ducha corta", waste: false },
];
const LEAK_TARGETS = 3; // fugas a encontrar por ronda
const LEAK_DECOYS = 3;  // acciones que SÍ cuidan el agua (no se tocan)

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
const RK_R1 = "edinun_ccn_ciclo_r1_v1";    // etapa mostrada en la Ronda 1
const RK_R2 = "edinun_ccn_ciclo_r2_v1";    // orden de la bandeja en la Ronda 2
const RK_R3 = "edinun_ccn_ciclo_fugas_v1"; // acciones de la Ronda 3
function getRecent(key) {
  try { const r = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(r) ? r : []; }
  catch (e) { return []; }
}
function pushRecent(key, ids, cap) {
  const prev = getRecent(key).filter((id) => ids.indexOf(id) === -1);
  const next = ids.concat(prev).slice(0, cap || 6);
  try { localStorage.setItem(key, JSON.stringify(next)); } catch (e) {}
}

// Ronda 1: elige n etapas para identificar; cada una con 3 opciones (correcta + 2).
function pickIdentify(n) {
  const recent = new Set(getRecent(RK_R1));
  const fresh = shuffle([0, 1, 2, 3].filter((s) => !recent.has(s)));
  const stale = shuffle([0, 1, 2, 3].filter((s) => recent.has(s)));
  const stages = fresh.concat(stale).slice(0, n);
  return stages.map((s) => {
    const distract = shuffle([0, 1, 2, 3].filter((i) => i !== s)).slice(0, 2);
    return { stage: s, options: shuffle([s].concat(distract)) };
  });
}
// Ronda 2: orden inicial barajado de la bandeja (nunca ya resuelto y distinto al
// de la última carga).
function shuffledTray() {
  const recent = new Set(getRecent(RK_R2));
  let a = shuffle([0, 1, 2, 3]); let g = 0;
  while ((a.join(",") === "0,1,2,3" || recent.has(a.join(","))) && g++ < 40) a = shuffle([0, 1, 2, 3]);
  return a;
}
// Ronda 3: arma la escena con LEAK_TARGETS fugas + LEAK_DECOYS buenas acciones,
// evitando las más recientes; barajada para que cambie de posición en cada partida.
function pickScene() {
  const recent = new Set(getRecent(RK_R3));
  const idxOf = (waste) => LEAK_BANK.map((it, i) => i).filter((i) => LEAK_BANK[i].waste === waste);
  const pickAvoid = (pool, n) => {
    const fresh = shuffle(pool.filter((i) => !recent.has(i)));
    const stale = shuffle(pool.filter((i) => recent.has(i)));
    return fresh.concat(stale).slice(0, n);
  };
  const chosen = pickAvoid(idxOf(true), LEAK_TARGETS).concat(pickAvoid(idxOf(false), LEAK_DECOYS));
  return shuffle(chosen).map((bankIdx, k) => ({
    id: k, bankIdx, e: LEAK_BANK[bankIdx].e, t: LEAK_BANK[bankIdx].t,
    waste: LEAK_BANK[bankIdx].waste, status: "idle",
  }));
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de etapa — ilustración con respaldo a emoji (como PlantCard de J2).
// ─────────────────────────────────────────────────────────────
function StageCard({ stage, size, dim }) {
  const [err, setErr] = useStateG(false);
  return (
    <div style={{
      position: "relative", width: size, height: size, borderRadius: 16, overflow: "hidden",
      background: "linear-gradient(180deg, #bfe6ff 0%, #e8f6ff 58%, #cfeae0 100%)",
      opacity: dim ? 0.32 : 1, userSelect: "none",
    }}>
      {err ? (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: Math.round(size * 0.5) }}>{STAGE_EMOJI[stage]}</span>
        </div>
      ) : (
        <img src={`assets/${STAGE_FILES[stage]}.png`} alt="" draggable={false} onError={() => setErr(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
      )}
    </div>
  );
}

const CARD = 108; // ficha de etapa en la Ronda 2

function GameScreen({ app, setApp, go }) {
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];

  const [phase, setPhase] = useStateG("r1"); // "r1" | "r2" | "r3"

  // ── Ronda 1 (quiz: ¿qué proceso es?) ──
  const [r1Items, setR1Items] = useStateG(() => pickIdentify(1));
  const [r1Idx, setR1Idx] = useStateG(0);
  const [r1Answered, setR1Answered] = useStateG(false);
  const [r1Picked, setR1Picked] = useStateG(null);

  // ── Ronda 2 (arrastre: ordenar el ciclo) ──
  const [placement, setPlacement] = useStateG(() => ["tray", "tray", "tray", "tray"]); // placement[stageId]="tray"|0..3
  const placementRef = useRefG(placement); placementRef.current = placement;
  const [trayOrder, setTrayOrder] = useStateG(() => shuffledTray());
  const [ghost, setGhost] = useStateG(null);
  const [reveal, setReveal] = useStateG(null);  // slotsArr evaluado, o null
  const [r2Locked, setR2Locked] = useStateG(false);

  // ── Ronda 3 (encuentra las fugas) ──
  const [r3Tiles, setR3Tiles] = useStateG(() => pickScene());
  const r3TilesRef = useRefG(r3Tiles); r3TilesRef.current = r3Tiles;
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
    pushRecent(RK_R1, r1Items.map((it) => it.stage), 2);
    pushRecent(RK_R2, [trayOrder.join(",")], 3);
    pushRecent(RK_R3, r3Tiles.map((t) => t.bankIdx), 6);
    return () => cancelCheck();
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

  // ── RONDA 1: ¿qué proceso es? ──
  const r1Cur = r1Items[r1Idx];
  function onIdentify(stageIdx) {
    if (r1Answered) return;
    markFirst();
    const isCorrect = stageIdx === r1Cur.stage;
    setR1Picked(stageIdx);
    setR1Answered(true);
    if (isCorrect) addStar(1);
    addLog({
      idx: logRef.current.length + 1, emoji: STAGE_EMOJI[r1Cur.stage], a: "¿Qué proceso es?",
      correctAnswer: STAGE_LABEL[r1Cur.stage], userAnswer: STAGE_LABEL[stageIdx], isCorrect,
    });
    const overlayDelay = isCorrect ? 350 : 1000;
    setTimeout(() => {
      setFeedback(isCorrect ? "ok" : "err");
      setFeedbackMsg(isCorrect ? "¡Muy bien! ⭐" : `Es ${STAGE_LABEL[r1Cur.stage]}.`);
    }, overlayDelay);
    setTimeout(() => {
      setFeedback(null); setFeedbackMsg("");
      if (r1Idx + 1 < r1Items.length) { setR1Idx(r1Idx + 1); setR1Answered(false); setR1Picked(null); }
      else { setPhase("r2"); }
    }, overlayDelay + 1400);
  }
  function r1Ring(stageIdx) {
    const base = "0 8px 18px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.12)";
    if (!r1Answered) return base;
    if (stageIdx === r1Cur.stage) return "0 0 0 4px #2ecc8f, " + base;
    if (stageIdx === r1Picked) return "0 0 0 4px #ff6b6b, " + base;
    return base;
  }

  // ── RONDA 2: ordenar el ciclo (arrastre, motor de J2) ──
  const slotsArr = [null, null, null, null];
  placement.forEach((loc, id) => { if (typeof loc === "number") slotsArr[loc] = id; });
  const draggingId = ghost ? ghost.stageId : null;

  function toLogical(clientX, clientY) {
    const r = rootRef.current.getBoundingClientRect();
    return { x: (clientX - r.left) * 900 / r.width, y: (clientY - r.top) * 540 / r.height };
  }
  function onCardDown(e, stageId) {
    if (r2Locked) return;
    cancelCheck();
    e.preventDefault();
    markFirst();
    const cardRect = e.currentTarget.getBoundingClientRect();
    const tl = toLogical(cardRect.left, cardRect.top);
    const p = toLogical(e.clientX, e.clientY);
    const off = { x: p.x - tl.x, y: p.y - tl.y };
    setGhost({ stageId, x: tl.x, y: tl.y });
    const onMove = (ev) => { const q = toLogical(ev.clientX, ev.clientY); setGhost((g) => (g ? { ...g, x: q.x - off.x, y: q.y - off.y } : g)); };
    const onUp = (ev) => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); handleDrop(ev, stageId); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }
  function handleDrop(ev, stageId) {
    setGhost(null);
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const slotEl = el && el.closest ? el.closest("[data-slot]") : null;
    if (slotEl) { placeCard(stageId, parseInt(slotEl.getAttribute("data-slot"), 10)); return; }
    const trayEl = el && el.closest ? el.closest("[data-tray]") : null;
    if (trayEl) {
      const next = placementRef.current.slice(); next[stageId] = "tray";
      placementRef.current = next; setPlacement(next); scheduleCheck(next);
    }
  }
  function placeCard(stageId, slot) {
    const next = placementRef.current.slice();
    for (let id = 0; id < N_STAGES; id++) { if (next[id] === slot) next[id] = "tray"; }
    next[stageId] = slot;
    placementRef.current = next; setPlacement(next); scheduleCheck(next);
  }
  const GRACE_MS = 600;
  const checkTimer = useRefG(null);
  function cancelCheck() { if (checkTimer.current) { clearTimeout(checkTimer.current); checkTimer.current = null; } }
  function scheduleCheck(p) {
    cancelCheck();
    if (!r2Locked && p.every((v) => typeof v === "number")) {
      checkTimer.current = setTimeout(() => evaluateOrder(placementRef.current), GRACE_MS);
    }
  }
  function evaluateOrder(finalPlacement) {
    const arr = [null, null, null, null];
    finalPlacement.forEach((loc, id) => { if (typeof loc === "number") arr[loc] = id; });
    let correct = 0;
    for (let i = 0; i < N_STAGES; i++) if (arr[i] === i) correct++;
    const ok = correct === N_STAGES;
    setR2Locked(true);
    setReveal(arr);
    addStar(correct);
    addLog({
      idx: logRef.current.length + 1, emoji: "🔄", a: "Ordenar el ciclo",
      correctAnswer: "En orden", userAnswer: `${correct} de ${N_STAGES} bien`, isCorrect: ok,
    });
    // Al fallar, deja ver el ORDEN CORRECTO (casilleros + etapa debajo) antes del
    // overlay "¡UPS!" — si no, el overlay lo tapa y el niño no ve la respuesta.
    const overlayDelay = ok ? 350 : 1600;
    setTimeout(() => {
      setFeedback(ok ? "ok" : "err");
      setFeedbackMsg(ok ? "¡Perfecto, en orden! ⭐" : "Mira el orden correcto del ciclo.");
    }, overlayDelay);
    setTimeout(() => { setFeedback(null); setFeedbackMsg(""); setPhase("r3"); }, overlayDelay + (ok ? 1500 : 1800));
  }
  function slotBorder(i) {
    // Solo se revela al final (no en vivo): así no puede corregir, y al fallar ve
    // cuál era el orden correcto.
    if (reveal) return slotsArr[i] === i ? "3px solid #2ecc8f" : "3px solid #ff6b6b";
    if (slotsArr[i] != null) return "3px solid #f2c260";
    return "3px dashed rgba(252,233,168,0.7)";
  }
  function DragStage({ stageId }) {
    return (
      <div onPointerDown={(e) => onCardDown(e, stageId)} data-stagecard={stageId}
        style={{ width: CARD, height: CARD, touchAction: "none", cursor: r2Locked ? "default" : "grab",
          borderRadius: 16, border: "3px solid #f2c260", position: "relative",
          boxShadow: "0 8px 18px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.10)" }}>
        <StageCard stage={stageId} size={CARD - 6} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, background: "rgba(10,6,35,0.78)", color: "#fce9a8", fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 11, textAlign: "center", padding: "2px 0", borderRadius: "0 0 13px 13px" }}>
          {STAGE_LABEL[stageId]}
        </div>
      </div>
    );
  }

  // ── RONDA 3: encuentra las fugas (busca y toca lo que gasta agua) ──
  const r3FoundCount = r3Tiles.filter((t) => t.status === "found").length;
  function onLeak(tileId) {
    const tile = r3TilesRef.current.find((t) => t.id === tileId);
    if (!tile || tile.status !== "idle") return;
    markFirst();
    const isLeak = tile.waste;
    const next = r3TilesRef.current.map((t) => (t.id === tileId ? { ...t, status: isLeak ? "found" : "wrong" } : t));
    r3TilesRef.current = next; setR3Tiles(next);
    addLog({
      idx: logRef.current.length + 1, emoji: tile.e, a: tile.t,
      correctAnswer: isLeak ? "Gasta agua" : "Cuida el agua",
      userAnswer: "La marcaste como fuga", isCorrect: isLeak,
    });
    if (isLeak) {
      addStar(1);
      const foundNow = next.filter((t) => t.status === "found").length;
      if (foundNow >= LEAK_TARGETS) {
        setR3Msg("¡Las encontraste todas!");
        setTimeout(() => { setFeedback("ok"); setFeedbackMsg("¡Encontraste todas las fugas! 💧"); }, 300);
        setTimeout(() => { setFeedback(null); setFeedbackMsg(""); finish(); }, 1900);
      } else {
        setR3Msg("¡Bien visto! Sigue buscando.");
      }
    } else {
      setR3Msg("Esa cuida el agua 👍, sigue.");
    }
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
    cancelCheck();
    setPhase("r1");
    const r1 = pickIdentify(1); setR1Items(r1); setR1Idx(0); setR1Answered(false); setR1Picked(null);
    const fresh = ["tray", "tray", "tray", "tray"]; placementRef.current = fresh; setPlacement(fresh);
    const tray = shuffledTray(); setTrayOrder(tray); setGhost(null); setReveal(null); setR2Locked(false);
    const scene = pickScene(); r3TilesRef.current = scene; setR3Tiles(scene); setR3Msg(null);
    pushRecent(RK_R1, r1.map((it) => it.stage), 2);
    pushRecent(RK_R2, [tray.join(",")], 3);
    pushRecent(RK_R3, scene.map((t) => t.bankIdx), 6);
    starsRef.current = 0; setStars(0); logRef.current = []; setLog([]); setFeedback(null); setFeedbackMsg("");
    firstAct.current = false; started.current = Date.now();
  }

  // Bocadillo del guía por ronda.
  let bocadillo;
  if (phase === "r1") bocadillo = !r1Answered ? "Mira la escena." : (r1Picked === r1Cur.stage ? "¡Muy bien!" : "¡Casi! Mira la respuesta.");
  else if (phase === "r2") bocadillo = reveal ? (reveal.every((sid, i) => sid === i) ? "¡Perfecto, en orden!" : "¡Casi! Mira el orden.") : "Del Sol al mar y de vuelta.";
  else { const rem = LEAK_TARGETS - r3FoundCount; bocadillo = r3Msg || (r3FoundCount === 0 ? "Busca lo que desperdicia agua." : rem === 1 ? "¡Bien! Falta 1." : `¡Bien! Faltan ${rem}.`); }

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
              ¿Qué proceso del agua es?
            </div>
            <div key={r1Idx} data-answer={STAGE_LABEL[r1Cur.stage]} style={{ animation: "ed-pop-in 0.25s", width: 150, height: 150, borderRadius: 18, border: "3px solid #f2c260", overflow: "hidden", boxShadow: "0 12px 28px rgba(0,0,0,0.45)" }}>
              <StageCard stage={r1Cur.stage} size={150} />
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              {r1Cur.options.map((opt) => (
                <button key={opt} onClick={() => onIdentify(opt)} disabled={r1Answered} title={STAGE_LABEL[opt]}
                  style={{ minWidth: 150, height: 54, padding: "0 14px", borderRadius: 14, border: "3px solid #4f9fd6", cursor: r1Answered ? "default" : "pointer",
                    background: "linear-gradient(180deg,#bfe6ff,#7cc2f0)", color: "#0a3a5a",
                    fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 15,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxShadow: r1Ring(opt), transition: "all 0.2s ease", opacity: r1Answered && opt !== r1Cur.stage && opt !== r1Picked ? 0.45 : 1 }}>
                  <span style={{ fontSize: 18 }}>{STAGE_EMOJI[opt]}</span>{STAGE_LABEL[opt]}
                </button>
              ))}
            </div>
          </React.Fragment>
        )}

        {phase === "r2" && (
          <React.Fragment>
            <div style={{ textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", lineHeight: 1.1 }}>
                Ordena el ciclo del agua.
              </div>
              <div style={{ fontFamily: "var(--ed-font-ui)", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
                Arrastra las etapas en orden, del 1 al 4.
              </div>
            </div>
            {/* Casilleros numerados */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              {Array.from({ length: N_STAGES }).map((_, i) => {
                const occ = slotsArr[i];
                return (
                  <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 14, color: "#fce9a8" }}>{i + 1}</div>
                    <div data-slot={i} style={{
                      width: CARD, height: CARD, borderRadius: 18, border: slotBorder(i), position: "relative",
                      background: occ != null ? "transparent" : "rgba(0,0,0,0.18)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: reveal && slotsArr[i] === i ? "0 0 18px rgba(46,204,143,0.55)" : "inset 0 2px 6px rgba(0,0,0,0.25)",
                    }}>
                      {occ == null ? (
                        <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 36, color: "rgba(252,233,168,0.5)" }}>{i + 1}</span>
                      ) : occ === draggingId ? (
                        <StageCard stage={occ} size={CARD - 6} dim />
                      ) : (
                        <DragStage stageId={occ} />
                      )}
                      {reveal && slotsArr[i] != null && (
                        <span style={{ position: "absolute", top: -9, right: -9, width: 25, height: 25, borderRadius: "50%", background: slotsArr[i] === i ? "#2ecc8f" : "#ff6b6b", color: "#fff", fontFamily: "var(--ed-font-display)", fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.45)", zIndex: 5 }}>
                          {slotsArr[i] === i ? "✓" : "✗"}
                        </span>
                      )}
                    </div>
                    {reveal && slotsArr[i] !== i && (
                      <div style={{ fontFamily: "var(--ed-font-display)", fontSize: 11, fontWeight: 800, color: "#0a3a1e", background: "#7CF2BF", borderRadius: 999, padding: "2px 9px", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>{STAGE_LABEL[i]}</div>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Bandeja */}
            <div data-tray="1" style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center", padding: "10px 14px", borderRadius: 20, background: "rgba(0,0,0,0.22)", border: "1.5px solid rgba(242,194,96,0.25)", minHeight: CARD + 18 }}>
              {trayOrder.map((stageId, k) => {
                const inTray = placement[stageId] === "tray";
                if (!inTray) return <div key={k} style={{ width: CARD, height: CARD, borderRadius: 16, border: "2px dashed rgba(255,255,255,0.12)" }} />;
                if (stageId === draggingId) return <div key={k} style={{ width: CARD, height: CARD }}><StageCard stage={stageId} size={CARD - 6} dim /></div>;
                return <DragStage key={k} stageId={stageId} />;
              })}
            </div>
          </React.Fragment>
        )}

        {phase === "r3" && (
          <React.Fragment>
            <div style={{ textAlign: "center", pointerEvents: "none" }}>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 22, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", lineHeight: 1.1 }}>
                Encuentra lo que gasta agua.
              </div>
              <div style={{ fontFamily: "var(--ed-font-ui)", fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 3 }}>
                Toca las fugas — llevas {r3FoundCount} de {LEAK_TARGETS}.
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 152px)", gap: 12, justifyContent: "center" }}>
              {r3Tiles.map((tile) => {
                const isFound = tile.status === "found";
                const isWrong = tile.status === "wrong";
                const resolved = tile.status !== "idle";
                const ring = isFound ? "0 0 0 4px rgba(46,204,143,0.45), " : isWrong ? "0 0 0 4px rgba(255,107,107,0.45), " : "";
                return (
                  <button key={tile.id} onClick={() => onLeak(tile.id)} disabled={resolved}
                    data-waste={tile.waste ? "1" : "0"} data-status={tile.status} title={tile.t}
                    style={{
                      position: "relative", height: 104, padding: "8px 8px 6px", borderRadius: 16,
                      border: isFound ? "3px solid #2ecc8f" : isWrong ? "3px solid #ff6b6b" : "3px solid #4f9fd6",
                      cursor: resolved ? "default" : "pointer",
                      background: isFound ? "linear-gradient(180deg,#c8f2dc,#9fe6c0)" : isWrong ? "linear-gradient(180deg,#ffd6d6,#ffb0b0)" : "linear-gradient(180deg,#dff1ff,#bfe6ff)",
                      color: "#0a3a5a", fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 12.5, lineHeight: 1.15,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5,
                      boxShadow: ring + "0 8px 16px rgba(0,0,0,0.30), inset 0 -3px 0 rgba(0,0,0,0.10)",
                      transition: "all 0.18s ease",
                    }}>
                    {isFound && <span style={{ position: "absolute", top: 5, left: 8, fontFamily: "var(--ed-font-ui)", fontSize: 10, fontWeight: 800, color: "#1e8a5d" }}>✓ ¡Fuga!</span>}
                    {isWrong && <span style={{ position: "absolute", top: 5, left: 8, fontFamily: "var(--ed-font-ui)", fontSize: 10, fontWeight: 800, color: "#b3261e" }}>✗ esa cuida</span>}
                    {isFound && <span style={{ position: "absolute", top: 4, right: 7, fontSize: 15 }}>✅</span>}
                    <span style={{ fontSize: 38, lineHeight: 1 }}>{tile.e}</span>
                    <span style={{ textAlign: "center" }}>{tile.t}</span>
                  </button>
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

      {/* ── Ficha fantasma que sigue al dedo (Ronda 2) ── */}
      {ghost && (
        <div style={{ position: "absolute", left: ghost.x, top: ghost.y, width: CARD, height: CARD, pointerEvents: "none", zIndex: 2000, transform: "scale(1.06)", borderRadius: 18, border: "3px solid #f2c260", boxShadow: "0 16px 26px rgba(0,0,0,0.5)" }}>
          <StageCard stage={ghost.stageId} size={CARD - 6} />
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
            ¡Gran viaje!
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
