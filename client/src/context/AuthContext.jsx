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

  // Validate and restore session on startup
  useEffect(() => {
    let isMounted = true;
    const verifySession = async () => {
      const storedToken = localStorage.getItem('mobile_parts_token');
      const storedRefreshToken = localStorage.getItem('mws_refresh_token');

      // 1. If an access token exists, verify via /me
      if (storedToken) {
        try {
          const response = await api.auth.getMe();
          if (isMounted && response.success && response.user) {
            setUser(response.user);
            setToken(storedToken);

            // Update remembered account info
            localStorage.setItem('mws_remembered_account', JSON.stringify({
              email: response.user.email,
              fullName: response.user.fullName,
              userType: response.user.userType,
              avatarUrl: response.user.avatarUrl || null
            }));

            // Only redirect if specifically on the /login page
            const currentPath = window.location.pathname;
            if (currentPath === '/login') {
              if (response.user.userType === 'Customer') navigate('/portal/customer');
              else if (response.user.userType === 'Distributor') navigate('/portal/distributor');
              else if (response.user.userType === 'Admin') navigate('/admin');
            }
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Access token expired, attempting persistent session refresh...');
        }
      }

      // 2. If access token was missing or expired, attempt seamless refresh via refresh token / HTTP-only cookie
      try {
        const refreshRes = await api.auth.refreshSession(storedRefreshToken);
        if (isMounted && refreshRes.success && refreshRes.token && refreshRes.user) {
          localStorage.setItem('mobile_parts_token', refreshRes.token);
          if (refreshRes.refreshToken) {
            localStorage.setItem('mws_refresh_token', refreshRes.refreshToken);
          }
          setToken(refreshRes.token);
          setUser(refreshRes.user);

          localStorage.setItem('mws_remembered_account', JSON.stringify({
            email: refreshRes.user.email,
            fullName: refreshRes.user.fullName,
            userType: refreshRes.user.userType,
            avatarUrl: refreshRes.user.avatarUrl || null
          }));

          const currentPath = window.location.pathname;
          if (currentPath === '/login') {
            if (refreshRes.user.userType === 'Customer') navigate('/portal/customer');
            else if (refreshRes.user.userType === 'Distributor') navigate('/portal/distributor');
            else if (refreshRes.user.userType === 'Admin') navigate('/admin');
          }
        } else {
          localStorage.removeItem('mobile_parts_token');
          setToken(null);
          setUser(null);
        }
      } catch (refreshErr) {
        // No active session or refresh token expired
        localStorage.removeItem('mobile_parts_token');
        localStorage.removeItem('mws_refresh_token');
        setToken(null);
        setUser(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    verifySession();
    return () => { isMounted = false; };
  }, []);

  // Login handler with persistent session option
  const login = async (email, password, requestedPortal, rememberMe = true) => {
    const res = await api.auth.login({ email, password, requestedPortal, rememberMe });
    if (res.success && res.token) {
      localStorage.setItem('mobile_parts_token', res.token);
      if (res.refreshToken) {
        localStorage.setItem('mws_refresh_token', res.refreshToken);
      }
      setToken(res.token);
      setUser(res.user);

      // Save remembered account snapshot
      localStorage.setItem('mws_remembered_account', JSON.stringify({
        email: res.user.email,
        fullName: res.user.fullName,
        userType: res.user.userType,
        avatarUrl: res.user.avatarUrl || null
      }));

      // Check if returnUrl is provided (e.g. from /verify-warranty/:token)
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');
      if (returnUrl && returnUrl.startsWith('/')) {
        navigate(returnUrl);
        return res;
      }

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

  // Google Login / One-Tap authentication handler
  const loginWithGoogle = async ({ credential, profile, requestedRole = 'Customer', rememberMe = true }) => {
    const res = await api.auth.loginWithGoogle({ credential, profile, requestedRole, rememberMe });
    if (res.success && res.token && res.user) {
      localStorage.setItem('mobile_parts_token', res.token);
      if (res.refreshToken) {
        localStorage.setItem('mws_refresh_token', res.refreshToken);
      }
      setToken(res.token);
      setUser(res.user);

      localStorage.setItem('mws_remembered_account', JSON.stringify({
        email: res.user.email,
        fullName: res.user.fullName,
        userType: res.user.userType,
        avatarUrl: res.user.avatarUrl || null
      }));

      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');
      if (returnUrl && returnUrl.startsWith('/')) {
        navigate(returnUrl);
        return res;
      }

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

      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');
      if (returnUrl && returnUrl.startsWith('/')) {
        navigate(returnUrl);
        return res;
      }

      navigate('/portal/customer');
    }
    return res;
  };

  // Distributor signup handler (returns pending confirmation notice)
  const registerDistributor = async (formData) => {
    const res = await api.auth.registerDistributor(formData);
    return res;
  };

  // Logout handler - cleans up local storage, notifies backend, and clears cookies
  const logout = async () => {
    const currentRefreshToken = localStorage.getItem('mws_refresh_token');
    try {
      await api.auth.logout(currentRefreshToken);
    } catch (e) {
      console.warn('Logout API notification failed:', e.message);
    }
    localStorage.removeItem('mobile_parts_token');
    localStorage.removeItem('mws_refresh_token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  // Switch Account handler - clears session and remembered account prompt
  const switchAccount = async () => {
    const currentRefreshToken = localStorage.getItem('mws_refresh_token');
    try {
      await api.auth.logout(currentRefreshToken);
    } catch (e) {}
    localStorage.removeItem('mobile_parts_token');
    localStorage.removeItem('mws_refresh_token');
    localStorage.removeItem('mws_remembered_account');
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
        loginWithGoogle,
        registerCustomer,
        registerDistributor,
        logout,
        switchAccount,
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
