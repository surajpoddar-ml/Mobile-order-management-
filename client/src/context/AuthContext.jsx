import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Routes that should NOT trigger re-auth redirect
const PUBLIC_ROUTES = ['/', '/home', '/login', '/admin-access'];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('mobile_parts_token') || null);
  const [loading, setLoading] = useState(true);
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname || '/login');

  // Navigate helper with browser URL sync
  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
    window.dispatchEvent(new CustomEvent('mws_route_change', { detail: { path } }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser Back/Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const fullPath = window.location.pathname + window.location.search;
      setCurrentRoute(fullPath);
      window.dispatchEvent(new CustomEvent('mws_route_change', { detail: { path: fullPath } }));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Validate session on startup
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('mobile_parts_token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.auth.getMe();
        if (response.success && response.user) {
          setUser(response.user);
          // Only redirect if specifically on the /login page
          const currentPath = window.location.pathname;
          if (currentPath === '/login') {
            if (response.user.userType === 'Customer') navigate('/portal/customer');
            else if (response.user.userType === 'Distributor') navigate('/portal/distributor');
            else if (response.user.userType === 'Admin') navigate('/admin');
          }
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        localStorage.removeItem('mobile_parts_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // Login handler
  const login = async (email, password, requestedPortal) => {
    const res = await api.auth.login({ email, password, requestedPortal });
    if (res.success && res.token) {
      localStorage.setItem('mobile_parts_token', res.token);
      setToken(res.token);
      setUser(res.user);

      // Portal Redirection Rule (Section 6)
      if (res.user.userType === 'Customer') {
        navigate('/portal/customer');
      } else if (res.user.userType === 'Distributor') {
        navigate('/portal/distributor');
      } else if (res.user.userType === 'Admin') {
        navigate('/admin');
      }
    }
    return res;
  };

  // Customer signup handler
  const registerCustomer = async (formData) => {
    const res = await api.auth.registerCustomer(formData);
    if (res.success && res.token) {
      localStorage.setItem('mobile_parts_token', res.token);
      setToken(res.token);
      setUser(res.user);
      navigate('/portal/customer');
    }
    return res;
  };

  // Distributor signup handler (returns pending confirmation notice)
  const registerDistributor = async (formData) => {
    const res = await api.auth.registerDistributor(formData);
    return res;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('mobile_parts_token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  // Refresh current user data (useful after admin approval or profile change)
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.auth.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        currentRoute,
        navigate,
        login,
        registerCustomer,
        registerDistributor,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
