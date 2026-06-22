// game-screens.jsx — Mecánica del juego + pantalla de resultados.
// PLANTILLA genérica de opción múltiple para Ciencias Naturales.
//
// Reemplaza DEMO_PREGUNTAS y, si necesitas otra mecánica (arrastrar, ordenar,
// clasificar, etc.), reescribe GameScreen conservando el CONTRATO con el shell:
//   · GameScreen({ app, setApp, go })  — al terminar: go("results")
//   · ResultsScreen({ app, setApp, go })
//   · expón ambos en window al final (Object.assign).
//   · llama markFirstAttempt() en la PRIMERA respuesta del niño (cuenta visita).
//   · llama incrementGamesCompleted() al completar el juego.
//
// Invariantes de diseño EDINUN (ver USER.md y memory/):
//   · Fallar NO baja el progreso ya ganado — solo no suma.
//   · Al fallar, revelar la respuesta correcta Y dejar ver lo que eligió el niño.
//   · Acciones destructivas (salir) SIEMPRE con modal de confirmación.
//   · Copy corto, accionable, sin jerga.

const { useState: useStateG, useEffect: useEffectG, useRef: useRefG } = React;

// ─────────────────────────────────────────────────────────────
// Banco de preguntas DEMO — REEMPLAZAR por el contenido real del juego.
// Formato: { enunciado, emoji, opciones:[...], correcta:idxCorrecto, pista }
// ─────────────────────────────────────────────────────────────
const DEMO_PREGUNTAS = [
  {
    enunciado: "¿Qué parte de la planta absorbe el agua del suelo?",
    emoji: "🌱",
    opciones: ["La raíz", "La flor", "La hoja", "El fruto"],
    correcta: 0,
    pista: "Está bajo tierra.",
  },
  {
    enunciado: "¿En qué estado está el agua cuando es hielo?",
    emoji: "🧊",
    opciones: ["Líquido", "Sólido", "Gaseoso", "Plasma"],
    correcta: 1,
    pista: "Es duro y frío.",
  },
  {
    enunciado: "¿Qué astro nos da luz y calor durante el día?",
    emoji: "☀️",
    opciones: ["La Luna", "Una estrella fugaz", "El Sol", "Un cometa"],
    correcta: 2,
    pista: "Es una estrella.",
  },
  {
    enunciado: "¿Qué necesitan los seres vivos para respirar?",
    emoji: "💨",
    opciones: ["Arena", "Oxígeno", "Plástico", "Hierro"],
    correcta: 1,
    pista: "Está en el aire.",
  },
  {
    enunciado: "¿Cuál de estos es un animal mamífero?",
    emoji: "🐬",
    opciones: ["El pez", "La rana", "El delfín", "La serpiente"],
    correcta: 2,
    pista: "Toma aire en la superficie y amamanta a sus crías.",
  },
];

