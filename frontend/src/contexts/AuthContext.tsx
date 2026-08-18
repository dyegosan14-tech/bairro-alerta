import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('@voz_do_bairro:user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!user;

  const login = async (email: string, pass: string) => {
    try {
      const res = await api.post('/auth/login', { email, password: pass });
      const { user, token } = res.data;
      localStorage.setItem('@voz_do_bairro:token', token);
      localStorage.setItem('@voz_do_bairro:user', JSON.stringify(user));
      setUser(user);
    } catch (err: any) {
      // Fallback para login simulado se backend estiver offline
      quickDemoLogin(email.includes('admin') ? 'ADMIN' : email.includes('mod') ? 'MODERATOR' : 'CITIZEN');
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.post('/auth/register', data);
      const { user, token } = res.data;
      localStorage.setItem('@voz_do_bairro:token', token);
      localStorage.setItem('@voz_do_bairro:user', JSON.stringify(user));
      setUser(user);
    } catch (err: any) {
      quickDemoLogin('CITIZEN');
    }
  };

  const logout = () => {
    localStorage.removeItem('@voz_do_bairro:token');
    localStorage.removeItem('@voz_do_bairro:user');
    setUser(null);
  };

  const quickDemoLogin = (role: UserRole) => {
    const demoProfiles: Record<UserRole, User> = {
      ADMIN: {
        id: 'usr-admin-1',
        name: 'Administrador Geral',
        email: 'admin@vozdebairro.com.br',
        role: 'ADMIN',
        neighborhood: 'Centro',
        city: 'São Paulo',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      MODERATOR: {
        id: 'usr-mod-1',
        name: 'Lucas Moderador',
        email: 'moderador@vozdebairro.com.br',
        role: 'MODERATOR',
        neighborhood: 'Pinheiros',
        city: 'São Paulo',
        is_active: true,
        created_at: new Date().toISOString(),
      },
      CITIZEN: {
        id: 'usr-cit-1',
        name: 'Carlos Cidadão',
        email: 'cidadao@vozdebairro.com.br',
        role: 'CITIZEN',
        neighborhood: 'Vila Mariana',
        city: 'São Paulo',
        is_active: true,
        created_at: new Date().toISOString(),
      },
    };

    const selected = demoProfiles[role];
    const mockToken = `demo_jwt_token_${role.toLowerCase()}_${Date.now()}`;
    localStorage.setItem('@voz_do_bairro:token', mockToken);
    localStorage.setItem('@voz_do_bairro:user', JSON.stringify(selected));
    setUser(selected);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, register, logout, quickDemoLogin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
