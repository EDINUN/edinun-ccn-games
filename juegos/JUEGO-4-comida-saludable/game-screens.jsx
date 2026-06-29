// game-screens.jsx — JUEGO-4 · "Comida saludable" (Ciencias Naturales, 6 años).
// TEMA 2 "Cuido mi salud física y mental": alimentación saludable.
// Juego en 2 FASES sobre el FORMATO EDINUN:
//   Fase 1 "¿Es saludable?" — 3 rondas: aparece un alimento y el niño toca
//     ✅ SÍ, SANO / ❌ NO SANO (decisión única, como JUEGO-1/3).
//   Fase 2 "Arma tu plato" — arrastra SOLO la comida sana al plato; la chatarra
//     rebota con un aviso (motor de arrastre de JUEGO-2).
//
// CONTRATO: GameScreen/ResultsScreen({app,setApp,go}) expuestos en window;
// markFirstAttempt() en la 1ª acción; incrementGamesCompleted() al terminar.
// Invariantes EDINUN: fallar NO baja progreso; al fallar se revela lo correcto;
// salir/reiniciar con modal; barajado anti-repetición en cada carga.

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

function PortalToBody({ children }) {
  return ReactDOM.createPortal(children, document.body);
}

const CAT_LABEL = "Comida saludable";

// Banco de alimentos. ok=true → saludable; ok=false → chatarra.
const FOODS = [
  { e: "🍎", t: "Manzana", ok: true },
  { e: "🍌", t: "Plátano", ok: true },
  { e: "🍓", t: "Fresa", ok: true },
  { e: "🥦", t: "Brócoli", ok: true },
  { e: "🥕", t: "Zanahoria", ok: true },
  { e: "🍅", t: "Tomate", ok: true },
  { e: "🌽", t: "Maíz", ok: true },
  { e: "🥑", t: "Aguacate", ok: true },
  { e: "🍇", t: "Uvas", ok: true },
  { e: "🍐", t: "Pera", ok: true },
  { e: "🥗", t: "Ensalada", ok: true },
  { e: "💧", t: "Agua", ok: true },
  { e: "🍔", t: "Hamburguesa", ok: false },
  { e: "🍟", t: "Papas fritas", ok: false },
  { e: "🍕", t: "Pizza", ok: false },
  { e: "🍰", t: "Pastel", ok: false },
  { e: "🧁", t: "Pastelito", ok: false },
  { e: "🍭", t: "Paleta", ok: false },
  { e: "🍬", t: "Caramelo", ok: false },
  { e: "🥤", t: "Gaseosa", ok: false },
  { e: "🍩", t: "Dona", ok: false },
  { e: "🍫", t: "Chocolate", ok: false },
];
const HEALTHY_IDS = FOODS.map((_, i) => i).filter((i) => FOODS[i].ok);
const JUNK_IDS = FOODS.map((_, i) => i).filter((i) => !FOODS[i].ok);

const N_CLASSIFY = 2;     // rondas de la Fase 1
const PLATE_HEALTHY = 4;  // alimentos sanos que van al plato (Fase 2)
const PLATE_JUNK = 2;     // chatarra mezclada en la bandeja del plato
const N = N_CLASSIFY + 1; // total de pasos (3 clasificar + 1 plato) → dots de RONDA

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

// Anti-repetición entre cargas/niños: recuerda alimentos vistos para que cada
// partida salga distinta.
const RECENT_KEY = "edinun_ccn_comida_recientes_v1";
function getRecent() {
  try { const r = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); return Array.isArray(r) ? r : []; }
  catch (e) { return []; }
}
function pushRecent(ids) {
  const prev = getRecent().filter((id) => ids.indexOf(id) === -1);
  const next = ids.concat(prev).slice(0, 10);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch (e) {}
}

