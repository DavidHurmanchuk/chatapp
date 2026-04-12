"use client";

export default function ChatInput({
  input,
  onChange,
  onSend,
  sending,
  activeChannel,
  inputRef,
  aiTrigger,
}) {
  const isGroupAI = activeChannel?.type === "group_ai";

  const placeholder = !activeChannel
    ? "Select a conversation…"
    : activeChannel.type === "ai"
      ? "Message AI Assistant…"
      : isGroupAI
        ? `Message… (${aiTrigger ?? "/groq"} for AI)`
        : `Message ${activeChannel.name ?? ""}…`;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleChange = (e) => {
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
    if (e.target.value === "") e.target.style.height = "auto";
    onChange(e);
  };

  const canSend = input.trim() && !sending && activeChannel;

  return (
    <div className="px-4 pt-2.5 pb-4 bg-bg-sidebar border-t border-line shrink-0">
      <div className="flex items-end gap-2.5 bg-bg-surface border border-line rounded-2xl px-4 py-2 focus-within:border-brand/40 transition-colors">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={!activeChannel || sending}
          rows={1}
          placeholder={placeholder}
          className="flex-1 bg-transparent border-none outline-none text-txt-primary text-[14.5px] leading-relaxed resize-none placeholder-txt-muted py-1 max-h-[140px]"
          style={{ fontFamily: "'Syne', sans-serif" }}
        />

        <button
          onClick={onSend}
          disabled={!canSend}
          className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center border-none transition-all duration-200 ${canSend ? "bg-gradient-to-br from-brand to-violet-500 cursor-pointer scale-100" : "bg-bg-raised cursor-default scale-90"}`}
        >
          {sending ? (
            <span className="w-3.5 h-3.5 rounded-full border-2 border-txt-muted border-t-txt-primary animate-spin block" />
          ) : (
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke={canSend ? "#fff" : "#4a5570"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>

      {isGroupAI && (
        <p className="text-[11px] text-txt-dim mt-1.5 pl-1">
          Use <span className="text-group-ai">{aiTrigger ?? "/groq"}</span> to
          trigger AI
        </p>
      )}
    </div>
  );
}
