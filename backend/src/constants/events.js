// Socket.io event names — єдине місце для всіх подій
export const SOCKET_EVENTS = {
  // Connection
  CONNECT:              'connect',
  DISCONNECT:           'disconnect',
  REGISTER_USER:        'register_user',
  JOIN_CONVERSATION:    'join_conversation',

  // Messages
  NEW_CONV_MESSAGE:     'new_conv_message',

  // Conversations
  NEW_CONVERSATION:     'new_conversation',
  CONVERSATION_DELETED: 'conversation_deleted',
  CONVERSATION_RENAMED: 'conversation_renamed',
  MEMBER_LEFT:          'member_left',
  MEMBER_JOINED:        'member_joined',

  // Read / reactions
  MESSAGES_READ:        'messages_read',
  REACTION_UPDATED:     'reaction_updated',

  // Online status
  USER_ONLINE:          'user_online',
  USER_OFFLINE:         'user_offline',
  ONLINE_USERS:         'online_users',
};