'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, ApiError } from '@/lib/api-client';

interface User {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<User>;
  register: (data: { nome: string; email: string; senha: string; telefone: string; cpf: string }) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get<User>('/auth/me');
      setUser(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, senha: string) => {
    const { data } = await api.post<{ user: User; token: string }>('/auth/login', { email, senha });
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(
    async (payload: { nome: string; email: string; senha: string; telefone: string; cpf: string }) => {
      const { data } = await api.post<{ user: User; token: string }>('/auth/register', payload);
      setUser(data.user);
      return data.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</AuthContext.Provider>
  );
}
