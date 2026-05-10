"use client";

import { useState, useEffect, useRef } from "react";
import Avatar from "./Avatar.jsx";

import { apiFetch } from "../utils/api.js";
import { ENDPOINTS } from "../utils/endpoints.js";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AddMemberModal({
  conv,
  existingMembers,
  onClose,
  onAdded,
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(null);
  const [success, setSuccess] = useState(null);
  const timer = useRef(null);

  const existingIds = existingMembers.map((m) => String(m.id));

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiFetch(ENDPOINTS.USERS.SEARCH(search), {});
        const data = await res.json();
        setResults(
          (Array.isArray(data) ? data : []).filter(
            (u) => !existingIds.includes(String(u.id)),
          ),
        );
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [search]);

  const handleAdd = async (user) => {
    setAdding(user.id);
    try {
      const res = await apiFetch(ENDPOINTS.CONVERSATIONS.MEMBERS(conv.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(user.name);
        onAdded?.(data);
        setTimeout(() => {
          setSuccess(null);
          setSearch("");
          setResults([]);
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(null);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line-strong">
          <div>
            <p className="font-black text-base text-txt-primary">Add Member</p>
            <p className="text-xs text-txt-muted mt-0.5">to {conv.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-bg-raised border-none cursor-pointer text-txt-muted text-xl flex items-center justify-center transition-colors hover:text-txt-primary"
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3.5">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-muted text-sm">
              🔍
            </span>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-bg-raised border border-line text-txt-primary text-[13.5px] outline-none transition-colors focus:border-brand placeholder-txt-muted"
            />
          </div>
        </div>

        {/* Success */}
        {success && (
          <div className="mx-5 mb-3 px-3.5 py-2.5 rounded-xl bg-ai-badge border border-ai-border text-ai text-sm font-semibold">
            ✓ {success} added to the group
          </div>
        )}

        {/* Results */}
        <div className="max-h-[280px] overflow-y-auto px-2 pb-2">
          {loading && (
            <p className="text-center text-txt-muted text-sm py-4">
              Searching…
            </p>
          )}
          {!loading && search && results.length === 0 && (
            <p className="text-center text-txt-muted text-sm py-4">
              No users found
            </p>
          )}

          {results.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-bg-raised"
            >
              <Avatar name={u.name} size={40} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-txt-primary truncate">
                  {u.name}
                </p>
                <p className="text-xs text-txt-muted">{u.email}</p>
              </div>
              <button
                onClick={() => handleAdd(u)}
                disabled={adding === u.id}
                className={`px-4 py-1.5 rounded-xl font-bold text-[13px] border-none transition-all shrink-0 ${adding === u.id ? "bg-bg-raised text-txt-muted cursor-default" : "bg-brand text-white cursor-pointer hover:bg-brand-dark"}`}
              >
                {adding === u.id ? "…" : "Add"}
              </button>
            </div>
          ))}

          {/* Current members */}
          {!search && existingMembers.length > 0 && (
            <div className="px-3 pt-2">
              <p className="text-[11px] font-bold text-txt-muted uppercase tracking-widest mb-2">
                Members ({existingMembers.length})
              </p>
              {existingMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-2.5 py-1.5">
                  <Avatar name={m.name} size={30} />
                  <span className="text-[13px] text-txt-secondary">
                    {m.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
