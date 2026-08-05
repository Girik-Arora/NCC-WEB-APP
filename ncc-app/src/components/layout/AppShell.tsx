'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import { UserRole } from '@/types';

interface AppShellProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function AppShell({ children, requiredRole }: AppShellProps) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (userProfile && !roles.includes(userProfile.role)) {
        // Redirect to correct dashboard
        if (userProfile.role === 'ano' || userProfile.role === 'admin') {
          router.replace('/ano/dashboard');
        } else {
          router.replace('/cadet/dashboard');
        }
      }
    }
  }, [user, userProfile, loading, requiredRole, router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid #e2e8f0', borderTop: '3px solid #1e3a5f',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fc' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: 240,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ flex: 1, padding: '32px', maxWidth: 1280 }} className="page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
