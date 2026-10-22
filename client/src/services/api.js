const API_BASE_URL = 'http://localhost:5001/api';

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

    delete: (id) =>
      request(`/advertisements/${id}`, {
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

    delete: (id) =>
      request(`/products/${id}`, {
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
  }
};

export default api;
