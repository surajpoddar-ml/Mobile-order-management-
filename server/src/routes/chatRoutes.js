import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { queryGet, queryAll, queryRun } from '../database/db.js';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { broadcastNewMessage, broadcastMessageDeleted } from '../services/socketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure dedicated, isolated chat upload directory
const chatUploadsDir = path.resolve(__dirname, '../../uploads/chat');
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir, { recursive: true });
}

// Multer Storage for Chat Images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, chatUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext) ? ext : '.jpg';
    const randomHex = crypto.randomBytes(8).toString('hex');
    const safeName = `chat_${Date.now()}_${randomHex}${safeExt}`;
    cb(null, safeName);
  }
});

// File filter strictly for images
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only valid image files (JPEG, PNG, WebP, GIF) are allowed in chat.'), false);
  }
};

const chatUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

/**
 * GET /api/chat/my-conversation
 * For Customer or Distributor: gets their single persistent conversation with Admin, creating it if needed
 */
router.get('/my-conversation', verifyToken, async (req, res) => {
  try {
    const user = req.user;
    if (user.userType === 'Admin') {
      return res.status(400).json({ success: false, message: 'Admin uses the admin conversations endpoint.' });
    }

    let conv = await queryGet('SELECT * FROM chat_conversations WHERE user_id = ?', [user.id]);

    if (!conv) {
      const now = new Date().toISOString();
      const token = 'conv_' + crypto.randomBytes(16).toString('hex');
      const insertSql = `
        INSERT INTO chat_conversations (
          conversation_token, user_id, user_type, user_name, user_identifier,
          user_email, user_phone, status, unread_admin_count, unread_user_count,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'open', 0, 0, ?, ?)
      `;

      const result = await queryRun(insertSql, [
        token,
        user.id,
        user.userType,
        user.fullName || 'Valued User',
        user.userId || `USER-${user.id}`,
        user.email || null,
        user.phoneNumber || null,
        now,
        now
      ]);

      conv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [result.lastID]);
    }

    return res.status(200).json({ success: true, conversation: conv });
  } catch (error) {
    console.error('Error in /my-conversation:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve conversation.', error: error.message });
  }
});

/**
 * GET /api/chat/conversations/:id/messages
 * Retrieves conversation message history with pagination
 */
router.get('/conversations/:id/messages', verifyToken, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const { limit = 50, beforeId = null } = req.query;

    const conv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [conversationId]);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Authorization: Normal user can ONLY access their own conversation
    if (req.user.userType !== 'Admin' && conv.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this conversation.' });
    }

    const limitNum = Math.min(100, Math.max(10, parseInt(limit, 10) || 50));
    let querySql = 'SELECT * FROM chat_messages WHERE conversation_id = ?';
    const params = [conversationId];

    if (beforeId) {
      querySql += ' AND id < ?';
      params.push(parseInt(beforeId, 10));
    }

    querySql += ' ORDER BY id DESC LIMIT ?';
    params.push(limitNum + 1);

    const rows = await queryAll(querySql, params);
    const hasMore = rows.length > limitNum;
    const messages = hasMore ? rows.slice(0, limitNum) : rows;

    // Reverse to chronological order (oldest to newest)
    messages.reverse();

    // Mark unread messages as read
    const now = new Date().toISOString();
    if (req.user.userType === 'Admin') {
      await queryRun(
        'UPDATE chat_messages SET is_read = 1, read_at = ? WHERE conversation_id = ? AND sender_role != "Admin" AND is_read = 0',
        [now, conversationId]
      );
      await queryRun('UPDATE chat_conversations SET unread_admin_count = 0, updated_at = ? WHERE id = ?', [now, conversationId]);
    } else {
      await queryRun(
        'UPDATE chat_messages SET is_read = 1, read_at = ? WHERE conversation_id = ? AND sender_role = "Admin" AND is_read = 0',
        [now, conversationId]
      );
      await queryRun('UPDATE chat_conversations SET unread_user_count = 0, updated_at = ? WHERE id = ?', [now, conversationId]);
    }

    return res.status(200).json({
      success: true,
      messages,
      hasMore,
      conversation: conv
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ success: false, message: 'Failed to load messages.', error: error.message });
  }
});

/**
 * POST /api/chat/messages
 * Send text message
 */