// Fase 1: N alimentos con MEZCLA (al menos 1 sano + 1 chatarra), evitando recientes.
function pickClassify(n) {
  const recent = new Set(getRecent());
  const healthy = shuffle(HEALTHY_IDS.filter((i) => !recent.has(i))).concat(shuffle(HEALTHY_IDS.filter((i) => recent.has(i))));
  const junk = shuffle(JUNK_IDS.filter((i) => !recent.has(i))).concat(shuffle(JUNK_IDS.filter((i) => recent.has(i))));
  const pick = [healthy[0], junk[0]];
  const rest = shuffle(healthy.slice(1).concat(junk.slice(1)));
  let k = 0;
  while (pick.length < n) pick.push(rest[k++]);
  return shuffle(pick.slice(0, n));
}

// Fase 2: bandeja del plato = PLATE_HEALTHY sanos + PLATE_JUNK chatarra, barajados.
function pickPlate() {
  const recent = new Set(getRecent());
  const healthy = shuffle(HEALTHY_IDS.filter((i) => !recent.has(i))).concat(shuffle(HEALTHY_IDS.filter((i) => recent.has(i))));
  const junk = shuffle(JUNK_IDS.filter((i) => !recent.has(i))).concat(shuffle(JUNK_IDS.filter((i) => recent.has(i))));
  return shuffle(healthy.slice(0, PLATE_HEALTHY).concat(junk.slice(0, PLATE_JUNK)));
}

// ─────────────────────────────────────────────────────────────
// Ficha de alimento (emoji + nombre).
// ─────────────────────────────────────────────────────────────
function FoodTile({ food, size, dim }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 18, border: "3px solid #f2c260",
      background: "linear-gradient(180deg,#fff8e6,#f7e3a8)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
      boxShadow: "0 8px 16px rgba(0,0,0,0.3), inset 0 -3px 0 rgba(0,0,0,0.10)",
      opacity: dim ? 0.32 : 1, userSelect: "none",
    }}>
      <span style={{ fontSize: Math.round(size * 0.44), lineHeight: 1 }}>{food.e}</span>
      <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: Math.max(9, Math.round(size * 0.12)), color: "#3a2608", lineHeight: 1 }}>{food.t}</span>
    </div>
  );
}

const TILE = 76;       // ficha en la bandeja (6 caben en una sola fila)
const PLATE_TILE = 58; // ficha dentro del plato

