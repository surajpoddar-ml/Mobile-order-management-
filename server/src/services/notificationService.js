import { queryAll, queryGet, queryRun } from '../database/db.js';

/**
 * Creates a notification with automatic deduplication.
 * If dedupKey is supplied and already exists, the creation is skipped.
 */
export const createNotification = async ({
  recipientId,       // 'ADMIN', userId, or user's DB id
  recipientRole,     // 'Admin', 'Customer', 'Distributor'
  title,             // Notification headline
  message,           // Detailed message text
  type,              // 'order_created' | 'payment_submitted' | 'payment_approved' | 'payment_rejected' | 'order_status' | 'distributor_pending' | 'distributor_approved' | 'distributor_rejected' | 'account_status'
  entityId = null,   // orderNumber or userId
  linkUrl = '/',     // destination URL when clicked
  dedupKey = null    // unique deduplication key
}) => {
  try {
    const now = new Date().toISOString();

    if (dedupKey) {
      const existing = await queryGet('SELECT id FROM notifications WHERE dedupKey = ?', [dedupKey]);
      if (existing) {
        // Notification already exists, skip to prevent duplicates
        return { success: true, duplicated: true, id: existing.id };
      }
    }

    const res = await queryRun(
      `INSERT INTO notifications (
        recipientId, recipientRole, title, message, type, entityId, linkUrl, isRead, createdDate, dedupKey
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        recipientId,
        recipientRole || 'All',
        title,
        message,
        type,
        entityId,
        linkUrl,
        now,
        dedupKey
      ]
    );

    return { success: true, duplicated: false, id: res.lastID };
  } catch (error) {
    console.error('[NotificationService] Error creating notification:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Get notifications for a user based on role and identity
 */
export const getUserNotifications = async (user) => {
  try {
    let sql = '';
    let params = [];

    if (user.userType === 'Admin') {
      sql = `
        SELECT * FROM notifications 
        WHERE recipientId = 'ADMIN' 
           OR recipientId = ? 
           OR recipientId = ? 
           OR recipientRole = 'Admin'
        ORDER BY id DESC 
        LIMIT 60
      `;
      params = [String(user.id), user.userId || ''];
    } else {
      sql = `
        SELECT * FROM notifications 
        WHERE recipientId = ? 
           OR recipientId = ? 
           OR recipientId = ?
        ORDER BY id DESC 
        LIMIT 60
      `;
      params = [String(user.id), user.userId || '', user.email || ''];
    }

    const notifications = await queryAll(sql, params);
    const unreadCount = notifications.filter(n => n.isRead === 0).length;

    return {
      success: true,
      count: notifications.length,
      unreadCount,
      notifications
    };
  } catch (error) {
    console.error('[NotificationService] Error fetching notifications:', error);
    return { success: false, notifications: [], unreadCount: 0, error: error.message };
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (id, user) => {
  try {
    await queryRun('UPDATE notifications SET isRead = 1 WHERE id = ?', [id]);
    return { success: true, message: 'Notification marked as read.' };
  } catch (error) {
    console.error('[NotificationService] Error marking as read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Mark all notifications as read for current user
 */
export const markAllNotificationsAsRead = async (user) => {
  try {
    if (user.userType === 'Admin') {
      await queryRun(
        `UPDATE notifications SET isRead = 1 
         WHERE isRead = 0 AND (recipientId = 'ADMIN' OR recipientId = ? OR recipientId = ? OR recipientRole = 'Admin')`,
        [String(user.id), user.userId || '']
      );
    } else {
      await queryRun(
        `UPDATE notifications SET isRead = 1 
         WHERE isRead = 0 AND (recipientId = ? OR recipientId = ? OR recipientId = ?)`,
        [String(user.id), user.userId || '', user.email || '']
      );
    }
    return { success: true, message: 'All notifications marked as read.' };
  } catch (error) {
    console.error('[NotificationService] Error marking all read:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (id) => {
  try {
    await queryRun('DELETE FROM notifications WHERE id = ?', [id]);
    return { success: true, message: 'Notification deleted.' };
  } catch (error) {
    console.error('[NotificationService] Error deleting notification:', error);
    return { success: false, error: error.message };
  }
};
