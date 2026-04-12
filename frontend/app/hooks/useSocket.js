'use client';

import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useSocket({
  userId, activeConvId,
  onNewConvMessage, onNewConversation,
  onConversationDeleted, onMemberLeft, onConversationRenamed,
  onMessagesRead, onReactionUpdated,
}) {
  const socketRef = useRef(null);
  const [socketId, setSocketId] = useState(null);

  useEffect(() => {
    socketRef.current = io(API, { withCredentials: true });

    socketRef.current.on('connect', () => {
      setSocketId(socketRef.current.id);
      if (userId) socketRef.current.emit('register_user', userId);
    });

    socketRef.current.on('new_conv_message',     ({ conversationId, message }) => onNewConvMessage?.(conversationId, message));
    socketRef.current.on('new_conversation',     conv   => onNewConversation?.(conv));
    socketRef.current.on('conversation_deleted', data   => onConversationDeleted?.(data.conversationId));
    socketRef.current.on('member_left',          data   => onMemberLeft?.(data));
    socketRef.current.on('conversation_renamed', data   => onConversationRenamed?.(data.conversationId, data.name));
    socketRef.current.on('messages_read',        data   => onMessagesRead?.(data.conversationId, data.userId));
    socketRef.current.on('reaction_updated',     ({ conversationId, message }) => onReactionUpdated?.(conversationId, message));

    return () => socketRef.current?.disconnect();
  }, [userId]);

  useEffect(() => {
    if (!activeConvId || !socketRef.current) return;
    socketRef.current.emit('join_conversation', activeConvId);
  }, [activeConvId]);

  return { socketId };
}