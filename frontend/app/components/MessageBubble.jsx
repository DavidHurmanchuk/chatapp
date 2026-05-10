"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Avatar from "./Avatar.jsx";
import TypingDots from "./TypingDots.jsx";

const QUICK = ["👍", "👎", "❤️", "🔥", "😂", "😮"];
const ALL = [
  "👍",
  "👎",
  "❤️",
  "🔥",
  "😂",
  "😮",
  "🎉",
  "👀",
  "💯",
  "🙏",
  "😍",
  "🤔",
  "😢",
  "😡",
  "🤯",
  "👏",
  "🫡",
  "💀",
  "🤝",
  "⚡",
  "✨",
  "🫶",
];

function fmt(d) {
  return d
    ? new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
}

function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", fn), 0);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute z-50 bottom-full right-0 mb-1.5 p-2 rounded-2xl flex flex-wrap gap-1"
      style={{
        width: 220,
        background: "#161b27",
        border: "1px solid #252d3d",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {ALL.map((e) => (
        <button
          key={e}
          onClick={() => {
            onSelect(e);
            onClose();
          }}
          className="w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer text-lg flex items-center justify-center hover:bg-bg-raised transition-colors"
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function Reactions({ reactions, onReact, myId, optimisticReactions }) {
  // Merge real reactions with optimistic ones
  const displayed = optimisticReactions ?? reactions;
  if (!displayed?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {displayed.map((r) => {
        const mine = r.users?.includes(myId);
        return (
          <button
            key={r.emoji}
            onClick={() => onReact(r.emoji)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[13px] border cursor-pointer transition-all ${mine ? "bg-brand-bg border-brand-border" : "bg-bg-raised border-line-strong"}`}
          >
            {r.emoji}
            <span
              className={`text-[11px] font-bold ${mine ? "text-brand" : "text-txt-secondary"}`}
            >
              {r.users?.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Markdown компоненти для AI повідомлень
const mdComponents = {
  p: ({ children }) => (
    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-txt-primary">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h1 className="text-base font-black mb-2 mt-3 first:mt-0 text-txt-primary">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[15px] font-black mb-1.5 mt-3 first:mt-0 text-txt-primary">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-bold mb-1 mt-2 first:mt-0 text-txt-primary">
      {children}
    </h3>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-4 mb-2 space-y-0.5">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-4 mb-2 space-y-0.5">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-ai pl-3 my-2 text-txt-secondary italic">
      {children}
    </blockquote>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code
        className="px-1.5 py-0.5 rounded-md text-[12.5px] font-mono"
        style={{ background: "#0a3028", color: "#00c896" }}
      >
        {children}
      </code>
    ) : (
      <pre
        className="rounded-xl p-3 my-2 overflow-x-auto text-[12.5px] font-mono"
        style={{ background: "#0a1a14", border: "1px solid #00c89630" }}
      >
        <code className="text-ai">{children}</code>
      </pre>
    ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand underline underline-offset-2 hover:text-brand-dark transition-colors"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-line-strong my-3" />,
  table: ({ children }) => (
    <div className="overflow-x-auto my-2">
      <table className="text-sm border-collapse w-full">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="px-3 py-1.5 text-left font-bold text-txt-primary border border-line-strong bg-bg-raised">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-1.5 border border-line-strong text-txt-secondary">
      {children}
    </td>
  ),
};

export default function MessageBubble({
  msg,
  prevMsg,
  currentUser,
  currentUserId,
  membersCount,
  onReact,
}) {
  const [hovered, setHovered] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [optimisticReacts, setOptimisticReacts] = useState(null);

  const isOwn = msg.sender === currentUser;
  const isAI = msg.sender === "AI Assistant";
  const sameSender = prevMsg?.sender === msg.sender;
  const isTemp = String(msg.id).startsWith("tmp-");
  const isTyping = msg.content === "__typing__";

  // Optimistic react  оновлюємо UI одразу, потім сервер підтверджує
  const handleReact = (emoji) => {
    const currentReacts = optimisticReacts ?? msg.reactions ?? [];
    const existing = currentReacts.find((r) => r.emoji === emoji);

    let next;
    if (existing) {
      const hasIt = existing.users?.includes(currentUserId);
      if (hasIt) {
        // Прибираємо реакцію
        const users = existing.users.filter((u) => u !== currentUserId);
        next =
          users.length === 0
            ? currentReacts.filter((r) => r.emoji !== emoji)
            : currentReacts.map((r) =>
                r.emoji === emoji ? { ...r, users } : r,
              );
      } else {
        next = currentReacts.map((r) =>
          r.emoji === emoji ? { ...r, users: [...r.users, currentUserId] } : r,
        );
      }
    } else {
      next = [...currentReacts, { emoji, users: [currentUserId] }];
    }

    setOptimisticReacts(next); // Одразу показуємо
    onReact(msg.id, emoji).catch(() => setOptimisticReacts(null)); // Rollback при помилці
  };

  useEffect(() => {
    setOptimisticReacts(null);
  }, [msg.reactions]);

  const readBy = msg.readBy ?? [];
  const allRead =
    !isTemp &&
    membersCount > 1 &&
    readBy.filter((id) => id !== currentUserId).length >= membersCount - 1;

  const bubbleClass = isOwn
    ? "bg-bubble-own border border-bubble-own-border"
    : isAI
      ? "bg-bubble-ai border border-bubble-ai-border"
      : "bg-bubble-other border border-bubble-other-border";

  const radiusClass = isOwn
    ? "bubble-own"
    : sameSender
      ? "bubble-same"
      : "bubble-other";

  return (
    <div
      className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : "flex-row"} items-start`}
      style={{ marginTop: sameSender ? 2 : 14 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-9 shrink-0">
        {!sameSender && !isOwn && (
          <Avatar name={msg.sender} size={36} isAI={isAI} />
        )}
      </div>

      <div
        className={`max-w-[72%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        {!sameSender && !isOwn && (
          <span
            className={`text-xs font-bold mb-1 ${isAI ? "text-ai" : "text-group-ai"}`}
          >
            {isAI ? "✦ AI Assistant" : msg.sender}
          </span>
        )}

        <div className="relative">
          {hovered && !isTyping && !isTemp && (
            <div
              className={`absolute top-0 z-50 flex items-center gap-1 px-1.5 py-1 rounded-full border border-line-strong ${isOwn ? "right-full mr-2" : "left-full ml-2"}`}
              style={{
                background: "#161b27",
                boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                whiteSpace: "nowrap",
              }}
            >
              {QUICK.map((e) => (
                <button
                  key={e}
                  onClick={() => handleReact(e)}
                  className="w-7 h-7 rounded-lg border-none bg-transparent cursor-pointer text-base flex items-center justify-center hover:bg-bg-raised transition-colors"
                >
                  {e}
                </button>
              ))}
              <div className="relative">
                <button
                  onClick={() => setShowPicker((v) => !v)}
                  className={`w-7 h-7 rounded-lg border-none cursor-pointer text-base font-bold flex items-center justify-center text-txt-muted hover:bg-bg-raised transition-colors ${showPicker ? "bg-bg-raised" : "bg-transparent"}`}
                >
                  +
                </button>
                {showPicker && (
                  <EmojiPicker
                    onSelect={(e) => {
                      handleReact(e);
                      setShowPicker(false);
                    }}
                    onClose={() => setShowPicker(false)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Bubble */}
          <div
            className={`${bubbleClass} ${radiusClass} ${isTemp ? "opacity-60" : ""} transition-opacity duration-200`}
          >
            {isTyping ? (
              <TypingDots />
            ) : isAI ? (
              // AI повідомлення — markdown
              <div className="px-3.5 py-2.5 text-[13.5px] text-txt-primary markdown-ai">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={mdComponents}
                >
                  {msg.content}
                </ReactMarkdown>
              </div>
            ) : (
              // Звичайне повідомлення — plain text
              <p className="px-3.5 py-2.5 text-[14px] leading-relaxed text-txt-primary break-words whitespace-pre-wrap">
                {msg.content}
              </p>
            )}
          </div>
        </div>

        <Reactions
          reactions={msg.reactions}
          onReact={handleReact}
          myId={currentUserId}
          optimisticReactions={optimisticReacts}
        />

        {!isTyping && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[11px] text-txt-dim">
              {isTemp ? "Sending…" : fmt(msg.created_at)}
            </span>
            {isOwn && !isAI && (
              <span
                className={`text-[13px] leading-none ${allRead ? "text-brand" : "text-txt-dim"}`}
              >
                {allRead ? "✓✓" : "✓"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
