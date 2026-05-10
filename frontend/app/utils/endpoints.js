// Всі API endpoints в одному місці
export const ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    GOOGLE: "/api/auth/google",
    GITHUB: "/api/auth/github",
  },

  // Conversations
  CONVERSATIONS: {
    LIST: "/api/conversations",
    DM: "/api/conversations/dm",
    GROUP: "/api/conversations/group",
    AI: "/api/conversations/ai",
    BY_ID: (id) => `/api/conversations/${id}`,
    MESSAGES: (id) => `/api/conversations/${id}/messages`,
    READ: (id) => `/api/conversations/${id}/read`,
    NAME: (id) => `/api/conversations/${id}/name`,
    MEMBERS: (id) => `/api/conversations/${id}/members`,
    REACTIONS: (convId, msgId) =>
      `/api/conversations/${convId}/messages/${msgId}/reactions`,
  },

  // Users
  USERS: {
    SEARCH: (q) => `/api/users/search?q=${encodeURIComponent(q)}`,
  },
};

// Socket event names — мають збігатись з бекендом
export const SOCKET_EVENTS = {
  REGISTER_USER: "register_user",
  JOIN_CONVERSATION: "join_conversation",
  NEW_CONV_MESSAGE: "new_conv_message",
  NEW_CONVERSATION: "new_conversation",
  CONVERSATION_DELETED: "conversation_deleted",
  CONVERSATION_RENAMED: "conversation_renamed",
  MEMBER_LEFT: "member_left",
  MEMBER_JOINED: "member_joined",
  MESSAGES_READ: "messages_read",
  REACTION_UPDATED: "reaction_updated",
  USER_ONLINE: "user_online",
  USER_OFFLINE: "user_offline",
  ONLINE_USERS: "online_users",
};
