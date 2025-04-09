"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AuthContextType = {
  apiKey: string | null;
  isAuthenticated: boolean;
  login: (key: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for existing apiKey in session storage on mount
  useEffect(() => {
    const storedApiKey = sessionStorage.getItem('robinhoodApiKey');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (key: string) => {
    sessionStorage.setItem('robinhoodApiKey', key);
    setApiKey(key);
    setIsAuthenticated(true);
  };

  const logout = () => {
    sessionStorage.removeItem('robinhoodApiKey');
    setApiKey(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ apiKey, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
