import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { setToken as persistToken } from './api';

interface AuthContextValue {
  globalPatientId: string | null;
  token: string | null;
  login: (token: string, globalPatientId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('mv_patient_token'));
  const [globalPatientId, setGlobalPatientId] = useState<string | null>(() => localStorage.getItem('mv_patient_id'));

  const login = useCallback((newToken: string, id: string) => {
    persistToken(newToken);
    localStorage.setItem('mv_patient_id', id);
    setTokenState(newToken);
    setGlobalPatientId(id);
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    localStorage.removeItem('mv_patient_id');
    setTokenState(null);
    setGlobalPatientId(null);
  }, []);

  return <AuthContext.Provider value={{ token, globalPatientId, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
