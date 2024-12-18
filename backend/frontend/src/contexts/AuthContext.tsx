import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { auth } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  checkAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuthState = async () => {
    try {
      const response = await auth.checkAuth();
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error: any) {
      console.error('Auth state check failed:', error.message);
      // Only clear state for auth errors that aren't related to deactivation
      if (error.response?.status !== 403) {
        setUser(null);
        setIsAuthenticated(false);
      }
      throw error;
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        await checkAuthState();
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await auth.login({ email, password });
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      setUser(response.user);
      setIsAuthenticated(true);
      return response;
    } catch (error: any) {
      console.error('Login failed:', error);
      setUser(null);
      setIsAuthenticated(false);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
      }
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const { token, user } = await auth.register(data);
      if (!token) {
        throw new Error('No token received from server');
      }
      localStorage.setItem('token', token);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration failed:', error);
      auth.logout();
      throw error;
    }
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuthState }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
