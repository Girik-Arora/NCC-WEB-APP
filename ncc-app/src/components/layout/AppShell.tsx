'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import { UserRole } from '@/types';
import { Menu } from 'lucide-react';

const NCC_LOGO = 'https://res.cloudinary.com/dxxvewmf5/image/upload/v1786034608/ncclogo_eitfib.webp';

interface AppShellProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function AppShell({ children, requiredRole }: AppShellProps) {
  const { user, userProfile, cadetProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const SIDEBAR_WIDTH = isDesktopCollapsed ? 72 : 260;

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Auto-reset desktop collapse on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsDesktopCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (userProfile && !roles.includes(userProfile.role)) {
        if (userProfile.role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (userProfile.role === 'ano') {
          router.replace('/ano/dashboard');
        } else if (userProfile.role === 'oic') {
          router.replace('/command/dashboard');
        } else if (userProfile.role === 'clerk') {
          router.replace('/command/cadets');
        } else if (userProfile.role === 'alumni') {
          router.replace('/alumni/dashboard');
        } else if (userProfile.role === 'mod_cadet') {
          router.replace('/mod-cadet/dashboard');
        } else {
          router.replace('/cadet/dashboard');
        }
      }
    }
  }, [user, userProfile, cadetProfile, loading, requiredRole, router, pathname]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src={NCC_LOGO}
            alt="NCC Logo"
            style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 20, opacity: 0.85 }}
          />
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid var(--border-light)',
            borderTop: '3px solid var(--navy-600)',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>Loading NCC TCET...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* ── Mobile Top Header ── */}
      <div className="mobile-header">
        <button
          onClick={() => setIsMobileOpen(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '8px', marginRight: '12px', color: 'var(--navy-600)',
            display: 'flex', alignItems: 'center'
          }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-header-logo">
          <img src={NCC_LOGO} alt="NCC" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span>NCC TCET</span>
        </div>
      </div>

      <Sidebar
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
        isDesktopCollapsed={isDesktopCollapsed}
        onToggleCollapse={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
      />

      <main
        className="main-content"
        style={{ flex: 1, minWidth: 0 }}
      >
        <div className="page-content page-enter">
          {children}
        </div>
      </main>
    </div>
  );
}
