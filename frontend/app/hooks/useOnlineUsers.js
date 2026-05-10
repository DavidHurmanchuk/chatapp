'use client';

import { useState, useCallback } from 'react';

// Хук для відстеження онлайн статусу юзерів
export function useOnlineUsers() {
  const [onlineIds, setOnlineIds] = useState(new Set());

  const handleOnlineUsers = useCallback(({ userIds }) => {
    setOnlineIds(new Set(userIds.map(String)));
  }, []);

  const handleUserOnline = useCallback(({ userId }) => {
    setOnlineIds(prev => new Set([...prev, String(userId)]));
  }, []);

  const handleUserOffline = useCallback(({ userId }) => {
    setOnlineIds(prev => {
      const next = new Set(prev);
      next.delete(String(userId));
      return next;
    });
  }, []);

  const isOnline = useCallback(userId => onlineIds.has(String(userId)), [onlineIds]);

  return { isOnline, handleOnlineUsers, handleUserOnline, handleUserOffline };
}