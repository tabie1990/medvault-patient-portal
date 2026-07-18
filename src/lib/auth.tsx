import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { setToken as persistToken } from './api';

export type Role = 'patient' | 'doctor' | 'lab_staff' | 'admin';

interface AuthContextValue {
  token: string | null;
  role: Role | null;
  // The logged-in user's own ID — a globalPatientId for patients, or the
  // Doctor/LabStaff/AdminUser row id for staff roles. Named generically
  // since every role uses the same field for "who is this," even though
  // the underlying ID format differs by role.
  userId: string | null;
  mustChangePassword: boolean;
  login: (token: string, role: Role, userId: string, mustChangePassword?: boolean) => void;
  clearMustChangePassword: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('mv_token'));
  const [role, setRole] = useState<Role | null>(() => (localStorage.getItem('mv_role') as Role) || null);
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('mv_user_id'));
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() => localStorage.getItem('mv_must_change_pw') === 'true');

  const login = useCallback((newToken: string, newRole: Role, newUserId: string, mustChange = false) => {
    persistToken(newToken);
    localStorage.setItem('mv_role', newRole);
    localStorage.setItem('mv_user_id', newUserId);
    localStorage.setItem('mv_must_change_pw', String(mustChange));
    setTokenState(newToken);
    setRole(newRole);
    setUserId(newUserId);
    setMustChangePassword(mustChange);
  }, []);

  const clearMustChangePassword = useCallback(() => {
    localStorage.setItem('mv_must_change_pw', 'false');
    setMustChangePassword(false);
  }, []);

  const logout = useCallback(() => {
    persistToken(null);
    localStorage.removeItem('mv_role');
    localStorage.removeItem('mv_user_id');
    localStorage.removeItem('mv_must_change_pw');
    setTokenState(null);
    setRole(null);
    setUserId(null);
    setMustChangePassword(false);
  }, []);

  return (
    <AuthContext.Provider value={{ token, role, userId, mustChangePassword, login, clearMustChangePassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
