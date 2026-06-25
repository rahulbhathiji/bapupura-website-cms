import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin' | 'editor';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default timeout is 15 minutes
const TIMEOUT_MINUTES = 15;

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const activityTimerRef = useRef<any>(null);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout API error:', e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
  }, []);

  // Monitor Session Inactivity (Automatic Expiration)
  const resetActivityTimer = useCallback(() => {
    if (!user) return;
    
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }

    activityTimerRef.current = setTimeout(() => {
      console.log('Session expired due to inactivity');
      logout();
      alert('Your session has expired due to inactivity. Please log in again.');
    }, TIMEOUT_MINUTES * 60 * 1000);
  }, [user, logout]);

  useEffect(() => {
    if (!user) return;

    // Listen to user interactions to reset timer
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetActivityTimer();

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial trigger
    resetActivityTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (activityTimerRef.current) {
        clearTimeout(activityTimerRef.current);
      }
    };
  }, [user, resetActivityTimer]);

  const checkSession = useCallback(async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${savedToken}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(savedToken);
      } else {
        // Token invalid/expired
        await logout();
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (username: string, password: string, rememberMe: boolean) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Invalid username or password' };
      }
    } catch (error) {
      console.error('Login request failed:', error);
      return { success: false, message: 'Server connection failed' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
