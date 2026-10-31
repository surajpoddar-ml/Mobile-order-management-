import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { queryGet, queryRun } from '../database/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mobile_parts_super_secret_jwt_key_2026_auth_system';

let ioInstance = null;

export const initSocketIO = (httpServer) => {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const rawToken =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token ||
        (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.split(' ')[1]);

      if (!rawToken) {
        return next(new Error('Authentication token required for live messaging.'));
      }

      const decoded = jwt.verify(rawToken, JWT_SECRET);
      if (!decoded || !decoded.id) {
        return next(new Error('Invalid authentication token.'));
      }

      const user = await queryGet(
        'SELECT id, userId, fullName, email, phoneNumber, userType FROM users WHERE id = ?',
        [decoded.id]
      );

      if (!user) {
        return next(new Error('User not found.'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.warn('[Socket Auth Notice]', err.message);
      return next(new Error('Socket authentication failed: ' + err.message));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const userRoom = `user_${user.id}`;
    socket.join(userRoom);

    if (user.userType === 'Admin') {
      socket.join('admin_room');
    }

    // Join conversation room with authorization check
    socket.on('conversation:join', async (data, callback) => {
      try {
        const conversationId = parseInt(data?.conversationId, 10);
        if (!conversationId) {
          if (callback) callback({ success: false, message: 'Invalid conversation ID' });
          return;
        }

        const conv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [conversationId]);
        if (!conv) {
          if (callback) callback({ success: false, message: 'Conversation not found' });
          return;
        }

        // Authorization check: User can only join their own conversation, Admin can join any
        if (user.userType !== 'Admin' && conv.user_id !== user.id) {
          if (callback) callback({ success: false, message: 'Unauthorized access to this conversation' });
          return;
        }

        const roomName = `conversation_${conversationId}`;
        socket.join(roomName);

        if (callback) callback({ success: true, room: roomName });
      } catch (err) {
        console.error('Error joining conversation room:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    // Leave conversation room
    socket.on('conversation:leave', (data) => {
      const conversationId = parseInt(data?.conversationId, 10);
      if (conversationId) {
        socket.leave(`conversation_${conversationId}`);
      }
    });

    // Real-time typing indicators
    socket.on('typing:start', async (data) => {
      const conversationId = parseInt(data?.conversationId, 10);
      if (!conversationId) return;

      const conv = await queryGet('SELECT id, user_id FROM chat_conversations WHERE id = ?', [conversationId]);
      if (!conv) return;
      if (user.userType !== 'Admin' && conv.user_id !== user.id) return;

      socket.to(`conversation_${conversationId}`).emit('user:typing', {
        conversationId,
        isTyping: true,
        senderId: user.id,
        senderName: user.fullName,
        senderRole: user.userType
      });
    });

    socket.on('typing:stop', async (data) => {
      const conversationId = parseInt(data?.conversationId, 10);
      if (!conversationId) return;

      socket.to(`conversation_${conversationId}`).emit('user:typing', {
        conversationId,
        isTyping: false,
        senderId: user.id
      });
    });

    // Real-time mark as read
    socket.on('message:read', async (data, callback) => {
      try {
        const conversationId = parseInt(data?.conversationId, 10);
        if (!conversationId) return;

        const conv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [conversationId]);
        if (!conv) return;
        if (user.userType !== 'Admin' && conv.user_id !== user.id) return;

        const now = new Date().toISOString();

        if (user.userType === 'Admin') {
          // Admin reading messages from user
          await queryRun(
            'UPDATE chat_messages SET is_read = 1, read_at = ? WHERE conversation_id = ? AND sender_role != "Admin" AND is_read = 0',
            [now, conversationId]
          );
          await queryRun(
            'UPDATE chat_conversations SET unread_admin_count = 0, updated_at = ? WHERE id = ?',
            [now, conversationId]
          );
        } else {
          // Customer/Distributor reading messages from admin
          await queryRun(
            'UPDATE chat_messages SET is_read = 1, read_at = ? WHERE conversation_id = ? AND sender_role = "Admin" AND is_read = 0',
            [now, conversationId]
          );
          await queryRun(
            'UPDATE chat_conversations SET unread_user_count = 0, updated_at = ? WHERE id = ?',
            [now, conversationId]
          );
        }

        const updatedConv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [conversationId]);

        io.to(`conversation_${conversationId}`).emit('message:read_ack', {
          conversationId,
          readBy: user.userType,
          readAt: now
        });

        io.to('admin_room').emit('conversation:updated', updatedConv);
        io.to(`user_${conv.user_id}`).emit('conversation:updated', updatedConv);

        if (callback) callback({ success: true });
      } catch (err) {
        console.error('Error acknowledging read message:', err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on('disconnect', () => {
      // Disconnected cleanly
    });
  });

  ioInstance = io;
  return io;
};

export const getIO = () => {
  return ioInstance;
};

/**
 * Broadcast newly created message to conversation room and recipient rooms
 */
export const broadcastNewMessage = (conversation, message) => {
  if (!ioInstance) return;

  const convRoom = `conversation_${conversation.id}`;
  // Broadcast to everyone currently in this conversation room
  ioInstance.to(convRoom).emit('message:new', {
    conversationId: conversation.id,
    message
  });

  // If sent by customer/distributor, notify all admins in real-time
  if (message.sender_role !== 'Admin') {
    ioInstance.to('admin_room').emit('message:new_notification', {
      conversationId: conversation.id,
      conversation,
      message
    });
    ioInstance.to('admin_room').emit('conversation:updated', conversation);
  } else {
    // If sent by Admin, notify the target user's personal room
    ioInstance.to(`user_${conversation.user_id}`).emit('message:new_notification', {
      conversationId: conversation.id,
      conversation,
      message
    });
    ioInstance.to(`user_${conversation.user_id}`).emit('conversation:updated', conversation);
  }
};

/**
 * Broadcast message deletion (soft delete)
 */
export const broadcastMessageDeleted = (conversationId, messageId, targetUserId) => {
  if (!ioInstance) return;

  ioInstance.to(`conversation_${conversationId}`).emit('message:deleted', {
    conversationId,
    messageId
  });

  ioInstance.to('admin_room').emit('message:deleted', {
    conversationId,
    messageId
  });

  if (targetUserId) {
    ioInstance.to(`user_${targetUserId}`).emit('message:deleted', {
      conversationId,
      messageId
    });
  }
};