router.post('/messages', verifyToken, async (req, res) => {
  try {
    const { conversationId, messageText } = req.body;

    const convId = parseInt(conversationId, 10);
    if (!convId) {
      return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
    }

    const cleanText = (messageText || '').trim();
    if (!cleanText) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty.' });
    }

    const conv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [convId]);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Authorization
    if (req.user.userType !== 'Admin' && conv.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const now = new Date().toISOString();
    const insertSql = `
      INSERT INTO chat_messages (
        conversation_id, sender_id, sender_name, sender_role, message_type,
        message_text, is_read, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'text', ?, 0, ?, ?)
    `;

    const result = await queryRun(insertSql, [
      convId,
      req.user.id,
      req.user.fullName || (req.user.userType === 'Admin' ? 'MWS Eagle Support' : 'Customer'),
      req.user.userType,
      cleanText,
      now,
      now
    ]);

    const createdMsg = await queryGet('SELECT * FROM chat_messages WHERE id = ?', [result.lastID]);

    // Update conversation preview and unread counters
    if (req.user.userType === 'Admin') {
      await queryRun(`
        UPDATE chat_conversations SET 
          last_message_text = ?,
          last_message_at = ?,
          last_sender_role = 'Admin',
          unread_user_count = unread_user_count + 1,
          updated_at = ?
        WHERE id = ?
      `, [cleanText.slice(0, 500), now, now, convId]);
    } else {
      await queryRun(`
        UPDATE chat_conversations SET 
          last_message_text = ?,
          last_message_at = ?,
          last_sender_role = ?,
          unread_admin_count = unread_admin_count + 1,
          updated_at = ?
        WHERE id = ?
      `, [cleanText.slice(0, 500), now, req.user.userType, now, convId]);
    }

    const updatedConv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [convId]);

    // Real-time broadcast via Socket.IO
    broadcastNewMessage(updatedConv, createdMsg);

    return res.status(201).json({
      success: true,
      message: createdMsg,
      conversation: updatedConv
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message.', error: error.message });
  }
});

/**
 * POST /api/chat/messages/upload
 * Upload and send image message
 */
router.post('/messages/upload', verifyToken, (req, res, next) => {
  chatUpload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Image exceeds maximum limit of 10MB.' });
      }
      return res.status(400).json({ success: false, message: 'Upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const convId = parseInt(req.body.conversationId, 10);
    if (!convId) {
      return res.status(400).json({ success: false, message: 'Invalid conversation ID.' });
    }

    const conv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [convId]);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    // Authorization
    if (req.user.userType !== 'Admin' && conv.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const caption = (req.body.caption || '').trim();
    const mediaUrl = `/uploads/chat/${req.file.filename}`;
    const now = new Date().toISOString();

    const insertSql = `
      INSERT INTO chat_messages (
        conversation_id, sender_id, sender_name, sender_role, message_type,
        message_text, media_url, media_type, file_name, file_size, is_read,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'image', ?, ?, ?, ?, ?, 0, ?, ?)
    `;

    const result = await queryRun(insertSql, [
      convId,
      req.user.id,
      req.user.fullName || (req.user.userType === 'Admin' ? 'MWS Eagle Support' : 'Customer'),
      req.user.userType,
      caption || null,
      mediaUrl,
      req.file.mimetype,
      req.file.originalname,
      req.file.size,
      now,
      now
    ]);

    const createdMsg = await queryGet('SELECT * FROM chat_messages WHERE id = ?', [result.lastID]);
    const previewText = caption ? `📷 ${caption}` : '📷 Image';

    // Update conversation
    if (req.user.userType === 'Admin') {
      await queryRun(`
        UPDATE chat_conversations SET 
          last_message_text = ?,
          last_message_at = ?,
          last_sender_role = 'Admin',
          unread_user_count = unread_user_count + 1,
          updated_at = ?
        WHERE id = ?
      `, [previewText, now, now, convId]);
    } else {
      await queryRun(`
        UPDATE chat_conversations SET 
          last_message_text = ?,
          last_message_at = ?,
          last_sender_role = ?,
          unread_admin_count = unread_admin_count + 1,
          updated_at = ?
        WHERE id = ?
      `, [previewText, now, req.user.userType, now, convId]);
    }

    const updatedConv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [convId]);

    // Real-time broadcast
    broadcastNewMessage(updatedConv, createdMsg);

    return res.status(201).json({
      success: true,
      message: createdMsg,
      conversation: updatedConv
    });
  } catch (error) {
    console.error('Error uploading chat image:', error);
    return res.status(500).json({ success: false, message: 'Failed to send image message.', error: error.message });
  }
});

