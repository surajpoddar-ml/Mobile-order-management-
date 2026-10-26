const resolveApiOrigin = () => {
  const envUrl = (import.meta.env.VITE_API_BASE_URL || '').trim();

  // If running in browser on a production/remote domain (e.g. mwseagle.com)
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.');
    if (!isLocal) {
      // If envUrl is a remote URL, use it; otherwise always default to the live backend
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      return 'https://api.mwseagle.com';
    }
  }

  // Running locally
  if (envUrl) {
    return envUrl;
  }
  return 'http://localhost:5001';
};

export const API_ORIGIN = resolveApiOrigin().replace(/\/+$/, '');
export const API_BASE_URL = `${API_ORIGIN}/api`;

/**
 * Helper to build media URLs pointing to either cloud backend or local server
 */
export const getMediaUrl = (url) => {
  if (!url) return '';
  const normalized = String(url).trim().replace(/\\/g, '/');
  if (normalized.startsWith('http://') || normalized.startsWith('https://') || normalized.startsWith('blob:') || normalized.startsWith('data:')) {
    return normalized;
  }
  // Public static assets served from client public directory
  if (
    normalized.startsWith('/cat_') || normalized.startsWith('/mws_') || normalized.startsWith('/goa_') || normalized.startsWith('/favicon') ||
    normalized.startsWith('cat_') || normalized.startsWith('mws_') || normalized.startsWith('goa_')
  ) {
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }
  const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return `${API_ORIGIN}${cleanPath}`;
};

