import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../api/types';
import { queries } from '../api/queries';

interface SessionContextType {
  currentUser: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('arm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('arm_session_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      if (token) {
        try {
          const user = await queries.getMe();
          setCurrentUser(user);
          localStorage.setItem('arm_user', JSON.stringify(user));
        } catch (e) {
          console.warn('Session verification failed, resetting to demo mentor');
          localStorage.removeItem('arm_session_token');
          localStorage.removeItem('arm_user');
          try {
            const res = await queries.demoSwitch('mentor');
            setToken(res.session_token);
            setCurrentUser(res.user);
            localStorage.setItem('arm_session_token', res.session_token);
            localStorage.setItem('arm_user', JSON.stringify(res.user));
          } catch (err) {
            setCurrentUser(null);
            setToken(null);
          }
        }
      } else {
        // Fallback demo auto-login as Dr. Sarah Chen (Mentor) if no session exists
        try {
          const res = await queries.demoSwitch('mentor');
          setToken(res.session_token);
          setCurrentUser(res.user);
          localStorage.setItem('arm_session_token', res.session_token);
          localStorage.setItem('arm_user', JSON.stringify(res.user));
        } catch (err) {
          // Ignore if backend offline
        }
      }
      setIsLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await queries.login(email, pass);
    setToken(res.session_token);
    setCurrentUser(res.user);
    localStorage.setItem('arm_session_token', res.session_token);
    localStorage.setItem('arm_user', JSON.stringify(res.user));
  };

  const logout = async () => {
    try {
      await queries.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('arm_session_token');
    localStorage.removeItem('arm_user');
  };

  const switchDemoRole = async (role: string) => {
    setIsLoading(true);
    try {
      const res = await queries.demoSwitch(role);
      setToken(res.session_token);
      setCurrentUser(res.user);
      localStorage.setItem('arm_session_token', res.session_token);
      localStorage.setItem('arm_user', JSON.stringify(res.user));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider value={{ currentUser, token, isLoading, login, logout, switchDemoRole }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
};
