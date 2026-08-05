'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, User, Star, Trophy, Tent, Calendar,
  LogOut, Shield, ChevronRight, Users, Search,
  BarChart2, ClipboardList, Compass, Settings,
} from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const cadetLinks: NavLink[] = [
  { href: '/cadet/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/cadet/profile', label: 'My Profile', icon: <User size={18} /> },
  { href: '/cadet/skills', label: 'Skills', icon: <Star size={18} /> },
  { href: '/cadet/achievements', label: 'Achievements', icon: <Trophy size={18} /> },
  { href: '/cadet/camps', label: 'Camp History', icon: <Tent size={18} /> },
  { href: '/cadet/availability', label: 'Availability', icon: <Calendar size={18} /> },
];

const anoLinks: NavLink[] = [
  { href: '/ano/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { href: '/ano/cadets', label: 'Cadets', icon: <Users size={18} /> },
  { href: '/ano/search', label: 'Search', icon: <Search size={18} /> },
  { href: '/ano/recommend', label: 'Camp Recommendation', icon: <Compass size={18} /> },
  { href: '/ano/evaluate', label: 'Evaluate', icon: <ClipboardList size={18} /> },
  { href: '/ano/analytics', label: 'Analytics', icon: <BarChart2 size={18} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, userProfile } = useAuth();

  const isAno = userProfile?.role === 'ano' || userProfile?.role === 'admin';
  const links = isAno ? anoLinks : cadetLinks;

  const handleSignOut = async () => {
    await signOutUser();
    toast.success('Signed out successfully');
    router.push('/login');
  };

  const initials = userProfile?.displayName
    ? userProfile.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0].toUpperCase() || '?';

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: '#1e3a5f',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      position: 'fixed',
      left: 0,
      top: 0,
      bottom: 0,
      zIndex: 40,
      boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #c8960c, #f59e0b)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(200,150,12,0.35)',
          }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>NCC Portal</p>
            <p style={{ color: '#93c5fd', fontSize: 11, marginTop: 3 }}>
              {isAno ? 'Officer View' : 'Cadet View'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
        <p style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
          color: 'rgba(255,255,255,0.35)', padding: '0 8px',
          marginBottom: 8, textTransform: 'uppercase',
        }}>
          {isAno ? 'Officer Tools' : 'My Cadet'}
        </p>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link key={link.href} href={link.href} className={`nav-item ${active ? 'active' : ''}`}
              style={{ marginBottom: 2 }}>
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
              {active && <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </Link>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div style={{
        padding: '16px 12px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.06)', marginBottom: 8,
        }}>
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar"
              style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
          ) : (
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #1e3a5f)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 13,
            }}>{initials}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              color: 'white', fontSize: 13, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userProfile?.displayName || user?.displayName || 'Cadet'}
            </p>
            <p style={{
              color: '#93c5fd', fontSize: 11,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userProfile?.role === 'ano' ? 'ANO' : userProfile?.role === 'admin' ? 'Admin' : 'Cadet'}
            </p>
          </div>
        </div>
        <button onClick={handleSignOut} className="nav-item" style={{ width: '100%', background: 'none', border: 'none', color: '#fca5a5' }}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
