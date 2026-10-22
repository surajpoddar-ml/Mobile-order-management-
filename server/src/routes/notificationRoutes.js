import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '../services/notificationService.js';

const router = express.Router();

// All notification routes require authenticated token
router.use(verifyToken);

/**
 * 1. GET /api/notifications
 * Fetch user's notification list and unread count
 */
router.get('/', async (req, res) => {
  try {
    const result = await getUserNotifications(req.user);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
});

/**
 * 2. PATCH /api/notifications/:id/read
 * Mark single notification as read
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await markNotificationAsRead(id, req.user);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

/**
 * 3. PATCH /api/notifications/read-all
 * Mark all user notifications as read
 */
router.patch('/read-all', async (req, res) => {
  try {
    const result = await markAllNotificationsAsRead(req.user);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return res.status(500).json({ success: false, message: 'Failed to mark all as read.' });
  }
});

/**
 * 4. DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteNotification(id);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error deleting notification:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
});

export default router;
