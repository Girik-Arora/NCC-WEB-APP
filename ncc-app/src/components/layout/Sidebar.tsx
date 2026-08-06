'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, User, Star, Trophy, Tent, Calendar,
  LogOut, ChevronLeft, ChevronRight, Users, Search,
  BarChart2, ClipboardList, Compass, Settings, Menu,
  GraduationCap,
} from 'lucide-react';

const NCC_LOGO = 'https://res.cloudinary.com/dxxvewmf5/image/upload/v1786034608/ncclogo_eitfib.webp';

const RANK_ABBREVIATIONS: Record<string, string> = {
  'Lieutenant': 'Lt.',
  'Captain': 'Capt.',
  'Major': 'Maj.',
  'Sub Lieutenant': 'S Lt.',
  'Lieutenant Commander': 'Lt. Cdr.',
  'Flying Officer': 'Fg. Off.',
  'Flight Lieutenant': 'Flt. Lt.',
  'Squadron Leader': 'Sqn. Ldr.',
  'Third Officer': 'T/O',
  'Second Officer': 'S/O',
  'First Officer': 'F/O',
  'Chief Officer': 'C/O'
};

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const cadetLinks: NavLink[] = [
  { href: '/cadet/dashboard',     label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { href: '/cadet/skills',        label: 'Skills',       icon: <Star size={18} /> },
  { href: '/cadet/achievements',  label: 'Achievements', icon: <Trophy size={18} /> },
  { href: '/cadet/camps',         label: 'Camp History', icon: <Tent size={18} /> },
  { href: '/cadet/availability',  label: 'Availability', icon: <Calendar size={18} /> },
];

const anoLinks: NavLink[] = [
  { href: '/ano/dashboard',  label: 'Dashboard',        icon: <LayoutDashboard size={18} /> },
  { href: '/ano/cadets',     label: 'Cadets',           icon: <Users size={18} /> },
  { href: '/ano/search',     label: 'Search',           icon: <Search size={18} /> },
  { href: '/ano/recommend',  label: 'Camp Recommend',   icon: <Compass size={18} /> },
  { href: '/ano/evaluate',   label: 'Evaluate',         icon: <ClipboardList size={18} /> },
  { href: '/ano/analytics',  label: 'Analytics',        icon: <BarChart2 size={18} /> },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  isDesktopCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  isMobileOpen = false,
  onMobileClose = () => {},
  isDesktopCollapsed = false,
  onToggleCollapse = () => {}
}: SidebarProps) {
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

  const rankPrefix = isAno && userProfile?.rank
    ? (RANK_ABBREVIATIONS[userProfile.rank] || userProfile.rank) + ' '
    : '';

  const sidebarClass = [
    'sidebar',
    isDesktopCollapsed ? 'collapsed' : '',
    isMobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${isMobileOpen ? 'open' : ''}`}
        onClick={onMobileClose}
      />

      <aside className={sidebarClass}>

        {/* ── Logo Area ── */}
        <div className="sidebar-logo-area">
          <div className="sidebar-logo-icon">
            <img
              src={NCC_LOGO}
              alt="NCC Logo"
              className="sidebar-logo-img"
              onError={(e) => {
                // fallback if logo fails
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>

          {!isDesktopCollapsed && (
            <div className="sidebar-logo-text">
              <h2>NCC TCET</h2>
              <p>National Cadet Corps</p>
            </div>
          )}

          {!isDesktopCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="desktop-toggle btn-ghost"
              style={{ color: 'rgba(255,255,255,0.4)', padding: '6px', marginLeft: 'auto' }}
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* ── Expand button when collapsed ── */}
        {isDesktopCollapsed && (
          <div className="desktop-toggle" style={{ padding: '10px 0', display: 'flex', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={onToggleCollapse}
              className="btn-ghost"
              style={{ color: 'rgba(255,255,255,0.4)', padding: '6px' }}
              title="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {!isDesktopCollapsed && (
            <div className="sidebar-section-label">
              {isAno ? 'Officer Tools' : 'Navigation'}
            </div>
          )}

          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-item ${active ? 'active' : ''}`}
                style={{ justifyContent: isDesktopCollapsed ? 'center' : undefined }}
                title={isDesktopCollapsed ? link.label : undefined}
                onClick={() => { if (isMobileOpen) onMobileClose(); }}
              >
                <span className="nav-icon">{link.icon}</span>
                {!isDesktopCollapsed && <span className="nav-label">{link.label}</span>}
                {active && !isDesktopCollapsed && (
                  <ChevronRight size={13} className="nav-chevron" style={{ marginLeft: 'auto', opacity: 0.5 }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Bottom Divider ── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

        {/* ── Footer ── */}
        <div className="sidebar-footer">
          {/* User card */}
          <div
            className="sidebar-user-card"
            onClick={() => {
              router.push(isAno ? '/ano/profile' : '/cadet/profile');
              if (isMobileOpen) onMobileClose();
            }}
            title={isDesktopCollapsed ? `${rankPrefix}${userProfile?.displayName || 'Profile'}` : undefined}
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="avatar"
                className="sidebar-user-avatar"
                style={{ objectFit: 'cover' }}
              />
            ) : (
              <div className="sidebar-user-avatar">{initials}</div>
            )}

            {!isDesktopCollapsed && (
              <div className="sidebar-user-info">
                <div className="name">
                  {rankPrefix}{userProfile?.displayName || user?.displayName || 'User'}
                </div>
                <div className="role-badge">
                  {isAno ? '★ Officer' : '◆ Cadet'}
                </div>
              </div>
            )}
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="nav-item"
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              color: 'rgba(252,165,165,0.8)',
              cursor: 'pointer',
              justifyContent: isDesktopCollapsed ? 'center' : undefined,
              fontSize: '13px',
              fontWeight: '500',
            }}
            title={isDesktopCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {!isDesktopCollapsed && <span className="nav-label">Sign Out</span>}
          </button>
        </div>

      </aside>
    </>
  );
}
