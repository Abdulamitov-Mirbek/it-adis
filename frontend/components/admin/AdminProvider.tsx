'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminUser } from '@/lib/types/admin';
import { adminAPI } from '@/lib/admin-api';

interface AdminContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for stored authentication
    const storedUser = adminAPI.getStoredUser();
    if (storedUser && adminAPI.isAuthenticated()) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await adminAPI.login(email, password);
      setUser(response.admin);
      router.push('/en/admin'); // Redirect to admin dashboard
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    adminAPI.logout();
    setUser(null);
    router.push('/en/admin/login');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user && adminAPI.isAuthenticated(),
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}