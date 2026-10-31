import { io } from 'socket.io-client';
import { API_ORIGIN } from './api';

let socket = null;

export const getSocket = () => {
  if (socket && socket.connected) {
    return socket;
  }
  return connectSocket();
};

export const connectSocket = () => {
  const token = localStorage.getItem('mobile_parts_token');
  if (!token) {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    return null;
  }

  // If existing socket has same token and is connected, reuse it
  if (socket && socket.connected && socket.auth?.token === token) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  try {
    socket = io(API_ORIGIN, {
      auth: { token },
      query: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });

    socket.on('connect', () => {
      // Socket connected
    });

    socket.on('connect_error', (err) => {
      console.warn('[Live Chat Socket Notice]', err.message);
    });

    return socket;
  } catch (err) {
    console.error('Failed to initialize chat socket:', err);
    return null;
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  getSocket,
  connectSocket,
  disconnectSocket
};