function GameScreen({ app, setApp, go }) {
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];

  const [phase, setPhase] = useStateG("clasificar"); // "clasificar" | "plato"

  // ── Fase 1 (clasificar) ──
  const [cFoods, setCFoods] = useStateG(() => pickClassify(N_CLASSIFY)); // ids del banco
  const [cIdx, setCIdx] = useStateG(0);
  const [answered, setAnswered] = useStateG(false);
  const [picked, setPicked] = useStateG(null); // "si" | "no"

  // ── Fase 2 (plato) ──
  const [plateFoods, setPlateFoods] = useStateG(() => pickPlate());                  // ids del banco (6)
  const [placement, setPlacement] = useStateG(() => plateFoods.map(() => "tray"));   // "tray" | "plate" por índice local
  const placementRef = useRefG(placement); placementRef.current = placement;
  const [ghost, setGhost] = useStateG(null); // { localIdx, x, y } en coords lógicas
  const [reject, setReject] = useStateG(false);

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
  const doneRef = useRefG(false); // evita doble evaluación del plato

  useEffectG(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(id);
  }, []);

  // Recuerda los alimentos de esta partida → la próxima carga sale distinta.
  useEffectG(() => { pushRecent(cFoods.concat(plateFoods)); }, []);

  function formatTime(s) {
    const m = Math.floor(s / 60), ss = s % 60;
    return `${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }
  function markFirst() {
    if (!firstAct.current) { firstAct.current = true; if (typeof markFirstAttempt === "function") markFirstAttempt(); }
  }

  // ── FASE 1: clasificar (decisión única SÍ/NO) ──
  const curFood = FOODS[cFoods[cIdx]];
  const correctYN = curFood && curFood.ok ? "si" : "no";

  function onClassify(ans) {
    if (answered || phase !== "clasificar") return;
    markFirst();
    const isCorrect = ans === correctYN;
    setPicked(ans);
    setAnswered(true);
    if (isCorrect) setStars((s) => s + 1);

    const entry = {
      idx: cIdx + 1, kind: "clasificar", emoji: curFood.e, a: curFood.t,
      correctAnswer: curFood.ok ? "Sí, sano" : "No sano",
      userAnswer: ans === "si" ? "Sí, sano" : "No sano",
      isCorrect,
    };
    setLog((L) => [...L, entry]);

    const overlayDelay = isCorrect ? 350 : 1000; // al fallar, deja ver el revelado
    setTimeout(() => {
      setFeedback(isCorrect ? "ok" : "err");
      setFeedbackMsg(isCorrect
        ? "¡Muy bien! ⭐"
        : (curFood.ok ? `El ${curFood.t} SÍ es sano 🍎` : `El ${curFood.t} NO es sano 🍔`));
    }, overlayDelay);
    setTimeout(() => {
      setFeedback(null); setFeedbackMsg("");
      if (cIdx + 1 < N_CLASSIFY) {
        setCIdx(cIdx + 1); setAnswered(false); setPicked(null);
      } else {
        setPhase("plato"); // pasa a armar el plato
      }
    }, overlayDelay + 1400);
  }

  // Aro de revelado en los botones SÍ/NO (verde = correcto, rojo = elegido mal).
  function ynRing(ans) {
    const base = "0 8px 18px rgba(0,0,0,0.35), inset 0 -3px 0 rgba(0,0,0,0.12)";
    if (!answered) return base;
    if (ans === correctYN) return "0 0 0 4px #2ecc8f, " + base;
    if (ans === picked) return "0 0 0 4px #ff6b6b, " + base;
    return base;
  }
  function ynDim(ans) { return answered && ans !== correctYN && ans !== picked; }

  // ── FASE 2: arrastrar al plato ──
  function toLogical(clientX, clientY) {
    const r = rootRef.current.getBoundingClientRect();
    return { x: (clientX - r.left) * 900 / r.width, y: (clientY - r.top) * 540 / r.height };
  }

  function onTileDown(e, localIdx) {
    if (placementRef.current[localIdx] === "plate" || doneRef.current) return;
    markFirst();
    e.preventDefault();
    const cardRect = e.currentTarget.getBoundingClientRect();
    const tl = toLogical(cardRect.left, cardRect.top);
    const p = toLogical(e.clientX, e.clientY);
    const off = { x: p.x - tl.x, y: p.y - tl.y };
    setGhost({ localIdx, x: tl.x, y: tl.y });
    const onMove = (ev) => {
      const q = toLogical(ev.clientX, ev.clientY);
      setGhost((g) => (g ? { ...g, x: q.x - off.x, y: q.y - off.y } : g));
    };
    const onUp = (ev) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      handleDrop(ev, localIdx);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  function handleDrop(ev, localIdx) {
    setGhost(null);
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const onPlate = el && el.closest ? el.closest("[data-plate]") : null;
    if (!onPlate) return; // soltó fuera del plato → vuelve solo a la bandeja
    const foodId = plateFoods[localIdx];
    if (FOODS[foodId].ok) {
      const next = placementRef.current.slice();
      next[localIdx] = "plate";
      placementRef.current = next;
      setPlacement(next);
      checkPlate(next);
    } else {
      // chatarra: rebota y avisa
      setReject(true);
      setTimeout(() => setReject(false), 1200);
    }
  }

  function checkPlate(next) {
    const healthyPlaced = next.filter((loc, i) => loc === "plate" && FOODS[plateFoods[i]].ok).length;
    if (healthyPlaced >= PLATE_HEALTHY && !doneRef.current) finishPlate();
  }

  function finishPlate() {
    doneRef.current = true;
    const finalStars = starsRef.current + 1; // el plato suma 1 ⭐
    setStars(finalStars);
    const plateEntry = {
      idx: N_CLASSIFY + 1, kind: "plato", emoji: "🍽️", a: "Arma tu plato",
      correctAnswer: "Solo comida sana", userAnswer: "Plato sano", isCorrect: true,
    };
    const finalLog = logRef.current.concat([plateEntry]);
    setLog(finalLog);
    const solved = finalLog.filter((e) => e.isCorrect).length;
    setFeedback("ok");
    setFeedbackMsg("¡Plato saludable! 🥗");
    if (typeof incrementGamesCompleted === "function") incrementGamesCompleted();
    setApp((s) => ({
      ...s,
      stars: finalStars,
      lastResult: {
        category: CAT_LABEL,
        solved,
        total: N,
        time: Math.floor((Date.now() - started.current) / 1000),
        starsEarned: finalStars,
        log: finalLog,
      },
    }));
    setTimeout(() => go("results"), 1800);
  }

  function confirmRestart() {
    setConfirmingRestart(false);
    const c = pickClassify(N_CLASSIFY);
    const p = pickPlate();
    pushRecent(c.concat(p));
    setCFoods(c); setPlateFoods(p);
    setPlacement(p.map(() => "tray")); placementRef.current = p.map(() => "tray");
    setPhase("clasificar"); setCIdx(0); setAnswered(false); setPicked(null);
    setGhost(null); setReject(false); doneRef.current = false;
    setStars(0); setLog([]); setFeedback(null); setFeedbackMsg("");
    firstAct.current = false;
    started.current = Date.now();
  }

  // Bocadillo del guía (estable; reacciona al revelar / rechazar).
  const bocadillo = phase === "clasificar"
    ? (!answered ? "¿Este alimento es sano?" : (picked === correctYN ? "¡Muy bien!" : "¡Casi! Mira la respuesta."))
    : (reject ? "¡Esa no es sana!" : "Pon en el plato solo lo sano.");

  const draggingIdx = ghost ? ghost.localIdx : null;
  const healthyPlaced = placement.filter((loc, i) => loc === "plate" && FOODS[plateFoods[i]].ok).length;

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
        {Array.from({ length: N }).map((_, i) => {
          const done = i < log.length;
          const ok = done && log[i] && log[i].isCorrect;
          const current = i === log.length;
          return (
            <div key={i} style={{
              width: 11, height: 11, borderRadius: "50%",
              background: done ? (ok ? "#fce9a8" : "#ff6b6b") : (current ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.2)"),
              boxShadow: done ? "0 0 8px currentColor" : "none",
              color: ok ? "#fce9a8" : "#ff6b6b",
            }} />
          );
        })}
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
        {phase === "clasificar" ? (
          <React.Fragment>
            {/* Enunciado */}
            <div style={{ textAlign: "center", fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 23, lineHeight: 1.15, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", pointerEvents: "none", maxWidth: 470 }}>
              ¿Es saludable este alimento?
            </div>

            {/* Carta del alimento */}
            <div key={cIdx} data-ok={curFood.ok ? "1" : "0"} style={{ animation: "ed-pop-in 0.25s" }}>
              <FoodTile food={curFood} size={150} />
            </div>

            {/* Botones SÍ / NO */}
            <div style={{ display: "flex", gap: 16 }}>
              <button onClick={() => onClassify("si")} disabled={answered} title="Sí, es saludable"
                style={{ width: 168, height: 60, borderRadius: 16, border: "3px solid #2f9e54", cursor: answered ? "default" : "pointer",
                  background: "linear-gradient(180deg,#a7e8be,#5cc47e)", color: "#0a3a1e",
                  fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 17, letterSpacing: "0.02em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: ynRing("si"), transition: "all 0.2s ease", opacity: ynDim("si") ? 0.45 : 1 }}>
                <span style={{ fontSize: 24 }}>✅</span>SÍ, SANO
              </button>
              <button onClick={() => onClassify("no")} disabled={answered} title="No es saludable"
                style={{ width: 168, height: 60, borderRadius: 16, border: "3px solid #d15454", cursor: answered ? "default" : "pointer",
                  background: "linear-gradient(180deg,#ffc1c1,#ef8a8a)", color: "#5a0e0e",
                  fontFamily: "var(--ed-font-display)", fontWeight: 800, fontSize: 17, letterSpacing: "0.02em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: ynRing("no"), transition: "all 0.2s ease", opacity: ynDim("no") ? 0.45 : 1 }}>
                <span style={{ fontSize: 24 }}>❌</span>NO SANO
              </button>
            </div>
          </React.Fragment>
        ) : (
          <React.Fragment>
            {/* Enunciado */}
            <div style={{ textAlign: "center", fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 22, lineHeight: 1.15, color: "#fff", textShadow: "0 2px 6px rgba(0,0,0,0.55)", pointerEvents: "none", maxWidth: 480 }}>
              Arrastra <span style={{ color: "#fce9a8" }}>solo la comida sana</span> al plato.
            </div>

            {/* Plato (zona de soltado) */}
            <div data-plate="1" style={{
              width: 232, height: 178, borderRadius: "50%",
              background: reject ? "radial-gradient(circle at 50% 38%, #ffd9d9, #f3b6b6)" : "radial-gradient(circle at 50% 38%, #ffffff, #e7eef5)",
              border: "8px solid #cfd8e3", boxShadow: "0 12px 26px rgba(0,0,0,0.35), inset 0 -6px 0 rgba(0,0,0,0.06)",
              display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", justifyContent: "center", padding: 16,
              transition: "background 0.2s ease",
            }}>
              {placement.map((loc, i) => loc === "plate" ? (
                <div key={i} style={{ animation: "ed-pop-in 0.2s" }}>
                  <FoodTile food={FOODS[plateFoods[i]]} size={PLATE_TILE} />
                </div>
              ) : null)}
              {healthyPlaced === 0 && (
                <span style={{ fontFamily: "var(--ed-font-ui)", fontSize: 13, color: "#8a93a3", fontWeight: 700 }}>tu plato</span>
              )}
            </div>

            {/* Bandeja con alimentos para arrastrar */}
            <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", flexWrap: "nowrap", padding: "8px 10px", borderRadius: 20, background: "rgba(0,0,0,0.22)", border: "1.5px solid rgba(242,194,96,0.25)" }}>
              {plateFoods.map((foodId, i) => {
                if (placement[i] === "plate") {
                  return <div key={i} style={{ width: TILE, height: TILE, borderRadius: 16, border: "2px dashed rgba(255,255,255,0.12)" }} />;
                }
                if (i === draggingIdx) {
                  return <div key={i} style={{ width: TILE, height: TILE }}><FoodTile food={FOODS[foodId]} size={TILE} dim /></div>;
                }
                return (
                  <div key={i} data-tile={FOODS[foodId].t} data-ok={FOODS[foodId].ok ? "1" : "0"} onPointerDown={(e) => onTileDown(e, i)} style={{ touchAction: "none", cursor: "grab" }}>
                    <FoodTile food={FOODS[foodId]} size={TILE} />
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

      {/* ── Ficha fantasma que sigue al dedo/cursor (Fase 2) ── */}
      {ghost && (
        <div style={{ position: "absolute", left: ghost.x, top: ghost.y, width: TILE, height: TILE, pointerEvents: "none", zIndex: 2000, transform: "scale(1.08)" }}>
          <FoodTile food={FOODS[plateFoods[ghost.localIdx]]} size={TILE} />
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
              <p className="ed-body" style={{ marginBottom: 16, fontSize: 14 }}>Salen otros alimentos.</p>
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
          <div style={printStyles.cell}><div style={printStyles.cellL}>Ejercicios</div><div style={printStyles.cellV}>{attemptedCount} / {res.total}</div></div>
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
            ¡Bien comido!
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
            <SummaryCell label="Ejercicios" value={`${attemptedCount} / ${totalEx}`} />
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
