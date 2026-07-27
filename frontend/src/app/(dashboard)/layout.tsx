'use client';

import React, { useEffect } from 'react';
import { Navbar } from '@/shared/components/layout/Navbar';
import { useAuth } from '@/shared/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Route protection fallback (since middleware might not catch client-side routing properly without cookies)
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-primary font-medium">Cargando...</div>;
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  );
}
