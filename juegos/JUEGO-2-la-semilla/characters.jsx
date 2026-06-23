// characters.jsx — Personajes EDINUN GAMES.
// Renderizan los PNG de assets/char-<id>.png generados con Nano Banana.
// El componente expone la misma API que la versión SVG anterior
// (props `size`, `floating`) para no romper a los consumidores
// (GameScreen, CharacterScreen, ResultsScreen, ProfileScreen, CharacterAvatar).

// ─────────────────────────────────────────────────────────────
// Sparkles — chispas animadas alrededor del personaje. Sobreviven de
// la versión SVG porque dan vida y refuerzan la estética cósmica.
// ─────────────────────────────────────────────────────────────
function Sparkles({ color = "#fce9a8", count = 6, seed = 1 }) {
  const pts = Array.from({ length: count }, (_, i) => {
    const a = (i * 360) / count + seed * 37;
    const r = 70 + (i % 3) * 8;
    const x = 100 + Math.cos((a * Math.PI) / 180) * r;
    const y = 100 + Math.sin((a * Math.PI) / 180) * r;
    const s = 2 + (i % 3);
    return { x, y, s, delay: i * 0.35 };
  });
  return (
    <g>
      {pts.map((p, i) => (
        <g key={i} transform={`translate(${p.x} ${p.y})`}>
          <circle r={p.s} fill={color} opacity="0.9">
            <animate attributeName="opacity" values="0.3;1;0.3" dur="2.4s" begin={`${p.delay}s`} repeatCount="indefinite" />
          </circle>
        </g>
      ))}
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
// Fábrica de componentes — cada personaje es un PNG con sparkles
// superpuestos. Se exportan con los nombres que ya consume el resto
// de la app: AstronautaCharacter, NaturalistaCharacter, etc.
// ─────────────────────────────────────────────────────────────
function makeCharacter(id, sparkleColor, sparkleSeed) {
  return function Character({ size = 200, floating = true }) {
    return (
      <div
        className={floating ? "ed-float-soft" : ""}
        style={{
          width: size, height: size,
          position: "relative",
          display: "inline-block",
          lineHeight: 0,
        }}
      >
        <img
          src={`assets/char-${id}.png`}
          alt=""
          draggable="false"
          style={{
            width: "100%", height: "100%",
            objectFit: "contain",
            display: "block",
            filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.35))",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
        {/* Sparkles overlay — viewBox 200×200 para mantener las posiciones
            relativas idénticas a la versión SVG previa. */}
        <svg
          viewBox="0 0 200 200"
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          <Sparkles color={sparkleColor} count={6} seed={sparkleSeed} />
        </svg>
      </div>
    );
  };
}

const AstronautaCharacter = makeCharacter("astronauta", "#8fb8ff", 1);
const NaturalistaCharacter = makeCharacter("naturalista", "#86e57f", 2);
const QuimicaCharacter = makeCharacter("quimica", "#ff8fc7", 3);
const GeologoCharacter = makeCharacter("geologo", "#ffce6b", 4);

// ─────────────────────────────────────────────────────────────
// Avatar compacto (HUD / perfil / cards). Mantiene el marco circular
// dorado/violeta original y encuadra el PNG dentro.
// ─────────────────────────────────────────────────────────────
function CharacterAvatar({ char, size = 56 }) {
  const map = {
    astronauta: AstronautaCharacter,
    naturalista: NaturalistaCharacter,
    quimica: QuimicaCharacter,
    geologo: GeologoCharacter,
  };
  const C = map[char] || AstronautaCharacter;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "radial-gradient(circle at 30% 30%, rgba(138,90,242,.8), rgba(18,10,55,.95))",
      boxShadow: "inset 0 0 0 2px rgba(242,194,96,.8), 0 0 14px rgba(138,90,242,.45)",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      <div style={{ transform: `translateY(${size * 0.06}px) scale(1.15)` }}>
        <C size={size} floating={false} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Catálogo de personajes (id, nombre, frase, componente)
// ─────────────────────────────────────────────────────────────
const CHARACTERS = [
  {
    id: "astronauta",
    name: "Luna",
    title: "La Astronauta",
    specialty: "Exploradora del espacio",
    quote: "¡Vamos a viajar por los planetas!",
    Component: AstronautaCharacter,
  },
  {
    id: "naturalista",
    name: "Bruno",
    title: "El Naturalista",
    specialty: "Amigo de plantas y animales",
    quote: "¡Descubramos la naturaleza juntos!",
    Component: NaturalistaCharacter,
  },
  {
    id: "quimica",
    name: "Mía",
    title: "La Científica",
    specialty: "Maestra de los experimentos",
    quote: "¡Vamos a mezclar y descubrir!",
    Component: QuimicaCharacter,
  },
  {
    id: "geologo",
    name: "Tomi",
    title: "El Geólogo",
    specialty: "Explorador de rocas y volcanes",
    quote: "¡La Tierra esconde mil tesoros!",
    Component: GeologoCharacter,
  },
];

Object.assign(window, {
  AstronautaCharacter,
  NaturalistaCharacter,
  QuimicaCharacter,
  GeologoCharacter,
  CharacterAvatar,
  CHARACTERS,
});
