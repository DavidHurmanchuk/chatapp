import { Server } from 'socket.io';
import { config } from '../config/index.js';
import { SOCKET_EVENTS } from '../constants/events.js';

// Map userId → Set of socketIds (юзер може мати кілька вкладок)
const onlineUsers = new Map();

export let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: { origin: config.FRONTEND_URL, credentials: true },
  });

  io.on(SOCKET_EVENTS.CONNECT, socket => {
    // Реєстрація юзера — додаємо до онлайн мапи
    socket.on(SOCKET_EVENTS.REGISTER_USER, userId => {
      socket.userId = userId;
      socket.join(`user:${userId}`);

      if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
      onlineUsers.get(userId).add(socket.id);

      // Повідомляємо всіх що юзер онлайн
      socket.broadcast.emit(SOCKET_EVENTS.USER_ONLINE, { userId });

      // Надсилаємо новому юзеру список онлайн юзерів
      socket.emit(SOCKET_EVENTS.ONLINE_USERS, { userIds: [...onlineUsers.keys()] });
    });

    // Приєднання до кімнати розмови
    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, convId => {
      socket.join(`conv:${convId}`);
    });

    // Відключення — прибираємо з онлайн мапи
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      if (!socket.userId) return;

      const sockets = onlineUsers.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        // Якщо більше немає активних сокетів — юзер офлайн
        if (sockets.size === 0) {
          onlineUsers.delete(socket.userId);
          io.emit(SOCKET_EVENTS.USER_OFFLINE, { userId: socket.userId });
        }
      }
    });
  });

  return io;
}

export function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}