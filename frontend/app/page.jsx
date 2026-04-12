"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar.jsx";
import ChatHeader from "./components/ChatHeader.jsx";
import MessageList from "./components/MessageList.jsx";
import ChatInput from "./components/ChatInput.jsx";
import NewConversationModal from "./components/NewConversationModal.jsx";
import LogoutModal from "./components/LogoutModal.jsx";
import { useSocket } from "./hooks/useSocket.js";
import { apiFetch, getToken, removeToken } from "./utils/api.js";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function ChatPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewConvModal, setShowNewConvModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const activeConvRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    activeConvRef.current = activeConv;
  }, [activeConv]);
  useEffect(() => {
    if (!sending) inputRef.current?.focus();
  }, [sending]);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const selectConversation = useCallback((conv) => {
    setActiveConv(conv);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const handleNewConvMessage = useCallback((convId, message) => {
    const isActive = String(activeConvRef.current?.id) === String(convId);
    if (isActive) {
      setMessages((prev) =>
        prev.some((m) => String(m.id) === String(message.id))
          ? prev
          : [...prev, message],
      );
      apiFetch(`/api/conversations/${convId}/read`, { method: "POST" }).catch(
        () => {},
      );
    }
    setConversations((prev) =>
      prev.map((c) =>
        String(c.id) === String(convId)
          ? {
              ...c,
              last_message: message.content,
              unread: isActive ? 0 : (c.unread ?? 0) + 1,
            }
          : c,
      ),
    );
  }, []);

  const handleNewConversation = useCallback((conv) => {
    setConversations((prev) =>
      prev.some((c) => String(c.id) === String(conv.id))
        ? prev
        : [conv, ...prev],
    );
  }, []);

  const handleConversationDeleted = useCallback((convId) => {
    setConversations((prev) =>
      prev.filter((c) => String(c.id) !== String(convId)),
    );
    if (String(activeConvRef.current?.id) === String(convId)) {
      setActiveConv(null);
      setMessages([]);
    }
  }, []);

  const handleMemberLeft = useCallback(({ conversationId, userId }) => {
    setConversations((prev) =>
      prev.map((c) =>
        String(c.id) === String(conversationId)
          ? {
              ...c,
              members: c.members.filter((m) => String(m.id) !== String(userId)),
            }
          : c,
      ),
    );
    if (String(activeConvRef.current?.id) === String(conversationId))
      setActiveConv((p) =>
        p
          ? {
              ...p,
              members: p.members.filter((m) => String(m.id) !== String(userId)),
            }
          : p,
      );
  }, []);

  const handleConversationRenamed = useCallback((convId, name) => {
    setConversations((prev) =>
      prev.map((c) => (String(c.id) === String(convId) ? { ...c, name } : c)),
    );
    if (String(activeConvRef.current?.id) === String(convId))
      setActiveConv((p) => ({ ...p, name }));
  }, []);

  const handleMessagesRead = useCallback((convId, readerId) => {
    if (String(activeConvRef.current?.id) === String(convId))
      setMessages((prev) =>
        prev.map((m) => ({
          ...m,
          readBy: m.readBy?.includes(readerId)
            ? m.readBy
            : [...(m.readBy ?? []), readerId],
        })),
      );
  }, []);

  const handleReactionUpdated = useCallback((convId, updatedMsg) => {
    if (String(activeConvRef.current?.id) === String(convId))
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(updatedMsg.id)
            ? { ...m, reactions: updatedMsg.reactions }
            : m,
        ),
      );
  }, []);

  const { socketId } = useSocket({
    userId: user?.id,
    activeConvId: activeConv?.id,
    onNewConvMessage: handleNewConvMessage,
    onNewConversation: handleNewConversation,
    onConversationDeleted: handleConversationDeleted,
    onMemberLeft: handleMemberLeft,
    onConversationRenamed: handleConversationRenamed,
    onMessagesRead: handleMessagesRead,
    onReactionUpdated: handleReactionUpdated,
  });

  useEffect(() => {
    apiFetch(`/api/auth/me`)
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setUser(data.user);
        else router.replace("/login");
      })
      .catch(() => router.replace("/login"))
      .finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/api/conversations`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        setConversations(data);
        if (
          !activeConvRef.current &&
          data.length > 0 &&
          window.innerWidth >= 768
        )
          setActiveConv(data[0]);
      })
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!activeConv?.id) return;
    setMessages([]);
    setHasMore(false);
    apiFetch(`/api/conversations/${activeConv.id}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages) {
          setMessages(data.messages);
          setHasMore(data.hasMore ?? false);
        } else if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(console.error);
    apiFetch(`/api/conversations/${activeConv.id}/read`, {
      method: "POST",
    }).catch(() => {});
    setConversations((prev) =>
      prev.map((c) =>
        String(c.id) === String(activeConv.id) ? { ...c, unread: 0 } : c,
      ),
    );
  }, [activeConv?.id]);

  const loadMoreMessages = useCallback(async () => {
    if (!activeConv?.id || loadingMore || !hasMore) return;
    const oldest = messages[0];
    if (!oldest) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `${API}/api/conversations/${activeConv.id}/messages?before=${oldest.id}`,
        { credentials: "include" },
      );
      const data = await res.json();
      if (data.messages) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(data.hasMore ?? false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  }, [activeConv?.id, loadingMore, hasMore, messages]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || sending || !activeConv) return;
    const isAI =
      activeConv.type === "ai" ||
      (activeConv.type === "group_ai" &&
        content.startsWith(activeConv.aiTrigger ?? "/groq"));

    setInput("");
    setSending(true);
    if (inputRef.current) inputRef.current.style.height = "auto";

    const tempId = `tmp-${Date.now()}`;
    const typingId = `typing-${Date.now()}`;
    const tempMsg = {
      id: tempId,
      sender: user.name,
      content,
      created_at: new Date().toISOString(),
      readBy: [user.id],
      reactions: [],
    };

    setMessages((prev) => {
      const next = [...prev, tempMsg];
      if (isAI)
        next.push({
          id: typingId,
          sender: "AI Assistant",
          content: "__typing__",
          created_at: new Date().toISOString(),
          readBy: [],
          reactions: [],
        });
      return next;
    });

    try {
      const res = await apiFetch(
        `/api/conversations/${activeConv.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, socketId }),
        },
      );
      const data = await res.json();
      setMessages((prev) => {
        let u = prev.map((m) =>
          m.id === tempId ? { ...data.userMessage } : m,
        );
        if (data.aiMessage?.id)
          u = u.map((m) => (m.id === typingId ? { ...data.aiMessage } : m));
        else u = u.filter((m) => m.id !== typingId);
        return u;
      });
      setConversations((prev) =>
        prev.map((c) =>
          String(c.id) === String(activeConv.id)
            ? { ...c, last_message: content }
            : c,
        ),
      );
    } catch (e) {
      console.error(e);
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempId && m.id !== typingId),
      );
    } finally {
      setSending(false);
    }
  };

  const handleReact = async (msgId, emoji) => {
    if (!activeConv?.id || String(msgId).startsWith("tmp-")) return;
    await apiFetch(
      `/api/conversations/${activeConv.id}/messages/${msgId}/reactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      },
    ).catch(console.error);
  };

  const handleMemberAdded = (updatedConv) => {
    setConversations((prev) =>
      prev.map((c) =>
        String(c.id) === String(updatedConv.id) ? updatedConv : c,
      ),
    );
    if (String(activeConv?.id) === String(updatedConv.id))
      setActiveConv(updatedConv);
  };

  const handleRename = async (conv, newName) => {
    const res = await apiFetch(`/api/conversations/${conv.id}/name`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    }).catch(console.error);
    if (res?.ok) {
      setConversations((prev) =>
        prev.map((c) =>
          String(c.id) === String(conv.id) ? { ...c, name: newName } : c,
        ),
      );
      if (String(activeConv?.id) === String(conv.id))
        setActiveConv((p) => ({ ...p, name: newName }));
    }
  };

  const handleDelete = async (conv) => {
    await apiFetch(`/api/conversations/${conv.id}`, { method: "DELETE" }).catch(
      console.error,
    );
    setConversations((prev) =>
      prev.filter((c) => String(c.id) !== String(conv.id)),
    );
    if (String(activeConv?.id) === String(conv.id)) {
      setActiveConv(null);
      setMessages([]);
    }
  };

  const logout = async () => {
    await apiFetch(`/api/auth/logout`, { method: "POST" });
    router.replace("/login");
  };

  if (!authChecked)
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-base">
        <p className="text-sm text-txt-muted">Loading…</p>
      </div>
    );
  if (!user) return null;

  const membersCount = activeConv?.members?.length ?? 2;
  const showSidebar = isMobile ? sidebarOpen : sidebarOpen;
  const showChat = isMobile ? !sidebarOpen : true;

  return (
    <div className="flex h-full overflow-hidden bg-bg-base">
      {showSidebar && (
        <Sidebar
          open
          conversations={conversations}
          activeConv={activeConv}
          onSelectConversation={selectConversation}
          onNewConversation={() => setShowNewConvModal(true)}
          currentUser={user.name}
          currentUserId={user.id}
          onLogoutRequest={() => setShowLogoutModal(true)}
          onRename={handleRename}
          onDelete={handleDelete}
          onLeave={handleDelete}
        />
      )}

      {showChat && (
        <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Mobile back button */}
          {isMobile && (
            <div className="flex items-center px-4 border-b h-14 bg-bg-sidebar border-line shrink-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-brand text-sm font-bold flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
              >
                ← Back
              </button>
            </div>
          )}

          {activeConv ? (
            <>
              <ChatHeader
                activeConv={activeConv}
                onToggleSidebar={() => setSidebarOpen((v) => !v)}
                isMobile={isMobile}
                onMemberAdded={handleMemberAdded}
              />
              <MessageList
                messages={messages}
                activeChannel={activeConv}
                currentUser={user.name}
                currentUserId={user.id}
                membersCount={membersCount}
                onReact={handleReact}
                onLoadMore={loadMoreMessages}
                hasMore={hasMore}
                loadingMore={loadingMore}
              />
              <ChatInput
                input={input}
                onChange={(e) => setInput(e.target.value)}
                onSend={sendMessage}
                sending={sending}
                activeChannel={activeConv}
                inputRef={inputRef}
                aiTrigger={activeConv?.aiTrigger}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-4 bg-bg-chat">
              <div className="flex items-center justify-center w-24 h-24 text-5xl border rounded-full bg-brand-bg border-brand-border">
                💬
              </div>
              <div className="text-center">
                <p className="mb-2 text-lg font-black text-txt-primary">
                  Select a conversation
                </p>
                <p className="text-[13.5px] text-txt-muted">
                  Choose from the left or start a new one
                </p>
              </div>
            </div>
          )}
        </main>
      )}

      {showNewConvModal && (
        <NewConversationModal
          onClose={() => setShowNewConvModal(false)}
          onCreated={(conv) => {
            setConversations((prev) =>
              prev.some((c) => String(c.id) === String(conv.id))
                ? prev
                : [conv, ...prev],
            );
            selectConversation(conv);
          }}
        />
      )}
      {showLogoutModal && (
        <LogoutModal
          onClose={() => setShowLogoutModal(false)}
          onConfirm={logout}
        />
      )}
    </div>
  );
}
