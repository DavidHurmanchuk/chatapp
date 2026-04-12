"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "./Avatar.jsx";

import { apiFetch } from "../utils/api.js";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function NewConversationModal({ onClose, onCreated }) {
  const [tab, setTab] = useState("dm");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [withAI, setWithAI] = useState(false);
  const [aiTrigger, setAiTrigger] = useState("/groq");
  const [submitting, setSubmitting] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    setSearch("");
    setResults([]);
    setSelected([]);
  }, [tab]);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch(
          `/api/users/search?q=${encodeURIComponent(search)}`,
          {},
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [search]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      let res, data;
      if (tab === "dm") {
        if (!selected[0]) return;
        res = await apiFetch(`/api/conversations/dm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selected[0].id }),
        });
      } else if (tab === "group") {
        if (!groupName.trim()) return;
        res = await apiFetch(`/api/conversations/group`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: groupName.trim(),
            memberIds: selected.map((u) => u.id),
            withAI,
            aiTrigger,
          }),
        });
      } else {
        res = await apiFetch(`/api/conversations/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
      }
      data = await res.json();
      if (res.ok) {
        onCreated(data);
        onClose();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUser = (user) => {
    if (tab === "dm") {
      setSelected([user]);
      setSearch("");
      setResults([]);
      return;
    }
    setSelected((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user],
    );
  };

  const TABS = [
    { id: "dm", label: "@ Direct Message" },
    { id: "group", label: "⊞ Group" },
    { id: "ai", label: "✦ AI Chat" },
  ];

  const canSubmit =
    tab === "ai" ||
    (tab === "dm" && selected.length > 0) ||
    (tab === "group" && groupName.trim());

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: 460 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-strong">
          <p className="text-base font-black text-txt-primary">
            New Conversation
          </p>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-xl border-none rounded-lg cursor-pointer bg-bg-raised text-txt-muted hover:text-txt-primary"
          >
            ×
          </button>
        </div>

        <div className="flex gap-1 p-3 border-b border-line-strong">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-xl text-[13px] font-bold border-none cursor-pointer transition-all ${tab === t.id ? "bg-brand text-white" : "bg-bg-raised text-txt-muted hover:text-txt-primary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 p-4">
          {tab === "ai" && (
            <div className="py-4 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-3 text-3xl border rounded-full bg-ai-bg border-ai-border">
                ✦
              </div>
              <p className="mb-1 font-bold text-txt-primary">
                Personal AI Assistant
              </p>
              <p className="text-xs text-txt-muted">
                Powered by Llama 3.3 · Answers everything
              </p>
            </div>
          )}

          {tab === "group" && (
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-raised border border-line text-txt-primary text-sm outline-none transition-colors focus:border-brand placeholder-txt-muted"
            />
          )}

          {tab !== "ai" && (
            <div className="relative">
              <span className="absolute text-sm -translate-y-1/2 left-3 top-1/2 text-txt-muted">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-bg-raised border border-line text-txt-primary text-sm outline-none transition-colors focus:border-brand placeholder-txt-muted"
              />
            </div>
          )}

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selected.map((u) => (
                <span
                  key={u.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-bg border border-brand-border text-brand text-xs font-semibold"
                >
                  {u.name}
                  <button
                    onClick={() =>
                      setSelected((prev) => prev.filter((x) => x.id !== u.id))
                    }
                    className="flex items-center justify-center w-4 h-4 text-xs bg-transparent border-none rounded-full cursor-pointer text-brand hover:bg-brand hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {(loading || results.length > 0) && (
            <div className="max-h-[200px] overflow-y-auto rounded-xl border border-line overflow-hidden">
              {loading && (
                <p className="py-3 text-sm text-center text-txt-muted">
                  Searching…
                </p>
              )}
              {results.map((u) => (
                <div
                  key={u.id}
                  onClick={() => toggleUser(u)}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors hover:bg-bg-raised border-b border-line last:border-b-0"
                >
                  <Avatar name={u.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate text-txt-primary">
                      {u.name}
                    </p>
                    <p className="text-xs text-txt-muted">{u.email}</p>
                  </div>
                  {selected.some((s) => s.id === u.id) && (
                    <span className="text-lg text-brand">✓</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {tab === "group" && (
            <label className="flex items-center justify-between px-3.5 py-3 rounded-xl bg-bg-raised border border-line cursor-pointer">
              <div>
                <p className="text-sm font-bold text-txt-primary">Enable AI</p>
                <p className="text-xs text-txt-muted mt-0.5">
                  AI responds to {aiTrigger} command
                </p>
              </div>
              <div
                onClick={() => setWithAI((v) => !v)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${withAI ? "bg-brand" : "bg-bg-raised border border-line-strong"}`}
              >
                <span
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${withAI ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </div>
            </label>
          )}

          {tab === "group" && withAI && (
            <input
              value={aiTrigger}
              onChange={(e) => setAiTrigger(e.target.value)}
              placeholder="AI trigger (e.g. /groq)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-bg-raised border border-line text-txt-primary text-sm outline-none transition-colors focus:border-brand placeholder-txt-muted"
            />
          )}

          <div className="flex gap-2.5 pt-1">
            <button className="btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              {submitting
                ? "…"
                : tab === "ai"
                  ? "Open AI Chat"
                  : tab === "dm"
                    ? "Start Chat"
                    : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
