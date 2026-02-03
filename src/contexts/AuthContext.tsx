import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserWithRole, Company, UserRole, ActivityType } from '@/types';
import { api } from '@/api';

interface AuthContextType {
  user: UserWithRole | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    activityType: ActivityType;
  }) => Promise<void>;
  logout: () => Promise<void>;
  registerCompany: (name: string, inn: string) => Promise<void>;
  joinCompany: (inn: string) => Promise<Company | null>;
  setCompany: (company: Company | null) => void;
  refreshUser: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isDirectorOrSenior: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.auth.me();
      if (response.success && response.data) {
        setUser(response.data);
        if (response.data.companyId) {
          const companyResponse = await api.companies.getById(response.data.companyId);
          if (companyResponse.success) {
            setCompany(companyResponse.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      setCompany(null);
      api.setToken(null);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    if (response.success) {
      api.setToken(response.data.token);
      setUser(response.data.user);
      if (response.data.user.companyId) {
        const companyResponse = await api.companies.getById(response.data.user.companyId);
        if (companyResponse.success) {
          setCompany(companyResponse.data);
        }
      }
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    activityType: ActivityType;
  }) => {
    const response = await api.auth.register(data);
    if (response.success) {
      api.setToken(response.data.token);
      setUser(response.data.user as UserWithRole);
    } else {
      throw new Error(response.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      api.setToken(null);
      setUser(null);
      setCompany(null);
    }
  };

  const registerCompany = async (name: string, inn: string) => {
    const response = await api.companies.register(name, inn);
    if (response.success) {
      setCompany(response.data);
      await refreshUser();
    } else {
      throw new Error(response.message || 'Company registration failed');
    }
  };

  const joinCompany = async (inn: string): Promise<Company | null> => {
    const response = await api.companies.findByInn(inn);
    if (response.success && response.data) {
      return response.data;
    }
    return null;
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const isDirectorOrSenior = user?.role === 'director' || user?.role === 'senior';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        registerCompany,
        joinCompany,
        setCompany,
        refreshUser,
        hasRole,
        isDirectorOrSenior,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
