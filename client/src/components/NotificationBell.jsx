import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Bell,
  Check,
  CheckCheck,
  ShoppingCart,
  QrCode,
  CheckCircle2,
  XCircle,
  Truck,
  Building2,
  ShieldCheck,
  AlertCircle,
  Clock,
  ExternalLink,
  Trash2,
  Sparkles
} from 'lucide-react';

export const NotificationBell = () => {
  const { user, navigate } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async (isSilent = false) => {
    if (!user) return;
    if (!isSilent) setLoading(true);
    try {
      const res = await api.notifications.getAll();
      if (res.success && Array.isArray(res.notifications)) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // Auto-polling every 15 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    // Event listener for immediate refresh after user actions (order placed, proof submitted, status changed)
    const handleRefresh = () => fetchNotifications(true);
    window.addEventListener('mws_notifications_refresh', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mws_notifications_refresh', handleRefresh);
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.notifications.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await handleMarkAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.linkUrl) {
      navigate(notif.linkUrl);
    }
  };

  // Format relative time helper
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Get matching icon and accent colors by notification type
  const getTypeConfig = (type) => {
    switch (type) {
      case 'order_created':
        return {
          icon: ShoppingCart,
          color: '#2563eb',
          bg: 'rgba(37, 99, 235, 0.1)'
        };
      case 'payment_submitted':
        return {
          icon: QrCode,
          color: '#d97706',
          bg: 'rgba(217, 119, 6, 0.1)'
        };
      case 'payment_approved':
        return {
          icon: CheckCircle2,
          color: '#059669',
          bg: 'rgba(5, 150, 105, 0.1)'
        };
      case 'payment_rejected':
        return {
          icon: XCircle,
          color: '#dc2626',
          bg: 'rgba(220, 38, 38, 0.1)'
        };
      case 'order_status':
        return {
          icon: Truck,
          color: '#4f46e5',
          bg: 'rgba(79, 70, 229, 0.1)'
        };
      case 'distributor_applied':
        return {
          icon: Building2,
          color: '#0284c7',
          bg: 'rgba(2, 132, 199, 0.1)'
        };
      case 'distributor_approved':
        return {
          icon: ShieldCheck,
          color: '#059669',
          bg: 'rgba(5, 150, 105, 0.1)'
        };
      case 'distributor_rejected':
      case 'account_suspended':
        return {
          icon: AlertCircle,
          color: '#dc2626',
          bg: 'rgba(220, 38, 38, 0.1)'
        };
      default:
        return {
          icon: Bell,
          color: '#64748b',
          bg: 'rgba(100, 116, 139, 0.1)'
        };
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  // If no user is logged in, don't show the notification bell
  if (!user) return null;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: isOpen ? '#f1f5f9' : 'transparent',
          border: '1.5px solid #e2e8f0',
          borderRadius: '50%',
          width: '38px',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isOpen ? '#2563eb' : '#1e293b',
          transition: 'all 0.18s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.backgroundColor = '#f8fafc';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.backgroundColor = isOpen ? '#f1f5f9' : 'transparent';
        }}
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '0.66rem',
              fontWeight: 800,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9999px',
              padding: '0 4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 0 2px #ffffff',
              lineHeight: 1
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 'clamp(320px, 92vw, 410px)',
            maxHeight: '520px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px -8px rgba(15, 23, 42, 0.18), 0 0 0 1px rgba(15, 23, 42, 0.05)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'rgba(37, 99, 235, 0.1)',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bell size={15} />
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                Notifications
              </div>
              {unreadCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px'
                  }}
                >
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Pills (All / Unread) */}
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff'
            }}
          >
            <button
              type="button"
              onClick={() => setFilter('all')}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: filter === 'all' ? '1px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: filter === 'all' ? '#2563eb' : '#f8fafc',
                color: filter === 'all' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              style={{
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.76rem',
                fontWeight: 700,
                border: filter === 'unread' ? '1px solid #2563eb' : '1px solid #e2e8f0',
                backgroundColor: filter === 'unread' ? '#2563eb' : '#f8fafc',
                color: filter === 'unread' ? '#ffffff' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div
            style={{
              overflowY: 'auto',
              maxHeight: '360px',
              backgroundColor: '#ffffff'
            }}
          >
            {loading && notifications.length === 0 ? (
              <div
                style={{
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.86rem'
                }}
              >
                Loading notifications...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: '#64748b',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8'
                  }}
                >
                  <Bell size={22} />
                </div>
                <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Updates on orders, payments, and approvals will appear here.
                </div>
              </div>
            ) : (
              filteredNotifications.map((notif) => {
                const typeConf = getTypeConfig(notif.type);
                const IconComponent = typeConf.icon;
                const isUnread = !notif.isRead;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f1f5f9',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer',
                      backgroundColor: isUnread ? '#f8faff' : '#ffffff',
                      transition: 'background-color 0.15s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#f0f6ff' : '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isUnread ? '#f8faff' : '#ffffff';
                    }}
                  >
                    {/* Unread Left Indicator Bar */}
                    {isUnread && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '3.5px',
                          backgroundColor: '#2563eb'
                        }}
                      />
                    )}

                    {/* Icon Circle */}
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        backgroundColor: typeConf.bg,
                        color: typeConf.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      <IconComponent size={17} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: '8px',
                          marginBottom: '2px'
                        }}
                      >
                        <div
                          style={{
                            fontSize: '0.85rem',
                            fontWeight: isUnread ? 800 : 700,
                            color: isUnread ? '#0f172a' : '#334155',
                            lineHeight: 1.3
                          }}
                        >
                          {notif.title}
                        </div>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: '#94a3b8',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {formatTimeAgo(notif.createdDate)}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#475569',
                          lineHeight: 1.45,
                          marginBottom: '4px',
                          wordBreak: 'break-word'
                        }}
                      >
                        {notif.message}
                      </div>

                      {notif.linkUrl && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: '#2563eb',
                            marginTop: '2px'
                          }}
                        >
                          <span>View Details</span>
                          <ExternalLink size={11} />
                        </div>
                      )}
                    </div>

                    {/* Mark as read single button */}
                    {isUnread && (
                      <button
                        type="button"
                        onClick={(e) => handleMarkAsRead(notif.id, e)}
                        title="Mark as read"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          padding: '4px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#2563eb';
                          e.currentTarget.style.backgroundColor = '#eff6ff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#94a3b8';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
