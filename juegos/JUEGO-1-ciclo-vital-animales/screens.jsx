// screens.jsx — Pantallas base del shell EDINUN GAMES (Ciencias Naturales).
// Importa (globalmente) CHARACTERS, EdinunLogo, EdinunLogoMini.
//
// PLANTILLA: este archivo es el shell compartido. Solo personaliza por juego
// los textos marcados con  // ← PERSONALIZAR  y los glifos del CosmosBg.
// La lógica del contador de visitas NO se toca (es idéntica en todos los juegos).

const { useState, useEffect, useRef, useMemo } = React;

// ─────────────────────────────────────────────────────────────
// Fondo + glifos decorativos del tema (ciclo vital). Mismo patrón que la
// referencia edinun-language/juego-19: arrays {c,l,t,r,s} con emojis a color
// mezclados con algún símbolo, renderizados con .map.  // ← PERSONALIZAR
//   c = carácter/emoji · l/t = posición · r = rotación · s = fontSize (em)
// ─────────────────────────────────────────────────────────────
const CHALK_GLYPHS = [
  { c: "🥚", l: "5%",  t: "12%", r: "-8deg",  s: "0.55em" },
  { c: "🦋", l: "16%", t: "27%", r: "6deg",   s: "0.5em"  },
  { c: "🌿", l: "30%", t: "11%", r: "-5deg",  s: "0.46em" },
  { c: "🐝", l: "58%", t: "12%", r: "-4deg",  s: "0.48em" },
  { c: "🐣", l: "73%", t: "9%",  r: "8deg",   s: "0.55em" },
  { c: "🐛", l: "90%", t: "15%", r: "6deg",   s: "0.52em" },
  { c: "★",  l: "44%", t: "8%",  r: "4deg",   s: "0.5em"  },
  { c: "🐢", l: "3%",  t: "45%", r: "-6deg",  s: "0.55em" },
  { c: "🐸", l: "95%", t: "44%", r: "-8deg",  s: "0.52em" },
  { c: "🌸", l: "86%", t: "56%", r: "8deg",   s: "0.46em" },
  { c: "🐟", l: "7%",  t: "80%", r: "12deg",  s: "0.55em" },
  { c: "🌸", l: "30%", t: "86%", r: "-4deg",  s: "0.48em" },
  { c: "🐞", l: "66%", t: "88%", r: "5deg",   s: "0.5em"  },
  { c: "🍃", l: "82%", t: "80%", r: "-10deg", s: "0.5em"  },
];

const COSMIC_GLYPHS = [
  { c: "🦋", l: "5%",  t: "10%", r: "-8deg",  s: "0.6em"  },
  { c: "🐣", l: "84%", t: "6%",  r: "6deg",   s: "0.62em" },
  { c: "🌸", l: "92%", t: "72%", r: "-12deg", s: "0.58em" },
  { c: "🐢", l: "3%",  t: "82%", r: "12deg",  s: "0.58em" },
  { c: "✦",  l: "46%", t: "4%",  r: "-4deg",  s: "0.5em"  },
  { c: "🐝", l: "7%",  t: "46%", r: "-4deg",  s: "0.52em" },
  { c: "★",  l: "88%", t: "40%", r: "8deg",   s: "0.5em"  },
  { c: "🥚", l: "22%", t: "22%", r: "10deg",  s: "0.5em"  },
  { c: "🐸", l: "70%", t: "22%", r: "-6deg",  s: "0.52em" },
  { c: "🐞", l: "32%", t: "70%", r: "8deg",   s: "0.5em"  },
  { c: "🌿", l: "62%", t: "78%", r: "-10deg", s: "0.52em" },
  { c: "✦",  l: "18%", t: "58%", r: "14deg",  s: "0.46em" },
  { c: "🐟", l: "78%", t: "56%", r: "-8deg",  s: "0.5em"  },
  { c: "🐛", l: "50%", t: "88%", r: "4deg",   s: "0.5em"  },
  { c: "★",  l: "40%", t: "38%", r: "-6deg",  s: "0.46em" },
  { c: "🌸", l: "12%", t: "33%", r: "6deg",   s: "0.48em" },
];