function fmtTime(totalSec) {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────────────────────
// 3. PANTALLA DE JUEGO
// ─────────────────────────────────────────────────────────────
function GameScreen({ app, setApp, go }) {
  const preguntas = DEMO_PREGUNTAS;
  const total = preguntas.length;

  const [idx, setIdx] = useStateG(0);
  const [picked, setPicked] = useStateG(null);   // índice elegido (o null)
  const [aciertos, setAciertos] = useStateG(0);
  const [elapsed, setElapsed] = useStateG(0);     // segundos
  const [showExit, setShowExit] = useStateG(false);

  const startRef = useRefG(Date.now());

  // Timer ⏱ — se detiene cuando el modal de salida está abierto.
  useEffectG(() => {
    if (showExit) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [showExit]);

  const q = preguntas[idx];
  const answered = picked !== null;
  const isCorrect = answered && picked === q.correcta;

  function answerTap(i) {
    if (answered) return;        // ya respondió esta pregunta
    markFirstAttempt();          // cuenta la visita en el primer intento real
    setPicked(i);
    if (i === q.correcta) {
      setAciertos((a) => a + 1);
      setApp((s) => ({ ...s, stars: (s.stars || 0) + 1 }));
    }
    // Fallar NO resta estrellas ni progreso (invariante EDINUN).
  }

  function next() {
    if (idx + 1 < total) {
      setIdx(idx + 1);
      setPicked(null);
      return;
    }
    // Fin del juego → guardar resultados y pasar a resultados.
    const tiempo = Math.floor((Date.now() - startRef.current) / 1000);
    incrementGamesCompleted();
    setApp((s) => ({
      ...s,
      lastAciertos: aciertos,
      lastTotal: total,
      lastTimeSec: tiempo,
    }));
    go("results");
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* ── HUD ── */}
      <div style={{ position: "absolute", top: 16, left: 22, display: "flex", alignItems: "center", gap: 12 }}>
        <EdinunLogoMini size={42} />
        <div className="ed-chip ed-chip-basic" style={{ fontSize: 12, padding: "4px 12px" }}>
          Pregunta {idx + 1}/{total}
        </div>
      </div>
      <div style={{ position: "absolute", top: 16, right: 22, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(10,6,35,0.7)", padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(79,216,255,0.35)" }}>
          <span style={{ fontSize: 14 }}>⏱</span>
          <span style={{ fontFamily: "var(--ed-font-mono)", fontWeight: 600, fontSize: 13, color: "#4fd8ff" }}>{fmtTime(elapsed)}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(10,6,35,0.7)", padding: "5px 12px", borderRadius: 999, border: "1px solid rgba(242,194,96,0.35)" }}>
          <span style={{ fontSize: 15 }}>⭐</span>
          <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 14, color: "#fce9a8" }}>{app.stars || 0}</span>
        </div>
        <button className="ed-btn ed-btn-ghost" onClick={() => setShowExit(true)} style={{ padding: "6px 12px", fontSize: 13 }}>
          ← Salir
        </button>
      </div>

      {/* ── Cuerpo: enunciado + opciones ── */}
      <div style={{
        position: "absolute", inset: "76px 40px 28px 40px",
        display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 28, alignItems: "center",
      }}>
        {/* Enunciado */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 14 }}>
          <div style={{ fontSize: 96, lineHeight: 1, filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.4))" }}>{q.emoji}</div>
          <h2 className="ed-h1" style={{ fontSize: 26, lineHeight: 1.2, maxWidth: 360 }}>{q.enunciado}</h2>
          {!answered && (
            <div className="ed-body" style={{ fontSize: 13, fontStyle: "italic", color: "rgba(246,241,255,0.6)" }}>
              💡 {q.pista}
            </div>
          )}
        </div>

        {/* Opciones */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {q.opciones.map((op, i) => {
              const correctOne = i === q.correcta;
              // Estado visual tras responder:
              //   · la correcta SIEMPRE en verde (revela la respuesta)
              //   · la que eligió el niño, si es incorrecta, en rojo
              let ring = "var(--ed-shadow-card)";
              let bg;
              if (answered) {
                if (correctOne) {
                  ring = "var(--ed-shadow-card), 0 0 0 2px #5fe39a, 0 0 24px rgba(95,227,154,0.4)";
                  bg = "rgba(36,98,68,0.55)";
                } else if (i === picked) {
                  ring = "var(--ed-shadow-card), 0 0 0 2px #ff6b6b, 0 0 24px rgba(255,107,107,0.35)";
                  bg = "rgba(110,38,44,0.5)";
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => answerTap(i)}
                  className="ed-card"
                  disabled={answered}
                  style={{
                    padding: "16px 14px",
                    fontFamily: "var(--ed-font-display)", fontWeight: 600, fontSize: 17,
                    cursor: answered ? "default" : "pointer",
                    boxShadow: ring,
                    background: bg,
                    transition: "all 0.15s ease",
                    textAlign: "center",
                  }}
                >
                  {op}
                </button>
              );
            })}
          </div>

          {/* Feedback + continuar */}
          {answered && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              marginTop: 4, padding: "10px 16px", borderRadius: 14,
              background: isCorrect ? "rgba(36,98,68,0.4)" : "rgba(110,38,44,0.35)",
              border: `1px solid ${isCorrect ? "rgba(95,227,154,0.5)" : "rgba(255,107,107,0.45)"}`,
            }}>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 15, color: isCorrect ? "#9af5c4" : "#ffc1c1" }}>
                {isCorrect ? "¡Correcto! 🎉" : `Respuesta: ${q.opciones[q.correcta]}`}
              </div>
              <button className="ed-btn ed-btn-primary" onClick={next} style={{ padding: "8px 22px", fontSize: 15 }}>
                {idx + 1 < total ? "Siguiente →" : "Terminar →"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal de salida (acción destructiva → confirmar) ── */}
      {showExit && (
        <div style={{
          position: "absolute", inset: 0, zIndex: 50,
          background: "rgba(5,2,20,0.72)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div className="ed-card" style={{ padding: 28, maxWidth: 360, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🚪</div>
            <h3 className="ed-h1" style={{ fontSize: 22, marginBottom: 6 }}>¿Salir del juego?</h3>
            <p className="ed-body" style={{ fontSize: 14, marginBottom: 18 }}>Perderás esta ronda.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button className="ed-btn ed-btn-ghost" onClick={() => setShowExit(false)} style={{ padding: "10px 20px" }}>
                Seguir jugando
              </button>
              <button className="ed-btn ed-btn-primary" onClick={() => go("home")} style={{ padding: "10px 20px" }}>
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. PANTALLA DE RESULTADOS
// ─────────────────────────────────────────────────────────────
function ResultsScreen({ app, setApp, go }) {
  const aciertos = app.lastAciertos || 0;
  const total = app.lastTotal || DEMO_PREGUNTAS.length;
  const tiempo = app.lastTimeSec || 0;
  const char = CHARACTERS.find((c) => c.id === app.character) || CHARACTERS[0];
  const perfecto = aciertos === total;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 16, left: 22, display: "flex", alignItems: "center", gap: 10 }}>
        <EdinunLogoMini size={42} />
        <span style={{ fontFamily: "var(--ed-font-display)", fontWeight: 600, color: "#f2c260" }}>EDINUN</span>
      </div>

      <div style={{
        position: "absolute", inset: "70px 40px 28px 40px",
        display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 28, alignItems: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <char.Component size={230} floating />
          <div className="ed-body" style={{ maxWidth: 280, textAlign: "center", fontStyle: "italic", fontSize: 13 }}>
            "{char.quote}"
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <div className="ed-label" style={{ color: "#4fd8ff", marginBottom: 6 }}>
              {perfecto ? "¡Puntaje perfecto!" : "¡Buen trabajo!"}
            </div>
            <h1 className="ed-h1" style={{ fontSize: 38, lineHeight: 1.05 }}>
              {perfecto ? "¡Excelente, " : "¡Bien hecho, "}
              <span style={{ color: "#fce9a8" }}>{app.studentName || "Estudiante"}</span>!
            </h1>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            <div className="ed-card" style={{ flex: 1, padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(246,241,255,0.6)", marginBottom: 4 }}>Aciertos</div>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 30, color: "#5fe39a" }}>
                {aciertos}<span style={{ fontSize: 18, color: "rgba(246,241,255,0.5)" }}>/{total}</span>
              </div>
            </div>
            <div className="ed-card" style={{ flex: 1, padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(246,241,255,0.6)", marginBottom: 4 }}>Tiempo</div>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 30, color: "#4fd8ff" }}>
                {fmtTime(tiempo)}
              </div>
            </div>
            <div className="ed-card" style={{ flex: 1, padding: "16px 18px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "rgba(246,241,255,0.6)", marginBottom: 4 }}>Estrellas</div>
              <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, fontSize: 30, color: "#fce9a8" }}>
                ⭐ {app.stars || 0}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
            <button className="ed-btn ed-btn-primary" onClick={() => go("game")} style={{ flex: 1, height: 52, fontSize: 16 }}>
              JUGAR OTRA RONDA →
            </button>
            <button className="ed-btn ed-btn-ghost" onClick={() => go("home")} style={{ padding: "0 24px", height: 52, fontSize: 15 }}>
              INICIO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GameScreen, ResultsScreen });