/**
 * Universal Fetch wrapper with JWT injection & error handling
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('mobile_parts_token');
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(data.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
};

export const api = {
  // Authentication Endpoints
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      }),

    registerCustomer: (payload) =>
      request('/auth/register/customer', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    registerDistributor: (payload) =>
      request('/auth/register/distributor', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getMe: () =>
      request('/auth/me', {
        method: 'GET'
      })
  },

  // Admin Management Endpoints
  admin: {
    getMetrics: () =>
      request('/admin/metrics', {
        method: 'GET'
      }),

    getUsers: ({ userType = 'All', accountStatus = 'All', search = '' } = {}) => {
      const params = new URLSearchParams();
      if (userType && userType !== 'All') params.append('userType', userType);
      if (accountStatus && accountStatus !== 'All') params.append('accountStatus', accountStatus);
      if (search) params.append('search', search);

      return request(`/admin/users?${params.toString()}`, {
        method: 'GET'
      });
    },

    getUserById: (id) =>
      request(`/admin/users/${id}`, {
        method: 'GET'
      }),

    approveDistributor: (id) =>
      request(`/admin/distributors/${id}/approve`, {
        method: 'PATCH'
      }),

    rejectDistributor: (id, reason) =>
      request(`/admin/distributors/${id}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      }),

    suspendUser: (id, reason) =>
      request(`/admin/users/${id}/suspend`, {
        method: 'PATCH',
        body: JSON.stringify({ reason })
      }),

    activateUser: (id) =>
      request(`/admin/users/${id}/activate`, {
        method: 'PATCH'
      }),

    deleteUser: (id) =>
      request(`/admin/users/${id}`, {
        method: 'DELETE'
      })
  },

  // Advertisements System (Images and Videos for Landing Board)
  advertisements: {
    getActive: () =>
      request('/advertisements', {
        method: 'GET'
      }),

    getAll: () =>
      request('/advertisements/all', {
        method: 'GET'
      }),

    uploadMedia: (formData) =>
      request('/advertisements/upload', {
        method: 'POST',
        body: formData
      }),

    create: (payload) =>
      request('/advertisements', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    update: (id, payload) =>
      request(`/advertisements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    setDefault: (id) =>
      request(`/advertisements/${id}/default`, {
        method: 'PATCH'
      }),

    delete: (id) =>
      request(`/advertisements/${id}`, {
        method: 'DELETE'
      })
  },

  // Promotional Stickers System (Thin promotional strip controlled by Admin)
  stickers: {
    getActive: () =>
      request('/stickers/active', {
        method: 'GET'
      }),

    getAll: () =>
      request('/stickers', {
        method: 'GET'
      }),

    uploadMedia: (formData) =>
      request('/stickers/upload', {
        method: 'POST',
        body: formData
      }),

    create: (payload) =>
      request('/stickers', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    update: (id, payload) =>
      request(`/stickers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    toggle: (id) =>
      request(`/stickers/${id}/toggle`, {
        method: 'PATCH'
      }),

    delete: (id) =>
      request(`/stickers/${id}`, {
        method: 'DELETE'
      })
  },

  // Role-Based Product Catalog & Admin Authority
  products: {
    getVisibleProducts: (role, category) => {
      const params = new URLSearchParams();
      if (role) params.append('role', role);
      if (category && category !== 'All') params.append('category', category);
      const query = params.toString() ? `?${params.toString()}` : '';
      return request(`/products${query}`, {
        method: 'GET'
      });
    },

    create: (payload) =>
      request('/products', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    update: (id, payload) =>
      request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    toggleVisibility: (id, payload) =>
      request(`/products/${id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),

    toggleStock: (id) =>
      request(`/products/${id}/stock`, {
        method: 'PATCH'
      }),

    delete: (id) =>
      request(`/products/${id}`, {
        method: 'DELETE'
      }),

    uploadImage: (formData) =>
      request('/products/upload', {
        method: 'POST',
        body: formData
      })
  },

  // Master Category Management (Admin Authority + Public Discovery)
  categories: {
    getAll: (includeInactive = false) => {
      const query = includeInactive ? '?includeInactive=true' : '';
      return request(`/categories${query}`, {
        method: 'GET'
      });
    },

    create: (payload) =>
      request('/categories', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    update: (id, payload) =>
      request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      }),

    toggleStatus: (id, status) =>
      request(`/categories/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),

    uploadImage: (formData) =>
      request('/categories/upload', {
        method: 'POST',
        body: formData
      }),

    delete: (id) =>
      request(`/categories/${id}`, {
        method: 'DELETE'
      })
  },

  // Orders Management (Customer & Distributor ordering + Admin authority)
  orders: {
    create: (payload) =>
      request('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getMyOrders: () =>
      request('/orders/my-orders', {
        method: 'GET'
      }),

    track: (query) =>
      request(`/orders/track/${encodeURIComponent(query)}`, {
        method: 'GET'
      }),

    getAllAdmin: () =>
      request('/orders/admin/all', {
        method: 'GET'
      }),

    updateStatus: (id, status, paymentStatus) =>
      request(`/orders/admin/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, paymentStatus })
      }),

    uploadPaymentProof: (formData) =>
      request('/orders/upload-payment-proof', {
        method: 'POST',
        body: formData
      }),

    approvePayment: (id) =>
      request(`/orders/admin/${id}/approve-payment`, {
        method: 'PUT'
      }),

    rejectPayment: (id, reason) =>
      request(`/orders/admin/${id}/reject-payment`, {
        method: 'PUT',
        body: JSON.stringify({ reason })
      })
  },

  // Real-time Notification System for Admin, Customer, and Distributor
  notifications: {
    getAll: () =>
      request('/notifications', {
        method: 'GET'
      }),

    markAsRead: (id) =>
      request(`/notifications/${id}/read`, {
        method: 'PATCH'
      }),

    markAllAsRead: () =>
      request('/notifications/read-all', {
        method: 'PATCH'
      }),

    delete: (id) =>
      request(`/notifications/${id}`, {
        method: 'DELETE'
      })
  },

  // QR-Based Points, Rewards & Cash Redemption System
  rewards: {
    getSettings: () =>
      request('/rewards/settings', { method: 'GET' }),

    getMySummary: () =>
      request('/rewards/my-summary', { method: 'GET' }),

    scanAndClaim: (token) =>
      request('/rewards/scan-and-claim', {
        method: 'POST',
        body: JSON.stringify({ token })
      }),

    getMyHistory: () =>
      request('/rewards/my-history', { method: 'GET' }),

    submitRedemption: (payload) =>
      request('/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getMyRedemptions: () =>
      request('/rewards/my-redemptions', { method: 'GET' }),

    // Admin reward endpoints
    admin: {
      getDashboard: () =>
        request('/rewards/admin/dashboard', { method: 'GET' }),

      getTokens: ({ status = 'All', search = '', limit = 150, offset = 0 } = {}) => {
        const params = new URLSearchParams();
        if (status && status !== 'All') params.append('status', status);
        if (search) params.append('search', search);
        params.append('limit', limit);
        params.append('offset', offset);
        return request(`/rewards/admin/tokens?${params.toString()}`, { method: 'GET' });
      },

      generateTokens: (payload) =>
        request('/rewards/admin/tokens/generate', {
          method: 'POST',
          body: JSON.stringify(payload)
        }),

      updateTokenStatus: (id, status) =>
        request(`/rewards/admin/tokens/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        }),

      deleteToken: (id) =>
        request(`/rewards/admin/tokens/${id}`, { method: 'DELETE' }),

      getRedemptions: ({ status = 'All', search = '' } = {}) => {
        const params = new URLSearchParams();
        if (status && status !== 'All') params.append('status', status);
        if (search) params.append('search', search);
        return request(`/rewards/admin/redemptions?${params.toString()}`, { method: 'GET' });
      },

      updateRedemptionStatus: (id, payload) =>
        request(`/rewards/admin/redemptions/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        }),

      getUsers: ({ userType = 'All', search = '' } = {}) => {
        const params = new URLSearchParams();
        if (userType && userType !== 'All') params.append('userType', userType);
        if (search) params.append('search', search);
        return request(`/rewards/admin/users?${params.toString()}`, { method: 'GET' });
      },

      updateSettings: (payload) =>
        request('/rewards/admin/settings', {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
    }
  }
};

export default api;
