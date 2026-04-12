"use client";

import { useState, useRef, useEffect } from "react";
import Avatar from "./Avatar.jsx";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr);
  if (diff < 60000) return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
  return new Date(dateStr).toLocaleDateString([], {
    day: "numeric",
    month: "short",
  });
}

function fmtPreview(text) {
  if (!text) return "No messages yet";
  return text.length > 38 ? text.slice(0, 38) + "…" : text;
}

function ContextMenu({
  conv,
  currentUserId,
  onRename,
  onDelete,
  onLeave,
  onClose,
}) {
  const ref = useRef(null);
  const isCreator = String(conv.createdBy) === String(currentUserId);
  const isGroup = conv.type === "group" || conv.type === "group_ai";

  useEffect(() => {
    const fn = (e) => {
      if (!ref.current?.contains(e.target)) onClose();
    };
    setTimeout(() => document.addEventListener("mousedown", fn), 0);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const MenuItem = ({ label, color, onClick }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full text-left px-4 py-2.5 text-[13.5px] font-semibold bg-transparent border-none cursor-pointer transition-colors hover:bg-bg-raised ${color}`}
    >
      {label}
    </button>
  );

  return (
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className="absolute right-2 top-full mt-1 z-50 rounded-2xl overflow-hidden py-1 min-w-[175px]"
      style={{
        background: "#161b27",
        border: "1px solid #252d3d",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      {isGroup && isCreator && (
        <MenuItem
          label="✏️  Rename"
          color="text-txt-primary"
          onClick={onRename}
        />
      )}
      {isGroup && !isCreator && (
        <MenuItem
          label="🚪  Leave group"
          color="text-group"
          onClick={onLeave}
        />
      )}
      {isGroup && isCreator && (
        <MenuItem
          label="🗑️  Delete group"
          color="text-danger"
          onClick={onDelete}
        />
      )}
      {!isGroup && (
        <MenuItem
          label="✕  Hide chat"
          color="text-txt-muted"
          onClick={onDelete}
        />
      )}
    </div>
  );
}

function RenameModal({ conv, onClose, onConfirm }) {
  const [val, setVal] = useState(conv.name ?? "");
  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex flex-col gap-4 p-6 modal-box">
        <p className="text-base font-black text-txt-primary">Rename Group</p>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && val.trim() && onConfirm(val.trim())
          }
          className="w-full px-3.5 py-2.5 rounded-xl bg-bg-raised border border-line-strong text-txt-primary text-sm outline-none transition-colors focus:border-brand"
        />
        <div className="flex gap-2.5">
          <button className="btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => val.trim() && onConfirm(val.trim())}
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
}

function ConvItem({
  conv,
  isActive,
  onClick,
  currentUserId,
  onRename,
  onDelete,
  onLeave,
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);

  const displayName = conv.type === "ai" ? "AI Assistant" : conv.name;

  return (
    <>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer mb-0.5 transition-colors duration-150 ${isActive ? "bg-active" : hovered ? "bg-hover" : ""}`}
      >
        <Avatar name={displayName} size={50} isAI={conv.type === "ai"} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="font-bold text-[14.5px] text-txt-primary truncate max-w-[130px]">
              {displayName}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {conv.last_at && (
                <span className="text-[11px] text-txt-muted">
                  {timeAgo(conv.last_at)}
                </span>
              )}
              {conv.unread > 0 && (
                <span className="text-[11px] font-black px-1.5 py-0.5 rounded-full bg-brand text-white min-w-[20px] text-center">
                  {conv.unread > 99 ? "99+" : conv.unread}
                </span>
              )}
            </div>
          </div>
          <p className="text-[12.5px] text-txt-muted truncate">
            {fmtPreview(conv.last_message)}
          </p>
        </div>

        {(hovered || menuOpen) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((v) => !v);
            }}
            className={`absolute right-3 top-2.5 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold text-txt-muted transition-colors ${menuOpen ? "bg-line-strong" : "bg-bg-sidebar/90"} border border-line-strong`}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#252d3d")}
            onMouseLeave={(e) => {
              if (!menuOpen)
                e.currentTarget.style.background = "rgba(15,20,32,0.9)";
            }}
          >
            ···
          </button>
        )}

        {menuOpen && (
          <ContextMenu
            conv={conv}
            currentUserId={currentUserId}
            onRename={() => {
              setMenuOpen(false);
              setRenameOpen(true);
            }}
            onDelete={() => {
              setMenuOpen(false);
              onDelete(conv);
            }}
            onLeave={() => {
              setMenuOpen(false);
              onLeave(conv);
            }}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      {renameOpen && (
        <RenameModal
          conv={conv}
          onClose={() => setRenameOpen(false)}
          onConfirm={(name) => {
            setRenameOpen(false);
            onRename(conv, name);
          }}
        />
      )}
    </>
  );
}

export default function Sidebar({
  open,
  conversations,
  activeConv,
  onSelectConversation,
  onNewConversation,
  currentUser,
  currentUserId,
  onLogoutRequest,
  onRename,
  onDelete,
  onLeave,
}) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? conversations.filter((c) => {
        const name = c.type === "ai" ? "AI Assistant" : (c.name ?? "");
        return name.toLowerCase().includes(search.toLowerCase());
      })
    : conversations;

  return (
    <aside
      className="flex flex-col overflow-hidden transition-all duration-300 border-r shrink-0 border-line"
      style={{
        width: open ? 300 : 0,
        minWidth: open ? 300 : 0,
        background: "#0f1420",
      }}
    >
      <div className="px-4 pt-4 pb-3 border-b border-line shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 text-sm font-black text-white rounded-xl bg-gradient-to-br from-brand to-violet-500">
              C
            </div>
            <span className="font-black text-[17px] text-txt-primary tracking-tight">
              ChatApp
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onNewConversation}
              title="New conversation"
              className="w-8 h-8 icon-btn"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#4f7cff";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#1a2035";
                e.currentTarget.style.color = "#8891a8";
              }}
            >
              <span className="text-xl leading-none">+</span>
            </button>
            <button
              onClick={onLogoutRequest}
              title="Sign out"
              className="w-8 h-8 icon-btn"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ff6b6b22";
                e.currentTarget.style.color = "#ff6b6b";
                e.currentTarget.style.borderColor = "#ff6b6b44";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#1a2035";
                e.currentTarget.style.color = "#8891a8";
                e.currentTarget.style.borderColor = "#252d3d";
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative">
          <span className="absolute text-sm -translate-y-1/2 left-3 top-1/2 text-txt-muted">
            🔍
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-bg-raised border border-line text-txt-primary text-[13.5px] outline-none transition-colors focus:border-brand placeholder-txt-muted"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-line shrink-0">
        <Avatar name={currentUser} size={34} />
        <div>
          <p className="font-bold text-[13px] text-txt-primary">
            {currentUser}
          </p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
            <span className="text-[11px] text-txt-muted">Online</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center">
            <p className="text-txt-muted text-[13px]">
              {search ? "No results" : "No conversations yet"}
            </p>
            {!search && (
              <p className="text-[12px] text-line-strong mt-1.5">
                Click + to start a new one
              </p>
            )}
          </div>
        )}
        {filtered.map((c) => (
          <ConvItem
            key={c.id}
            conv={c}
            isActive={activeConv?.id === c.id}
            onClick={() => onSelectConversation(c)}
            currentUserId={currentUserId}
            onRename={onRename}
            onDelete={onDelete}
            onLeave={onLeave}
          />
        ))}
      </div>
    </aside>
  );
}