/**
 * PATCH /api/chat/conversations/:id/read
 * Mark conversation as read
 */
router.patch('/conversations/:id/read', verifyToken, async (req, res) => {
  try {
    const conversationId = parseInt(req.params.id, 10);
    const conv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [conversationId]);
    if (!conv) {
      return res.status(404).json({ success: false, message: 'Conversation not found.' });
    }

    if (req.user.userType !== 'Admin' && conv.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized.' });
    }

    const now = new Date().toISOString();
    if (req.user.userType === 'Admin') {
      await queryRun(
        'UPDATE chat_messages SET is_read = 1, read_at = ? WHERE conversation_id = ? AND sender_role != "Admin" AND is_read = 0',
        [now, conversationId]
      );
      await queryRun('UPDATE chat_conversations SET unread_admin_count = 0, updated_at = ? WHERE id = ?', [now, conversationId]);
    } else {
      await queryRun(
        'UPDATE chat_messages SET is_read = 1, read_at = ? WHERE conversation_id = ? AND sender_role = "Admin" AND is_read = 0',
        [now, conversationId]
      );
      await queryRun('UPDATE chat_conversations SET unread_user_count = 0, updated_at = ? WHERE id = ?', [now, conversationId]);
    }

    return res.status(200).json({ success: true, message: 'Conversation marked as read.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark as read.' });
  }
});

/**
 * DELETE /api/chat/messages/:id
 * Soft delete message
 */
router.delete('/messages/:id', verifyToken, async (req, res) => {
  try {
    const messageId = parseInt(req.params.id, 10);
    const msg = await queryGet('SELECT * FROM chat_messages WHERE id = ?', [messageId]);
    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message not found.' });
    }

    const conv = await queryGet('SELECT * FROM chat_conversations WHERE id = ?', [msg.conversation_id]);

    // Permissions check: User can ONLY delete their own messages, Admin can delete any
    if (req.user.userType !== 'Admin' && msg.sender_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own messages.' });
    }

    const now = new Date().toISOString();
    await queryRun(
      'UPDATE chat_messages SET deleted_at = ?, deleted_by_id = ?, updated_at = ? WHERE id = ?',
      [now, req.user.id, now, messageId]
    );

    // Broadcast deletion in real time
    broadcastMessageDeleted(msg.conversation_id, messageId, conv ? conv.user_id : null);

    return res.status(200).json({ success: true, message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete message.' });
  }
});

/**
 * GET /api/chat/admin/conversations
 * Admin: List conversations with filter, search, unread badge
 */
router.get('/admin/conversations', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { userType = 'All', search = '', page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const offset = (pageNum - 1) * limitNum;

    const whereClauses = [];
    const params = [];

    if (userType && userType !== 'All') {
      whereClauses.push('user_type = ?');
      params.push(userType);
    }

    if (search && search.trim()) {
      const q = `%${search.trim()}%`;
      whereClauses.push('(user_name LIKE ? OR user_identifier LIKE ? OR user_email LIKE ? OR user_phone LIKE ? OR last_message_text LIKE ?)');
      params.push(q, q, q, q, q);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRow = await queryGet(`SELECT COUNT(*) as total FROM chat_conversations ${whereSql}`, params);
    const total = countRow ? countRow.total : 0;

    const listSql = `
      SELECT * FROM chat_conversations
      ${whereSql}
      ORDER BY CASE WHEN last_message_at IS NULL THEN 1 ELSE 0 END, last_message_at DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const conversations = await queryAll(listSql, [...params, limitNum, offset]);

    // Total unread for admin
    const unreadRow = await queryGet('SELECT SUM(unread_admin_count) as total_unread FROM chat_conversations');
    const totalUnread = unreadRow?.total_unread || 0;

    return res.status(200).json({
      success: true,
      conversations,
      totalUnread,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching admin conversations:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve conversations.' });
  }
});

/**
 * GET /api/chat/unread-count
 * Quick poll / check for unread message badge
 */
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    if (req.user.userType === 'Admin') {
      const row = await queryGet('SELECT SUM(unread_admin_count) as count FROM chat_conversations');
      return res.status(200).json({ success: true, unreadCount: row?.count || 0 });
    } else {
      const row = await queryGet('SELECT unread_user_count as count FROM chat_conversations WHERE user_id = ?', [req.user.id]);
      return res.status(200).json({ success: true, unreadCount: row?.count || 0 });
    }
  } catch (error) {
    return res.status(500).json({ success: false, unreadCount: 0 });
  }
});

export default router;

