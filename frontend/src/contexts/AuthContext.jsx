import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const decoded = jwtDecode(token);
      if (decoded.exp * 1000 < Date.now()) throw new Error('expired');
      const { data } = await api.get('/api/auth/me');
      setUser(data.user);
    } catch (err) {
      // Only clear tokens on actual auth failures (401) or expired token
      // Don't log out users on network errors or server errors
      if (err.message === 'expired' || err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (identifier, password) => {
    const { data } = await api.post('/api/auth/login', { email: identifier, password });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    // flushSync forces React to apply the state update immediately
    // before navigate() is called in the Login page — prevents the
    // "dashboard flashes and disappears" race condition in React 18
    flushSync(() => setUser(data.user));
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await api.post('/api/auth/register', formData);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    flushSync(() => setUser(data.user));
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const updateUser = (updates) => setUser((prev) => ({ ...prev, ...updates }));

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
