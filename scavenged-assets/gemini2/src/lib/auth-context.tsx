import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';

export type UserRole = 'OWNER' | 'FIELD';

export interface AuthUser {
  id: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (secureId: string, passcode: string) => UserRole | null;
  logout: () => void;
}

export const AUTH_SESSION_STORAGE_KEY = 'jwordenai_session';

const CREDENTIALS: Record<string, { passcode: string; role: UserRole }> = {
  george_exec: { passcode: 'admin35', role: 'OWNER' },
  crew_alpha: { passcode: 'fieldcrew', role: 'FIELD' },
};

function loadSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function saveSession(user: AuthUser): void {
  sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(user));
}

function clearSession(): void {
  sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadSession);

  const login = useCallback((secureId: string, passcode: string): UserRole | null => {
    const cred = CREDENTIALS[secureId];
    if (!cred || cred.passcode !== passcode) return null;
    const authUser: AuthUser = { id: secureId, role: cred.role };
    saveSession(authUser);
    setUser(authUser);
    return cred.role;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
