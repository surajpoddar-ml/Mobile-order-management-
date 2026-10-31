import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getSocket } from '../../services/socket';
import { LiveChatWindow } from './LiveChatWindow';
import {
  MessageSquare,
  Search,
  Users,
  Building2,
  Clock,
  RefreshCw,
  AlertCircle,
  ArrowLeft,
  CheckCheck,
  Headphones
} from 'lucide-react';

export const AdminChatManagement = ({ currentUser }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Customer' | 'Distributor'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [totalUnread, setTotalUnread] = useState(0);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'

  // Load conversations from backend
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.chat.getAdminConversations({
        userType: activeTab,
        search: searchTerm,
        limit: 100
      });
      if (res.success) {
        setConversations(res.conversations || []);
        if (typeof res.totalUnread !== 'undefined') {
          setTotalUnread(res.totalUnread);
        }

        // If currently selected conversation updated, update its local state
        if (selectedConversation) {
          const match = (res.conversations || []).find((c) => c.id === selectedConversation.id);
          if (match) setSelectedConversation(match);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [activeTab, searchTerm]);

  // Real-time socket listeners for Admin
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Listen for conversation updates (new messages, unread count change)
    const handleConversationUpdated = (updatedConv) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === updatedConv.id);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = { ...copy[index], ...updatedConv };
          // Sort with updated at the top
          return copy.sort((a, b) => new Date(b.last_message_at || 0) - new Date(a.last_message_at || 0));
        } else {
          return [updatedConv, ...prev];
        }
      });

      // Recalculate total unread
      setTotalUnread((prev) => (updatedConv.unread_admin_count > 0 ? prev + 1 : prev));
    };

    const handleNewNotification = (payload) => {
      if (payload.conversation) {
        handleConversationUpdated(payload.conversation);
      }
    };

    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('message:new_notification', handleNewNotification);

    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('message:new_notification', handleNewNotification);
    };
  }, []);

  const handleSelectConversation = (conv) => {
    setSelectedConversation(conv);
    setMobileView('chat');

    // Mark as read immediately on client state
    if (conv.unread_admin_count > 0) {
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? { ...c, unread_admin_count: 0 } : c))
      );
      setTotalUnread((prev) => Math.max(0, prev - conv.unread_admin_count));
      api.chat.markAsRead(conv.id).catch(() => {});
    }
  };

  const formatTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const customerUnreadCount = conversations
    .filter((c) => c.user_type === 'Customer')
    .reduce((sum, c) => sum + (c.unread_admin_count || 0), 0);

  const distributorUnreadCount = conversations
    .filter((c) => c.user_type === 'Distributor')
    .reduce((sum, c) => sum + (c.unread_admin_count || 0), 0);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)',
      background: '#ffffff',
      borderRadius: '16px',
      border: '1.5px solid var(--border-medium)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden'
    }}>
      {/* ======================================================== */}
      {/* TOP HEADER & SEARCH / FILTER TABS                        */}
      {/* ======================================================== */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-medium)',
        background: '#ffffff',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px'
      }}>
        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageSquare size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
              Live Messages & Customer Support
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Direct real-time communication with Customers and Distributors
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* User Type Tabs */}
          <div style={{
            display: 'flex',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('All')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'All' ? '#ffffff' : 'transparent',
                color: activeTab === 'All' ? '#0284c7' : '#64748b',
                fontWeight: activeTab === 'All' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'All' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              All
              {totalUnread > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {totalUnread}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Customer')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'Customer' ? '#ffffff' : 'transparent',
                color: activeTab === 'Customer' ? '#0284c7' : '#64748b',
                fontWeight: activeTab === 'Customer' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'Customer' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={14} />
              Customers
              {customerUnreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {customerUnreadCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('Distributor')}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'Distributor' ? '#ffffff' : 'transparent',
                color: activeTab === 'Distributor' ? '#0284c7' : '#64748b',
                fontWeight: activeTab === 'Distributor' ? 800 : 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'Distributor' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Building2 size={14} />
              Distributors
              {distributorUnreadCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: '10px'
                }}>
                  {distributorUnreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search chat or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '7px 12px 7px 32px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-medium)',
                fontSize: '0.82rem',
                background: '#f8fafc',
                outline: 'none',
                width: '180px'
              }}
            />
          </div>

          <button
            type="button"
            onClick={fetchConversations}
            title="Refresh conversations"
            style={{
              padding: '7px 10px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-medium)',
              background: '#ffffff',
              color: '#64748b',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={15} className={loading ? 'spin-animation' : ''} />
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SPLIT LAYOUT: CONVERSATION LIST & ACTIVE CHAT WINDOW      */}
      {/* ======================================================== */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* LEFT COLUMN: CONVERSATION LIST */}
        <div style={{
          width: '320px',
          borderRight: '1px solid var(--border-medium)',
          display: mobileView === 'chat' ? 'none' : 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          overflowY: 'auto',
          flexShrink: 0
        }} className="admin-chat-list-panel">
          {loading && conversations.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              <RefreshCw size={20} className="spin-animation" style={{ margin: '0 auto 8px auto', color: '#0284c7' }} />
              <div style={{ fontSize: '0.84rem' }}>Loading conversations...</div>
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569' }}>No Conversations Found</div>
              <div style={{ fontSize: '0.76rem', marginTop: '4px' }}>
                {searchTerm ? 'No user matches your search.' : 'Customer and distributor chats will appear here.'}
              </div>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const hasUnread = (conv.unread_admin_count || 0) > 0;
              const isDistributor = conv.user_type === 'Distributor';

              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    background: isSelected ? '#f0f9ff' : hasUnread ? '#fefce8' : '#ffffff',
                    borderLeft: isSelected ? '4px solid #0284c7' : '4px solid transparent',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = hasUnread ? '#fefce8' : '#ffffff';
                    }
                  }}
                >
                  {/* User Initial Avatar */}
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: isDistributor ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {(conv.user_name || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Conversation Meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                      <span style={{
                        fontWeight: hasUnread ? 800 : 700,
                        fontSize: '0.88rem',
                        color: '#0f172a',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {conv.user_name}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', flexShrink: 0 }}>
                        {formatTime(conv.last_message_at || conv.updated_at)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '0.64rem',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: isDistributor ? '#fef3c7' : '#e0f2fe',
                        color: isDistributor ? '#b45309' : '#0284c7'
                      }}>
                        {conv.user_type}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>
                        {conv.user_identifier}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.78rem',
                        color: hasUnread ? '#0f172a' : '#64748b',
                        fontWeight: hasUnread ? 700 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '180px'
                      }}>
                        {conv.last_message_text || 'Conversation initiated.'}
                      </span>

                      {/* Unread Counter Badge */}
                      {hasUnread && (
                        <span style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          fontSize: '0.64rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: '10px',
                          flexShrink: 0
                        }}>
                          {conv.unread_admin_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN: ACTIVE CHAT WINDOW */}
        <div style={{
          flex: 1,
          display: mobileView === 'list' ? 'none' : 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          position: 'relative'
        }} className="admin-chat-window-panel">
          {selectedConversation ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Mobile Back Button */}
              <div style={{
                padding: '8px 12px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }} className="admin-mobile-chat-back-bar">
                <button
                  type="button"
                  onClick={() => setMobileView('list')}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#0284c7',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <ArrowLeft size={14} />
                  Back to All Conversations
                </button>
              </div>

              {/* Embedded Live Chat Window */}
              <LiveChatWindow
                key={selectedConversation.id}
                conversationId={selectedConversation.id}
                recipientName={selectedConversation.user_name}
                recipientRole={selectedConversation.user_type}
                recipientSubtitle={`${selectedConversation.user_identifier}${selectedConversation.user_phone ? ' • ' + selectedConversation.user_phone : ''}${selectedConversation.user_email ? ' • ' + selectedConversation.user_email : ''}`}
                currentUser={currentUser}
                embedded={true}
              />
            </div>
          ) : (
            <div style={{
              margin: 'auto',
              textAlign: 'center',
              padding: '60px 20px',
              color: '#94a3b8',
              maxWidth: '360px'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto',
                color: '#0284c7'
              }}>
                <MessageSquare size={32} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: '0 0 6px 0' }}>
                Select a Conversation
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                Choose a customer or distributor from the list on the left to review message history, send replies, or share images.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (min-width: 769px) {
          .admin-chat-list-panel {
            display: flex !important;
          }
          .admin-chat-window-panel {
            display: flex !important;
          }
          .admin-mobile-chat-back-bar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminChatManagement;

