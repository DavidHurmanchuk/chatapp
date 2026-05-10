"use client";

import { useState } from "react";
import Avatar from "./Avatar.jsx";
import AddMemberModal from "./AddMemberModal.jsx";

export default function ChatHeader({
  activeConv,
  onToggleSidebar,
  isMobile,
  onMemberAdded,
  isOnline,
  currentUserId,
}) {
  const [showAddMember, setShowAddMember] = useState(false);

  const isAI = activeConv?.type === "ai";
  const isGroupAI = activeConv?.type === "group_ai";
  const isGroup = activeConv?.type === "group" || isGroupAI;
  const name = isAI ? "AI Assistant" : activeConv?.name;
  const members = activeConv?.members ?? [];

  const dmPartner =
    activeConv?.type === "dm"
      ? members.find((m) => String(m.id) !== String(currentUserId))
      : null;
  const dmOnline = dmPartner ? isOnline?.(dmPartner.id) : false;

  const subtitle = isAI
    ? "Llama 3.3 · Always online"
    : isGroupAI
      ? `${members.length} members · ${activeConv.aiTrigger ?? "/groq"} for AI`
      : isGroup
        ? `${members.length} members`
        : activeConv?.type === "dm"
          ? dmOnline
            ? "Online"
            : "Offline"
          : "";

  return (
    <>
      <header className="h-[60px] px-4 bg-bg-sidebar border-b border-line flex items-center gap-3 shrink-0">
        {/* Бургер тільки на десктопі */}
        {!isMobile && (
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-lg text-txt-muted bg-transparent border-none cursor-pointer transition-colors hover:text-txt-primary shrink-0"
          >
            ☰
          </button>
        )}

        {activeConv && (
          <>
            <Avatar name={name} size={38} isAI={isAI} />
            <div className="flex-1 min-w-0">
              <p className="font-black text-[15px] text-txt-primary tracking-tight truncate">
                {name}
              </p>
              <div className="flex items-center gap-1.5">
                {activeConv?.type === "dm" && (
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${dmOnline ? "bg-success" : "bg-txt-muted"}`}
                  />
                )}
                <p
                  className={`text-[12px] ${activeConv?.type === "dm" && dmOnline ? "text-success" : "text-txt-muted"}`}
                >
                  {subtitle}
                </p>
              </div>
            </div>

            {/* Add member */}
            {isGroup && (
              <button
                onClick={() => setShowAddMember(true)}
                title="Add member"
                className="icon-btn w-9 h-9 shrink-0"
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#4f7cff";
                  e.currentTarget.style.color = "#fff";
                  e.currentTarget.style.borderColor = "#4f7cff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1a2035";
                  e.currentTarget.style.color = "#8891a8";
                  e.currentTarget.style.borderColor = "#252d3d";
                }}
              >
                <span className="text-lg leading-none">+</span>
              </button>
            )}

            {isAI && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-ai-badge text-ai border border-ai-border shrink-0">
                AI
              </span>
            )}
            {isGroupAI && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-group-ai-bg text-group-ai border border-group-ai-border shrink-0">
                {activeConv.aiTrigger ?? "/groq"}
              </span>
            )}
          </>
        )}
      </header>

      {showAddMember && (
        <AddMemberModal
          conv={activeConv}
          existingMembers={members}
          onClose={() => setShowAddMember(false)}
          onAdded={onMemberAdded}
        />
      )}
    </>
  );
}
