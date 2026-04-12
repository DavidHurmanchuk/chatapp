"use client";

import { useEffect, useRef, useCallback } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function MessageList({
  messages,
  activeChannel,
  currentUser,
  currentUserId,
  membersCount,
  onReact,
  onLoadMore,
  hasMore,
  loadingMore,
}) {
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  const scrollRef = useRef(null);
  const prevScrollH = useRef(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!messages.length) {
      isFirstLoad.current = true;
      return;
    }
    if (isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
    } else {
      const el = scrollRef.current;
      if (!el) return;
      const isNearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      if (isNearBottom)
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleLoadMore = useCallback(() => {
    if (!onLoadMore || !hasMore || loadingMore) return;
    const el = scrollRef.current;
    if (el) prevScrollH.current = el.scrollHeight;
    onLoadMore();
  }, [onLoadMore, hasMore, loadingMore]);

  useEffect(() => {
    if (!loadingMore && prevScrollH.current && scrollRef.current) {
      const el = scrollRef.current;
      const diff = el.scrollHeight - prevScrollH.current;
      el.scrollTop += diff;
      prevScrollH.current = 0;
    }
  }, [loadingMore, messages.length]);

  useEffect(() => {
    if (!topRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) handleLoadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [hasMore, handleLoadMore]);

  const valid = messages.filter((m) => m && m.id);

  return (
    <div
      ref={scrollRef}
      className="flex flex-col flex-1 px-4 py-4 overflow-y-auto bg-bg-chat"
    >
      <div ref={topRef} className="shrink-0">
        {loadingMore && (
          <div className="flex justify-center py-3">
            <div className="flex items-center gap-2 text-xs text-txt-muted">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-txt-muted border-t-brand animate-spin block" />
              Loading older messages…
            </div>
          </div>
        )}
        {!hasMore && valid.length > 0 && (
          <div className="flex items-center gap-3 py-4">
            <div className="flex-1 h-px bg-line" />
            <span className="text-xs text-txt-muted shrink-0">
              Beginning of conversation
            </span>
            <div className="flex-1 h-px bg-line" />
          </div>
        )}
      </div>

      {valid.length === 0 && !loadingMore && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3">
          <div className="flex items-center justify-center w-16 h-16 text-3xl border rounded-full bg-bg-raised border-line-strong">
            {activeChannel?.type === "ai"
              ? "✦"
              : activeChannel?.type === "dm"
                ? "💬"
                : "👥"}
          </div>
          <p className="text-sm text-txt-muted">
            {activeChannel?.type === "ai"
              ? "Ask AI anything…"
              : "No messages yet. Say hi! 👋"}
          </p>
        </div>
      )}

      {valid.map((msg, i) => (
        <MessageBubble
          key={String(msg.id)}
          msg={msg}
          prevMsg={valid[i - 1]}
          currentUser={currentUser}
          currentUserId={currentUserId}
          membersCount={membersCount}
          onReact={onReact}
        />
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