function CosmosBg({ variant = "cosmic", glyphSize }) {
  const glyphsStyle = glyphSize ? { fontSize: glyphSize + "px" } : undefined;
  if (variant === "chalkboard") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, #3a9b7a 0%, #1d6b53 55%, #0b3a2d 100%)",
          overflow: "hidden",
        }}
      >
        <div className="ed-glyphs" style={{ color: "rgba(255,255,255,0.10)", ...glyphsStyle }}>
          {CHALK_GLYPHS.map((g, i) => (
            <span key={i} style={{ left: g.l, top: g.t, "--rot": g.r, ...(g.s ? { fontSize: g.s } : {}) }}>{g.c}</span>
          ))}
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="ed-cosmos" />
      <div className="ed-glyphs" style={glyphsStyle}>
        {COSMIC_GLYPHS.map((g, i) => (
          <span key={i} style={{ left: g.l, top: g.t, "--rot": g.r, ...(g.s ? { fontSize: g.s } : {}) }}>{g.c}</span>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Contador de visitas — endpoint PHP del lado servidor con fallback localStorage.
// NO PERSONALIZAR: idéntico en todos los juegos del repo.
// En servidores con PHP (Apache de edinun.com) muestra el conteo global real.
// En GitHub Pages / servidor estático sin PHP, el .php se sirve como texto
// plano → el fetch falla parseando JSON → caemos al contador localStorage.
// ─────────────────────────────────────────────────────────────
const VISITOR_ENDPOINT = "counter.php"; // relativo a index.html del juego
const VISITOR_KEY = "edinun_visitors_v1";
const VISITOR_SESSION_FLAG = "edinun_visit_counted_v1";

async function fetchVisitorCount(opts) {
  const inc = opts && opts.increment;
  const url = inc ? VISITOR_ENDPOINT + "?inc=1" : VISITOR_ENDPOINT;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("counter http " + res.status);
  // Tolera dos contratos de servidor: JSON {"count": N} (counter.php de este
  // repo) o un numero plano "N". Si el .php se sirve como texto ("<?php...")
  // ambos parseos fallan -> NaN -> throw -> el cliente cae a localStorage.
  const text = (await res.text()).trim();
  let count;
  try {
    const data = JSON.parse(text);
    count = data && typeof data.count === "number" ? data.count : Number(data);
  } catch (e) {
    count = Number(text);
  }
  if (!Number.isFinite(count)) throw new Error("counter invalid payload");
  return count;
}

function readLocalVisitorCount() {
  const raw = localStorage.getItem(VISITOR_KEY);
  const v = raw ? parseInt(raw, 10) : 0;
  return isNaN(v) ? 0 : v;
}

function writeLocalVisitorCount(n) {
  localStorage.setItem(VISITOR_KEY, String(n));
}

function useVisitorCount() {
  const [n, setN] = useState(() => readLocalVisitorCount());

  useEffect(() => {
    let cancelled = false;
    fetchVisitorCount()
      .then((count) => {
        if (cancelled) return;
        setN(count);
        writeLocalVisitorCount(count);
      })
      .catch(() => { /* fallback localStorage ya cargado en el initializer */ });

    function onUpdate(ev) {
      const value = ev && ev.detail && ev.detail.count;
      if (typeof value === "number") setN(value);
      else setN(readLocalVisitorCount());
    }
    window.addEventListener("edinun:visitors-updated", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("edinun:visitors-updated", onUpdate);
    };
  }, []);

  return n;
}

function markFirstAttempt() {
  if (sessionStorage.getItem(VISITOR_SESSION_FLAG) === "1") return;
  sessionStorage.setItem(VISITOR_SESSION_FLAG, "1");

  fetchVisitorCount({ increment: true })
    .then((count) => {
      writeLocalVisitorCount(count);
      window.dispatchEvent(new CustomEvent("edinun:visitors-updated", { detail: { count } }));
    })
    .catch(() => {
      const next = readLocalVisitorCount() + 1;
      writeLocalVisitorCount(next);
      window.dispatchEvent(new CustomEvent("edinun:visitors-updated", { detail: { count: next } }));
    });
}

function PeopleIcon({ size = 18, color = "#fce9a8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="7" r="3" fill={color} />
      <circle cx="16" cy="7" r="3" fill={color} opacity="0.85" />
      <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6v1H2v-1z" fill={color} />
      <path d="M14 20c0-2 -.7-3.8-1.8-5.2 1-.5 2.1-.8 3.3-.8 3.3 0 6 2.7 6 6v1H14v-1z" fill={color} opacity="0.85" />
    </svg>
  );
}

function incrementGamesCompleted() {
  const KEY = "edinun_games_completed_v1";
  const raw = localStorage.getItem(KEY);
  const next = (raw ? parseInt(raw, 10) : 0) + 1;
  localStorage.setItem(KEY, String(next));
  window.dispatchEvent(new Event("edinun:games-updated"));
  return next;
}

// ─────────────────────────────────────────────────────────────
// 1. PANTALLA DE INICIO
// ─────────────────────────────────────────────────────────────
function HomeScreen({ app, setApp, go }) {
  const visitors = useVisitorCount();
  const [name, setName] = useState(app.studentName || "");
  const [level, setLevel] = useState(app.level || "basic");

  function start() {
    if (!name.trim()) return;
    setApp((s) => ({
      ...s,
      studentName: name.trim(),
      level,
      sessionStart: Date.now(),
    }));
    go("character");
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          bottom: 18,
          right: 22,
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(10,6,35,0.55)",
          border: "1px solid rgba(242,194,96,0.3)",
          borderRadius: 999,
          padding: "6px 12px",
          backdropFilter: "blur(8px)",
        }}
      >
        <PeopleIcon size={16} color="#fce9a8" />
        <div style={{ fontFamily: "var(--ed-font-mono)", fontSize: 11, color: "#f2c260", letterSpacing: "0.06em" }}>
          {visitors.toLocaleString("es-CO")}
          <span style={{ color: "rgba(246,241,255,0.55)", marginLeft: 6 }}>visitas</span>
        </div>
      </div>

      <div
        style={{
          position: "absolute", inset: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1.15fr",
          alignItems: "center",
          padding: "40px 56px",
          gap: 40,
        }}
      >
        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <EdinunLogo size={300} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 520 }}>
          <div>
            <div className="ed-label" style={{ color: "#4fd8ff", marginBottom: 8 }}>
              EDINUN · Ciclo vital de los animales {/* ← PERSONALIZAR: tema del juego */}
            </div>
            <h1 className="ed-h1" style={{ fontSize: 44, lineHeight: 1.05 }}>
              ¡Bienvenido/a,{" "}
              <span style={{
                background: "linear-gradient(180deg,#fce9a8,#d9a441)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: 600,
              }}>
                Estudiante!
              </span>
            </h1>
          </div>

          <div style={{
            padding: "14px 18px",
            borderRadius: 14,
            background: "rgba(10,6,35,0.55)",
            border: "1px solid rgba(148,120,255,0.3)",
            fontFamily: "var(--ed-font-display)", fontWeight: 600,
            fontSize: 15, lineHeight: 1.4,
            color: "#fce9a8",
            textAlign: "center",
          }}>
            ¿Cómo nacen y crecen los animales? 🐣 {/* ← PERSONALIZAR: subtítulo corto */}
          </div>

          <div>
            <div className="ed-label" style={{ marginBottom: 10 }}>
              Escribe tu nombre y entra
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: 1, position: "relative" }}>
                <input
                  className="ed-input"
                  placeholder="Escribe tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && start()}
                />
              </div>
              <button className="ed-btn ed-btn-primary" onClick={start} disabled={!name.trim()}
                style={{ height: 52, padding: "0 28px", fontSize: 16, opacity: name.trim() ? 1 : 0.5 }}>
                ENTRAR →
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. SELECCIÓN DE PERSONAJE
// ─────────────────────────────────────────────────────────────
function CharacterScreen({ app, setApp, go }) {
  const [sel, setSel] = useState(app.character || "astronauta");
  const current = CHARACTERS.find((c) => c.id === sel) || CHARACTERS[0];

  function choose() {
    // Juego de nivel único.  // ← PERSONALIZAR: categoría/etiqueta del tema
    setApp((s) => ({
      ...s,
      character: sel,
      currentCategory: "ciclo-vital",
      currentCatLabel: "Ciclo vital de los animales",
    }));
    go("game");
  }

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 18, left: 24, right: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button className="ed-btn ed-btn-ghost" onClick={() => go("home")} style={{ padding: "8px 14px" }}>
          ← VOLVER
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 700, color: "#fce9a8", fontSize: 20, textShadow: "0 2px 6px rgba(0,0,0,0.45)" }}>
            Hola, {app.studentName || "Estudiante"} 👋
          </div>
          <EdinunLogoMini size={64} />
        </div>
      </div>

      <div style={{
        position: "absolute", inset: "92px 32px 24px 32px",
        display: "grid", gridTemplateColumns: "1fr 1.05fr", gap: 24, alignItems: "center",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, minWidth: 0 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)",
              width: 220, height: 28, borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(242,194,96,0.45), transparent 70%)",
              filter: "blur(5px)",
            }} />
            <current.Component size={280} floating />
          </div>
          <div style={{ textAlign: "center", marginTop: 4 }}>
            <h2 className="ed-h1" style={{ fontSize: 28, lineHeight: 1 }}>{current.name}</h2>
            <div className="ed-label" style={{ color: "#fce9a8", marginTop: 2, fontSize: 10 }}>{current.title}</div>
            <div className="ed-body" style={{ marginTop: 6, maxWidth: 320, fontStyle: "italic", fontSize: 13, lineHeight: 1.35 }}>
              "{current.quote}"
            </div>
          </div>
        </div>

        <div>
          <div className="ed-label" style={{ marginBottom: 10 }}>Elige tu guía</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {CHARACTERS.map((c) => {
              const active = sel === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSel(c.id)}
                  className="ed-card"
                  style={{
                    padding: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    transform: active ? "translateY(-2px)" : "none",
                    boxShadow: active
                      ? "var(--ed-shadow-card), 0 0 0 2px rgba(79,216,255,0.7), 0 0 30px rgba(79,216,255,0.35)"
                      : "var(--ed-shadow-card)",
                    transition: "all 0.18s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 68, height: 68, flexShrink: 0 }}>
                      <c.Component size={68} floating={false} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--ed-font-display)", fontWeight: 600, fontSize: 18 }}>
                        {c.name}
                      </div>
                      <div className="ed-label" style={{ fontSize: 10, color: "#4fd8ff" }}>
                        {c.specialty}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={choose}
            className="ed-btn ed-btn-primary"
            style={{ marginTop: 20, width: "100%", height: 52, fontSize: 17 }}
          >
            ¡VAMOS, {current.name.toUpperCase()}! →
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, CharacterScreen, CosmosBg, incrementGamesCompleted, useVisitorCount, markFirstAttempt });
