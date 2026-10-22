const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Universal Fetch wrapper with JWT injection & error handling
 */
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem('mobile_parts_token');
  const headers = {
    'Content-Type': 'application/json',
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

  // Role-Based Product Visibility Catalog
  products: {
    getVisibleProducts: () =>
      request('/products', {
        method: 'GET'
      })
  }
};

export default api;
