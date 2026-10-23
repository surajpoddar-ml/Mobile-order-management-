import { queryAll, queryGet, queryRun } from '../database/db.js';

/**
 * Creates a notification with automatic deduplication.
 * If dedupKey is supplied and already exists, the creation is skipped.
 */
export const createNotification = async ({
  recipientId,       // 'ADMIN', userId, or user's DB id, or 'ALL'
  recipientRole,     // 'Admin', 'Customer', 'Distributor', 'All'
  title,             // Notification headline
  message,           // Detailed message text
  type,              // 'order_created' | 'payment_submitted' | 'payment_approved' | 'payment_rejected' | 'order_status' | 'distributor_pending' | 'distributor_approved' | 'distributor_rejected' | 'account_status' | 'product_created' | 'product_updated' | 'product_stock' | 'product_visibility'
  entityId = null,   // orderNumber or userId or productId
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
        String(recipientId),
        recipientRole || 'All',
        title,
        message,
        type,
        entityId ? String(entityId) : null,
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
 * Broadcast notifications to all active users belonging to a specific role (Customer, Distributor, Admin, or All).
 * This ensures each active user gets their own notification record with independent read tracking.
 */
export const notifyUsersByRole = async ({
  role,              // 'Customer' | 'Distributor' | 'Admin' | 'All'
  title,
  message,
  type,
  entityId = null,
  linkUrl = '/',
  dedupKeyPrefix = null
}) => {
  try {
    if (role === 'Admin') {
      const adminDedup = dedupKeyPrefix ? `${dedupKeyPrefix}_ADMIN` : null;
      await createNotification({
        recipientId: 'ADMIN',
        recipientRole: 'Admin',
        title,
        message,
        type,
        entityId,
        linkUrl,
        dedupKey: adminDedup
      });

      // Also notify any specific admin user accounts
      const admins = await queryAll("SELECT id, userType, email FROM users WHERE userType = 'Admin' AND accountStatus = 'Active'");
      for (const a of admins) {
        const uDedup = dedupKeyPrefix ? `${dedupKeyPrefix}_admin_${a.id}` : null;
        await createNotification({
          recipientId: String(a.id),
          recipientRole: 'Admin',
          title,
          message,
          type,
          entityId,
          linkUrl,
          dedupKey: uDedup
        });
      }
      return { success: true, count: admins.length + 1 };
    }

    // Role is 'Customer', 'Distributor', or 'All'
    let users = [];
    if (role === 'All') {
      users = await queryAll("SELECT id, userType, email FROM users WHERE accountStatus = 'Active'");
    } else {
      users = await queryAll("SELECT id, userType, email FROM users WHERE userType = ? AND accountStatus = 'Active'", [role]);
    }

    const tasks = users.map(u => {
      const uDedup = dedupKeyPrefix ? `${dedupKeyPrefix}_user_${u.id}` : null;
      return createNotification({
        recipientId: String(u.id),
        recipientRole: u.userType,
        title,
        message,
        type,
        entityId,
        linkUrl,
        dedupKey: uDedup
      });
    });

    await Promise.allSettled(tasks);
    return { success: true, count: users.length };
  } catch (error) {
    console.error(`[NotificationService] Error notifying ${role} users:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Dispatches notifications across Customer, Distributor, and Admin
 * on product events: 'created' | 'updated' | 'stock_changed' | 'visibility_changed' | 'deleted'
 */
export const notifyProductEvent = async ({
  product,
  eventType, // 'created' | 'updated' | 'stock_changed' | 'visibility_changed' | 'deleted'
  details = {}
}) => {
  if (!product) return;

  try {
    const isShowCust = product.showOnCustomerPortal === 1 || product.showOnCustomerPortal === true || product.showOnCustomerPortal === '1';
    const isShowDist = product.showOnDistributorPortal === 1 || product.showOnDistributorPortal === true || product.showOnDistributorPortal === '1';
    const isActiveStatus = (product.productStatus || 'Active') === 'Active';
    const isInStock = product.inStock === 1 || product.inStock === true || product.inStock === '1';
    const custPrice = Number(product.customerPrice || 0).toLocaleString();
    const distPrice = Number(product.distributorPrice || 0).toLocaleString();

    const timestamp = Date.now();

    switch (eventType) {
      // 1. PRODUCT CREATED
      case 'created': {
        const dedupPrefix = `prod_created_${product.id}`;

        // Admin Notification
        await notifyUsersByRole({
          role: 'Admin',
          title: `✨ New Product Added: ${product.name}`,
          message: `Product "${product.name}" (SKU: ${product.sku}) created. Customer: ₹${custPrice} (${isShowCust ? 'Active' : 'Hidden'}), Distributor: ₹${distPrice} (${isShowDist ? 'Active' : 'Hidden'}).`,
          type: 'product_created',
          entityId: product.id,
          linkUrl: '/admin?tab=products',
          dedupKeyPrefix: `${dedupPrefix}_admin`
        });

        // Customer Notification (if enabled on Customer Portal & Active)
        if (isShowCust && isActiveStatus) {
          await notifyUsersByRole({
            role: 'Customer',
            title: `✨ New Arrival: ${product.name}`,
            message: `New ${product.category || 'accessory'} "${product.name}" is now available at ₹${custPrice}! Check it out now.`,
            type: 'product_created',
            entityId: product.id,
            linkUrl: '/portal/customer',
            dedupKeyPrefix: `${dedupPrefix}_cust`
          });
        }

        // Distributor Notification (if enabled on Distributor Portal & Active)
        if (isShowDist && isActiveStatus) {
          await notifyUsersByRole({
            role: 'Distributor',
            title: `📦 New Wholesale Item: ${product.name}`,
            message: `New inventory item "${product.name}" (SKU: ${product.sku}) added to wholesale catalog at ₹${distPrice}.`,
            type: 'product_created',
            entityId: product.id,
            linkUrl: '/portal/distributor',
            dedupKeyPrefix: `${dedupPrefix}_dist`
          });
        }
        break;
      }

      // 2. PRODUCT UPDATED (Details, Price, Specs)
      case 'updated': {
        const dedupPrefix = `prod_updated_${product.id}_${timestamp}`;

        // Admin Notification
        await notifyUsersByRole({
          role: 'Admin',
          title: `📝 Product Updated: ${product.name}`,
          message: `"${product.name}" (SKU: ${product.sku}) was updated. Customer: ₹${custPrice} | Distributor: ₹${distPrice}.`,
          type: 'product_updated',
          entityId: product.id,
          linkUrl: '/admin?tab=products',
          dedupKeyPrefix: `${dedupPrefix}_admin`
        });

        // Customer Notification (if enabled on Customer Portal & Active)
        if (isShowCust && isActiveStatus) {
          await notifyUsersByRole({
            role: 'Customer',
            title: `🔄 Product Updated: ${product.name}`,
            message: `Updated specs & price (₹${custPrice}) for "${product.name}". Discover the latest features and offers!`,
            type: 'product_updated',
            entityId: product.id,
            linkUrl: '/portal/customer',
            dedupKeyPrefix: `${dedupPrefix}_cust`
          });
        }

        // Distributor Notification (if enabled on Distributor Portal & Active)
        if (isShowDist && isActiveStatus) {
          await notifyUsersByRole({
            role: 'Distributor',
            title: `🔄 Wholesale Catalog Update: ${product.name}`,
            message: `Wholesale pricing & catalog update for "${product.name}" (SKU: ${product.sku}). B2B Price: ₹${distPrice}.`,
            type: 'product_updated',
            entityId: product.id,
            linkUrl: '/portal/distributor',
            dedupKeyPrefix: `${dedupPrefix}_dist`
          });
        }
        break;
      }

      // 3. PRODUCT STOCK TOGGLED (In Stock / Out of Stock)
      case 'stock_changed': {
        const dedupPrefix = `prod_stock_${product.id}_${timestamp}`;

        // Admin Notification
        await notifyUsersByRole({
          role: 'Admin',
          title: `📦 Stock Changed: ${product.name}`,
          message: `"${product.name}" (SKU: ${product.sku}) is now marked ${isInStock ? 'IN STOCK' : 'OUT OF STOCK'}.`,
          type: 'product_stock',
          entityId: product.id,
          linkUrl: '/admin?tab=products',
          dedupKeyPrefix: `${dedupPrefix}_admin`
        });

        // Customer Notification
        if (isShowCust) {
          const custTitle = isInStock ? `🎉 Back in Stock: ${product.name}` : `⚠️ Stock Notice: ${product.name}`;
          const custMsg = isInStock
            ? `Great news! "${product.name}" is back in stock at ₹${custPrice}. Order before stock runs out!`
            : `"${product.name}" is currently out of stock. We will notify you as soon as it is restocked.`;

          await notifyUsersByRole({
            role: 'Customer',
            title: custTitle,
            message: custMsg,
            type: 'product_stock',
            entityId: product.id,
            linkUrl: '/portal/customer',
            dedupKeyPrefix: `${dedupPrefix}_cust`
          });
        }

        // Distributor Notification
        if (isShowDist) {
          const distTitle = isInStock ? `📦 Restocked for Wholesale: ${product.name}` : `⚠️ Wholesale Stock Notice: ${product.name}`;
          const distMsg = isInStock
            ? `"${product.name}" (SKU: ${product.sku}) is restocked and available for wholesale orders at ₹${distPrice}.`
            : `"${product.name}" (SKU: ${product.sku}) bulk inventory is temporarily sold out.`;

          await notifyUsersByRole({
            role: 'Distributor',
            title: distTitle,
            message: distMsg,
            type: 'product_stock',
            entityId: product.id,
            linkUrl: '/portal/distributor',
            dedupKeyPrefix: `${dedupPrefix}_dist`
          });
        }
        break;
      }

      // 4. PORTAL VISIBILITY TOGGLED
      case 'visibility_changed': {
        const dedupPrefix = `prod_vis_${product.id}_${timestamp}`;

        // Admin Notification
        await notifyUsersByRole({
          role: 'Admin',
          title: `👁️ Visibility Changed: ${product.name}`,
          message: `"${product.name}" visibility updated: Customer (${isShowCust ? 'ACTIVE' : 'HIDDEN'}), Distributor (${isShowDist ? 'ACTIVE' : 'HIDDEN'}).`,
          type: 'product_visibility',
          entityId: product.id,
          linkUrl: '/admin?tab=products',
          dedupKeyPrefix: `${dedupPrefix}_admin`
        });

        // Customer Notification if newly enabled
        if (isShowCust && isActiveStatus) {
          await notifyUsersByRole({
            role: 'Customer',
            title: `✨ Now in Store: ${product.name}`,
            message: `"${product.name}" is now available in our store at ₹${custPrice}! Check it out now.`,
            type: 'product_created',
            entityId: product.id,
            linkUrl: '/portal/customer',
            dedupKeyPrefix: `${dedupPrefix}_cust`
          });
        }

        // Distributor Notification if newly enabled
        if (isShowDist && isActiveStatus) {
          await notifyUsersByRole({
            role: 'Distributor',
            title: `📦 Wholesale Access: ${product.name}`,
            message: `"${product.name}" (SKU: ${product.sku}) is now active in your wholesale catalog at ₹${distPrice}.`,
            type: 'product_created',
            entityId: product.id,
            linkUrl: '/portal/distributor',
            dedupKeyPrefix: `${dedupPrefix}_dist`
          });
        }
        break;
      }

      // 5. PRODUCT DELETED
      case 'deleted': {
        const dedupPrefix = `prod_del_${product.id}_${timestamp}`;
        await notifyUsersByRole({
          role: 'Admin',
          title: `🗑️ Product Deleted: ${product.name}`,
          message: `Product "${product.name}" (SKU: ${product.sku}) was deleted from catalog.`,
          type: 'product_updated',
          entityId: product.id,
          linkUrl: '/admin?tab=products',
          dedupKeyPrefix: `${dedupPrefix}_admin`
        });
        break;
      }

      default:
        break;
    }
  } catch (error) {
    console.error('[NotificationService] Error in notifyProductEvent:', error);
  }
};

/**
 * Get notifications for a user based on role and identity.
 * Accurately supports targeted user notifications, role-based announcements, and admin alerts.
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
           OR recipientId = 'ALL'
           OR recipientRole = 'Admin'
           OR recipientRole = 'All'
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
           OR (recipientId = 'ALL' AND (recipientRole = ? OR recipientRole = 'All'))
           OR (recipientId = 'CUSTOMER_ALL' AND ? = 'Customer')
           OR (recipientId = 'DISTRIBUTOR_ALL' AND ? = 'Distributor')
           OR recipientRole = ?
           OR recipientRole = 'All'
        ORDER BY id DESC 
        LIMIT 60
      `;
      params = [
        String(user.id),
        user.userId || '',
        user.email || '',
        user.userType,
        user.userType,
        user.userType,
        user.userType
      ];
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
         WHERE isRead = 0 AND (
           recipientId = 'ADMIN' 
           OR recipientId = ? 
           OR recipientId = ? 
           OR recipientId = 'ALL' 
           OR recipientRole = 'Admin' 
           OR recipientRole = 'All'
         )`,
        [String(user.id), user.userId || '']
      );
    } else {
      await queryRun(
        `UPDATE notifications SET isRead = 1 
         WHERE isRead = 0 AND (
           recipientId = ? 
           OR recipientId = ? 
           OR recipientId = ?
           OR (recipientId = 'ALL' AND (recipientRole = ? OR recipientRole = 'All'))
           OR (recipientId = 'CUSTOMER_ALL' AND ? = 'Customer')
           OR (recipientId = 'DISTRIBUTOR_ALL' AND ? = 'Distributor')
           OR recipientRole = ?
           OR recipientRole = 'All'
         )`,
        [
          String(user.id),
          user.userId || '',
          user.email || '',
          user.userType,
          user.userType,
          user.userType,
          user.userType
        ]
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
