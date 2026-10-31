import React, { useState, useEffect, useRef } from 'react';
import { getSocket } from '../../services/socket';
import api, { getMediaUrl } from '../../services/api';
import {
  Send,
  Image as ImageIcon,
  X,
  Trash2,
  Check,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  Shield,
  Headphones,
  User,
  ArrowDown
} from 'lucide-react';

export const LiveChatWindow = ({
  conversationId: propConversationId = null,
  recipientName = 'MWS Eagle Official Support',
  recipientRole = 'Admin',
  recipientSubtitle = null,
  currentUser = null,
  onClose = null,
  embedded = false,
  height = '620px'
}) => {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isTypingRemote, setIsTypingRemote] = useState(false);
  const [remoteTypingUser, setRemoteTypingUser] = useState('');
  const [socketConnected, setSocketConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [fullImageModal, setFullImageModal] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeConvId = propConversationId || conversation?.id;

  // 1. Fetch conversation
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setErrorMsg('');

    const initConversation = async () => {
      try {
        let conv = null;
        if (propConversationId) {
          // Admin viewing specific conversation or explicit prop
          const res = await api.chat.getMessages(propConversationId, { limit: 60 });
          if (res.success && isMounted) {
            setConversation(res.conversation);
            setMessages(res.messages || []);
          }
        } else {
          // Customer or Distributor fetching their persistent conversation
          const res = await api.chat.getMyConversation();
          if (res.success && res.conversation && isMounted) {
            conv = res.conversation;
            setConversation(conv);
            const msgRes = await api.chat.getMessages(conv.id, { limit: 60 });
            if (msgRes.success && isMounted) {
              setMessages(msgRes.messages || []);
            }
          }
        }
      } catch (err) {
        console.error('Failed to initialize conversation:', err);
        if (isMounted) setErrorMsg(err.data?.message || err.message || 'Failed to connect to chat.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initConversation();

    return () => {
      isMounted = false;
    };
  }, [propConversationId]);

  // 2. Real-time Socket Connection & Listeners
  useEffect(() => {
    if (!activeConvId) return;

    const socket = getSocket();
    if (!socket) return;

    setSocketConnected(socket.connected);

    const onConnect = () => {
      setSocketConnected(true);
      socket.emit('conversation:join', { conversationId: activeConvId });
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    // Join room immediately if already connected
    if (socket.connected) {
      socket.emit('conversation:join', { conversationId: activeConvId });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Listen for new messages
    const handleNewMessage = (payload) => {
      if (payload.conversationId === activeConvId && payload.message) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });

        // Mark as read in real-time if message from the other party
        if (payload.message.sender_id !== currentUser?.id) {
          socket.emit('message:read', { conversationId: activeConvId });
        }
      }
    };

    // Listen for read acknowledgments
    const handleReadAck = (payload) => {
      if (payload.conversationId === activeConvId) {
        setMessages((prev) =>
          prev.map((m) => (m.is_read === 0 ? { ...m, is_read: 1, read_at: payload.readAt } : m))
        );
      }
    };

    // Listen for typing indicators
    const handleUserTyping = (payload) => {
      if (payload.conversationId === activeConvId && payload.senderId !== currentUser?.id) {
        setIsTypingRemote(payload.isTyping);
        setRemoteTypingUser(payload.senderName || 'Support');
        if (payload.isTyping) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsTypingRemote(false);
          }, 3500);
        }
      }
    };

    // Listen for message deletion
    const handleMessageDeleted = (payload) => {
      if (payload.conversationId === activeConvId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId
              ? { ...m, deleted_at: new Date().toISOString() }
              : m
          )
        );
      }
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:read_ack', handleReadAck);
    socket.on('user:typing', handleUserTyping);
    socket.on('message:deleted', handleMessageDeleted);

    return () => {
      socket.emit('conversation:leave', { conversationId: activeConvId });
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', handleNewMessage);
      socket.off('message:read_ack', handleReadAck);
      socket.off('user:typing', handleUserTyping);
      socket.off('message:deleted', handleMessageDeleted);
      clearTimeout(typingTimeoutRef.current);
    };
  }, [activeConvId, currentUser?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTypingRemote]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 100;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // Typing event dispatcher
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    const socket = getSocket();
    if (socket && activeConvId) {
      socket.emit('typing:start', { conversationId: activeConvId });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', { conversationId: activeConvId });
      }, 2000);
    }
  };

  // Send Text Message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending || !activeConvId) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    const socket = getSocket();
    if (socket) {
      socket.emit('typing:stop', { conversationId: activeConvId });
    }

    try {
      const res = await api.chat.sendMessage({
        conversationId: activeConvId,
        messageText: text
      });

      if (res.success && res.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message.id)) return prev;
          return [...prev, res.message];
        });
      }
    } catch (err) {
      console.error('Send error:', err);
      alert(err.data?.message || err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Image Selection & Preview
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image size exceeds 10MB limit.');
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Cancel Image Preview
  const cancelImagePreview = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageCaption('');
  };

  // Send Image Message
  const handleSendImage = async () => {
    if (!selectedImage || sending || !activeConvId) return;

    setSending(true);
    try {
      const res = await api.chat.uploadImage({
        conversationId: activeConvId,
        file: selectedImage,
        caption: imageCaption.trim()
      });

      if (res.success && res.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message.id)) return prev;
          return [...prev, res.message];
        });
        cancelImagePreview();
      }
    } catch (err) {
      console.error('Image upload error:', err);
      alert(err.data?.message || err.message || 'Failed to upload chat image.');
    } finally {
      setSending(false);
    }
  };

  // Soft Delete Message
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete this message for everyone?')) return;

    try {
      const res = await api.chat.deleteMessage(msgId);
      if (res.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, deleted_at: new Date().toISOString() } : m))
        );
      }
    } catch (err) {
      alert(err.data?.message || err.message || 'Failed to delete message.');
    }
  };

  const formatMessageTime = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
      return '';
    }
  };

  const formatMessageDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: embedded ? '100%' : height,
      maxHeight: embedded ? '100%' : '85vh',
      background: '#ffffff',
      borderRadius: embedded ? '0' : '16px',
      border: embedded ? 'none' : '1px solid var(--border-medium)',
      boxShadow: embedded ? 'none' : '0 8px 30px rgba(0, 0, 0, 0.12)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'inherit'
    }}>
      {/* ======================================================== */}
      {/* CHAT HEADER                                              */}
      {/* ======================================================== */}
      <div style={{
        padding: '12px 18px',
        background: 'linear-gradient(135deg, #031738 0%, #0a2559 100%)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar with Status Dot */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: recipientRole === 'Admin' ? 'rgba(2, 132, 199, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1rem'
            }}>
              {recipientRole === 'Admin' ? <Headphones size={20} /> : <User size={20} />}
            </div>
            <span style={{
              position: 'absolute',
              bottom: '1px',
              right: '1px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: socketConnected ? '#22c55e' : '#94a3b8',
              border: '2px solid #031738'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#ffffff' }}>
                {recipientName}
              </span>
              <span style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '10px',
                background: recipientRole === 'Admin' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(251, 191, 36, 0.25)',
                color: recipientRole === 'Admin' ? '#7dd3fc' : '#fde047',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                {recipientRole}
              </span>
            </div>

            <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              {isTypingRemote ? (
                <span style={{ color: '#38bdf8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span className="spin-animation">●</span> {remoteTypingUser} is typing...
                </span>
              ) : (
                <span>{recipientSubtitle || (socketConnected ? 'Live Connection Active' : 'Connecting to real-time chat...')}</span>
              )}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s'
            }}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Disconnect Warning */}
      {!socketConnected && (
        <div style={{
          background: '#fffbeb',
          borderBottom: '1px solid #fef08a',
          padding: '6px 14px',
          fontSize: '0.74rem',
          color: '#b45309',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span>Real-time connection reconnecting... Messages will continue to save securely.</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* MESSAGE STREAM AREA                                      */}
      {/* ======================================================== */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          background: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {loading ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
            <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 10px auto', color: '#0284c7' }} />
            <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Loading Conversation History...</div>
          </div>
        ) : errorMsg ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '30px 20px', color: '#dc2626' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 8px auto' }} />
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{errorMsg}</div>
          </div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', textAlign: 'center', padding: '40px 20px', color: '#64748b', maxWidth: '320px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto'
            }}>
              <Headphones size={28} />
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#0f172a' }}>
              Welcome to MWS Eagle Live Chat
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '6px', lineHeight: 1.4 }}>
              Have questions regarding orders, warranty, products, or points? Send a message below and our support team will reply in real time.
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === currentUser?.id || (currentUser?.userType === 'Admin' && msg.sender_role === 'Admin');
            const isDeleted = !!msg.deleted_at;
            const prevMsg = messages[index - 1];
            const showDateHeader = !prevMsg || formatMessageDate(prevMsg.created_at) !== formatMessageDate(msg.created_at);

            return (
              <React.Fragment key={msg.id || index}>
                {/* Date Header Separator */}
                {showDateHeader && (
                  <div style={{ textAlign: 'center', margin: '8px 0' }}>
                    <span style={{
                      background: '#e2e8f0',
                      color: '#475569',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '12px'
                    }}>
                      {formatMessageDate(msg.created_at)}
                    </span>
                  </div>
                )}

                {/* Message Bubble Container */}
                <div style={{
                  display: 'flex',
                  justifyContent: isMe ? 'flex-end' : 'flex-start',
                  position: 'relative',
                  group: 'msg-bubble'
                }}>
                  <div style={{
                    maxWidth: '82%',
                    minWidth: '120px',
                    borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    padding: '9px 12px',
                    background: isDeleted
                      ? '#f1f5f9'
                      : isMe
                      ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)'
                      : '#ffffff',
                    color: isDeleted ? '#64748b' : isMe ? '#ffffff' : '#0f172a',
                    border: isMe ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    position: 'relative'
                  }}>
                    {/* Sender Label (if in group/admin context) */}
                    {!isMe && (
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', marginBottom: '3px' }}>
                        {msg.sender_name} {msg.sender_role === 'Admin' ? '• Support' : ''}
                      </div>
                    )}

                    {/* Deleted Message View */}
                    {isDeleted ? (
                      <div style={{ fontStyle: 'italic', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Trash2 size={13} />
                        <span>This message was deleted.</span>
                      </div>
                    ) : (
                      <>
                        {/* Image Attachment (if message type is image) */}
                        {msg.message_type === 'image' && msg.media_url && (
                          <div style={{ marginBottom: msg.message_text ? '6px' : '0' }}>
                            <img
                              src={getMediaUrl(msg.media_url)}
                              alt={msg.file_name || 'Chat image'}
                              onClick={() => setFullImageModal(getMediaUrl(msg.media_url))}
                              style={{
                                width: '100%',
                                maxHeight: '240px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'block'
                              }}
                            />
                          </div>
                        )}

                        {/* Text Content */}
                        {msg.message_text && (
                          <div style={{
                            fontSize: '0.88rem',
                            lineHeight: 1.4,
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {msg.message_text}
                          </div>
                        )}
                      </>
                    )}

                    {/* Message Meta: Time & Delivery Status */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '4px',
                      marginTop: '4px',
                      fontSize: '0.65rem',
                      color: isMe ? 'rgba(255, 255, 255, 0.75)' : '#94a3b8'
                    }}>
                      <span>{formatMessageTime(msg.created_at)}</span>

                      {/* Read receipts for messages sent by me */}
                      {isMe && !isDeleted && (
                        <span>
                          {msg.is_read ? (
                            <CheckCheck size={13} color="#4ade80" title="Read" />
                          ) : (
                            <Check size={13} color="rgba(255, 255, 255, 0.8)" title="Sent" />
                          )}
                        </span>
                      )}

                      {/* Delete button (if user is permitted) */}
                      {!isDeleted && (isMe || currentUser?.userType === 'Admin') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg.id)}
                          title="Delete message"
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '0 0 0 4px',
                            cursor: 'pointer',
                            color: isMe ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8',
                            display: 'inline-flex',
                            alignItems: 'center'
                          }}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to Bottom Button */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: '75px',
            right: '20px',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284c7',
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <ArrowDown size={18} />
        </button>
      )}

      {/* ======================================================== */}
      {/* IMAGE PREVIEW DRAWER (Before Sending)                    */}
      {/* ======================================================== */}
      {imagePreview && (
        <div style={{
          padding: '12px 16px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative' }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <button
              type="button"
              onClick={cancelImagePreview}
              style={{
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={12} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Add a caption... (optional)"
            value={imageCaption}
            onChange={(e) => setImageCaption(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSendImage(); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-medium)',
              fontSize: '0.86rem',
              boxSizing: 'border-box'
            }}
          />

          <button
            type="button"
            onClick={handleSendImage}
            disabled={sending}
            style={{
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.86rem',
              cursor: sending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {sending ? <RefreshCw size={15} className="spin-animation" /> : <Send size={15} />}
            Send Image
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* INPUT CONTROLS                                           */}
      {/* ======================================================== */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: '12px 16px',
          background: '#ffffff',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0
        }}
      >
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
        />

        {/* Image Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Send image"
          style={{
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease'
          }}
        >
          <ImageIcon size={18} />
        </button>

        {/* Text Input */}
        <input
          type="text"
          placeholder="Type your message here..."
          value={inputText}
          onChange={handleInputChange}
          disabled={sending || !activeConvId}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '20px',
            border: '1.5px solid var(--border-medium)',
            fontSize: '0.9rem',
            background: '#f8fafc',
            boxSizing: 'border-box',
            outline: 'none'
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!inputText.trim() || sending || !activeConvId}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: inputText.trim() ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#e2e8f0',
            color: inputText.trim() ? '#ffffff' : '#94a3b8',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !sending ? 'pointer' : 'default',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow: inputText.trim() ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
          }}
        >
          {sending ? <RefreshCw size={17} className="spin-animation" /> : <Send size={17} />}
        </button>
      </form>

      {/* ======================================================== */}
      {/* FULL IMAGE MODAL                                         */}
      {/* ======================================================== */}
      {fullImageModal && (
        <div
          onClick={() => setFullImageModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <img
              src={fullImageModal}
              alt="Full View"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }}
            />
            <button
              type="button"
              onClick={() => setFullImageModal(null)}
              style={{
                position: 'absolute',
                top: '-14px',
                right: '-14px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveChatWindow;

