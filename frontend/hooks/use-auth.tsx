"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI, companyAPI } from "@/services/api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  company_id: string | null;
}

interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  description?: string;
}

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  createCompany: (data: {
    name: string;
    industry: string;
    website?: string;
    description?: string;
  }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem("bizos_token");
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { data } = await authAPI.getMe();
      setUser(data.user);

      if (data.user.company_id) {
        try {
          const companyRes = await companyAPI.getMine();
          setCompany(companyRes.data.company);
        } catch {
          // Company not found — user needs onboarding
        }
      }
    } catch {
      localStorage.removeItem("bizos_token");
      localStorage.removeItem("bizos_user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      refreshUser();
    }, 0);
    return () => clearTimeout(t);
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    const { data } = await authAPI.login({ email, password });
    localStorage.setItem("bizos_token", data.access_token);
    localStorage.setItem("bizos_user", JSON.stringify(data.user));
    setUser(data.user);

    if (data.user.company_id) {
      try {
        const companyRes = await companyAPI.getMine();
        setCompany(companyRes.data.company);
      } catch {
        // ignore
      }
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const { data } = await authAPI.register({ name, email, password });
    localStorage.setItem("bizos_token", data.access_token);
    localStorage.setItem("bizos_user", JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("bizos_token");
    localStorage.removeItem("bizos_user");
    setUser(null);
    setCompany(null);
  };

  const createCompany = async (companyData: {
    name: string;
    industry: string;
    website?: string;
    description?: string;
  }) => {
    const { data } = await companyAPI.create(companyData);
    setCompany(data.company);
    await refreshUser();
  };

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
        createCompany,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
