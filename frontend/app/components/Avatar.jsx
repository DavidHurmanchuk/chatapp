const PALETTES = [
  "from-blue-950 to-blue-600/30 border-blue-500/30 text-blue-400",
  "from-emerald-950 to-emerald-600/30 border-emerald-500/30 text-emerald-400",
  "from-red-950 to-red-600/30 border-red-500/30 text-red-400",
  "from-yellow-950 to-yellow-600/30 border-yellow-500/30 text-yellow-400",
  "from-violet-950 to-violet-600/30 border-violet-500/30 text-violet-400",
  "from-sky-950 to-sky-600/30 border-sky-500/30 text-sky-400",
  "from-orange-950 to-orange-600/30 border-orange-500/30 text-orange-400",
  "from-fuchsia-950 to-fuchsia-600/30 border-fuchsia-500/30 text-fuchsia-400",
];

export default function Avatar({ name, size = 36, isAI = false }) {
  const initials = name?.slice(0, 2).toUpperCase() ?? "??";
  const pal = PALETTES[(name?.charCodeAt(0) ?? 0) % PALETTES.length];
  const fontSize = Math.round(size * 0.38);

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold shrink-0 border-2 bg-gradient-to-br ${isAI ? "from-emerald-600 to-emerald-400 border-emerald-500/30 text-white" : pal}`}
      style={{
        width: size,
        height: size,
        fontSize,
        letterSpacing: "-0.03em",
        fontFamily: "'Syne', sans-serif",
      }}
    >
      {isAI ? "✦" : initials}
    </div>
  );
}
