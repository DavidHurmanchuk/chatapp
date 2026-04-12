export default function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-ai"
          style={{ animation: `tgDot 1.4s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes tgDot {
          0%,60%,100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
