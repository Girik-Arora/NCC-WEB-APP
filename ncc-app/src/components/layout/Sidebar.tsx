'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { signOutUser } from '@/lib/auth';
import { RANK_LABELS, ROLE_LABELS } from '@/types';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, User, Star, Trophy, Tent, Calendar,
  LogOut, ChevronLeft, ChevronRight, Users, Search,
  BarChart2, ClipboardList, Compass, Settings, Menu,
  GraduationCap, Shield, ShieldCheck, Zap, Bell, FileText,
  Package, HeartPulse, TrendingUp, Wallet, BookOpen,
  Clipboard, UserCheck, Home, Award, Activity, Radio,
  ChevronDown, ChevronUp, MapPin, Megaphone, Archive
} from 'lucide-react';
import { useState } from 'react';

const NCC_LOGO = 'https://res.cloudinary.com/dxxvewmf5/image/upload/v1786034608/ncclogo_eitfib.webp';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

interface NavGroup {
  label: string;
  links: NavLink[];
}

// ─── CADET Navigation ──────────────────────────────────────────────────────────
const cadetGroups: NavGroup[] = [
  {
    label: 'My Portal',
    links: [
      { href: '/cadet/dashboard',    label: 'Dashboard',       icon: <LayoutDashboard size={17} /> },
      { href: '/cadet/profile',      label: 'My Profile',      icon: <User size={17} /> },
      { href: '/cadet/scorecard',    label: 'Scorecard',       icon: <Award size={17} /> },
    ],
  },
  {
    label: 'Training & Activities',
    links: [
      { href: '/cadet/attendance',   label: 'My Attendance',   icon: <Calendar size={17} /> },
      { href: '/cadet/training',     label: 'Training Record', icon: <BookOpen size={17} /> },
      { href: '/cadet/skills',       label: 'Skills',          icon: <Star size={17} /> },
      { href: '/cadet/achievements', label: 'Achievements',    icon: <Trophy size={17} /> },
      { href: '/cadet/camps',        label: 'Camp History',    icon: <Tent size={17} /> },
      { href: '/cadet/events',       label: 'Events',          icon: <MapPin size={17} /> },
    ],
  },
  {
    label: 'Records',
    links: [
      { href: '/cadet/certificate', label: 'Certificates',    icon: <Award size={17} /> },
      { href: '/cadet/medical',      label: 'Medical',         icon: <HeartPulse size={17} /> },
      { href: '/cadet/uniform',      label: 'Uniform Issued',  icon: <Package size={17} /> },
    ],
  },
  {
    label: 'Tools',
    links: [
      { href: '/cadet/notices',      label: 'Notices',         icon: <Bell size={17} /> },
      { href: '/cadet/availability', label: 'Availability',    icon: <Activity size={17} /> },
      { href: '/cadet/auto-lodge',   label: 'Auto-Lodge',      icon: <Zap size={17} color="#eab308" /> },
    ],
  },
];

// ─── SENIOR CADET (mod_cadet) Navigation ──────────────────────────────────────
const modCadetGroups: NavGroup[] = [
  {
    label: 'My Portal',
    links: [
      { href: '/mod-cadet/dashboard',    label: 'Dashboard',       icon: <LayoutDashboard size={17} /> },
      { href: '/mod-cadet/profile',      label: 'My Profile',      icon: <User size={17} /> },
      { href: '/mod-cadet/scorecard',    label: 'Scorecard',       icon: <Award size={17} /> },
    ],
  },
  {
    label: 'Training & Activities',
    links: [
      { href: '/mod-cadet/attendance',   label: 'My Attendance',   icon: <Calendar size={17} /> },
      { href: '/mod-cadet/training',     label: 'Training Record', icon: <BookOpen size={17} /> },
      { href: '/mod-cadet/skills',       label: 'Skills',          icon: <Star size={17} /> },
      { href: '/mod-cadet/achievements', label: 'Achievements',    icon: <Trophy size={17} /> },
      { href: '/mod-cadet/camps',        label: 'Camp History',    icon: <Tent size={17} /> },
      { href: '/mod-cadet/certificate',  label: 'Certificate',     icon: <Award size={17} /> },
      { href: '/mod-cadet/events',       label: 'Events',          icon: <Calendar size={17} /> },
    ],
  },
  {
    label: 'Senior Duties',
    links: [
      { href: '/mod-cadet/dashboard?tab=verify', label: 'Verify Cadets',   icon: <ShieldCheck size={17} /> },
      { href: '/mod-cadet/roster',               label: 'Platoon Roster',  icon: <Users size={17} /> },
    ],
  },
  {
    label: 'Tools & Info',
    links: [
      { href: '/mod-cadet/notices',      label: 'Notices',         icon: <Bell size={17} /> },
      { href: '/mod-cadet/auto-lodge',   label: 'Auto-Lodge',      icon: <Zap size={17} color="#eab308" /> },
      { href: '/mod-cadet/medical',      label: 'Medical Records', icon: <HeartPulse size={17} /> },
      { href: '/mod-cadet/uniform',      label: 'Uniform & Gear',  icon: <Package size={17} /> },
      { href: '/mod-cadet/availability', label: 'Availability',    icon: <Calendar size={17} /> },
    ],
  },
];


// ─── ANO / OIC Navigation (Command Portal) ────────────────────────────────────
const commandGroups: NavGroup[] = [
  {
    label: 'Command Centre',
    links: [
      { href: '/command/dashboard',    label: 'Command Dashboard', icon: <LayoutDashboard size={17} /> },
      { href: '/ano/dashboard',        label: 'ANO Dashboard',     icon: <Shield size={17} /> },
    ],
  },
  {
    label: 'Cadets',
    links: [
      { href: '/command/cadets',      label: 'Cadet Roster',      icon: <Users size={17} /> },
      { href: '/command/enrollment',  label: 'Enrollment',        icon: <UserCheck size={17} /> },
      { href: '/command/promotions',  label: 'Promotions',        icon: <TrendingUp size={17} /> },
      { href: '/command/alumni',      label: 'Alumni',            icon: <GraduationCap size={17} /> },
    ],
  },
  {
    label: 'Training & Operations',
    links: [
      { href: '/command/attendance',  label: 'Attendance',        icon: <Calendar size={17} /> },
      { href: '/command/training',    label: 'Training',          icon: <BookOpen size={17} /> },
      { href: '/command/camps',       label: 'Camps',             icon: <Tent size={17} /> },
      { href: '/command/events',      label: 'Events',            icon: <MapPin size={17} /> },
    ],
  },
  {
    label: 'ANO Tools',
    links: [
      { href: '/ano/evaluate',         label: 'Evaluate',          icon: <ClipboardList size={17} /> },
      { href: '/ano/recommend',        label: 'Camp Recommend',    icon: <Compass size={17} /> },
      { href: '/ano/search',           label: 'Cadet Search',      icon: <Search size={17} /> },
      { href: '/command/analytics',    label: 'Analytics',         icon: <BarChart2 size={17} /> },
    ],
  },
  {
    label: 'Administration',
    links: [
      { href: '/command/communication', label: 'Communication',   icon: <Megaphone size={17} /> },
      { href: '/command/documents',     label: 'Documents',       icon: <FileText size={17} /> },
      { href: '/command/inventory',     label: 'Inventory',       icon: <Package size={17} /> },
      { href: '/command/medical',       label: 'Medical',         icon: <HeartPulse size={17} /> },
      { href: '/command/finance',       label: 'Finance',         icon: <Wallet size={17} /> },
      { href: '/command/compliance',    label: 'Compliance',      icon: <Clipboard size={17} /> },
      { href: '/command/analytics',     label: 'Analytics',       icon: <BarChart2 size={17} /> },
      { href: '/command/admin',         label: 'Admin Panel',     icon: <Settings size={17} /> },
    ],
  },
];

// ─── ADMIN Navigation ──────────────────────────────────────────────────────────
const adminGroups: NavGroup[] = [
  {
    label: 'System',
    links: [
      { href: '/admin/dashboard',    label: 'Dashboard',       icon: <LayoutDashboard size={17} /> },
      { href: '/admin/users',        label: 'User Management', icon: <Shield size={17} /> },
    ],
  },
  {
    label: 'Command Portal',
    links: [
      { href: '/command/dashboard',  label: 'Command Centre',  icon: <Radio size={17} /> },
      { href: '/command/cadets',     label: 'Cadet Roster',    icon: <Users size={17} /> },
      { href: '/command/enrollment', label: 'Enrollment',      icon: <UserCheck size={17} /> },
      { href: '/command/attendance', label: 'Attendance',      icon: <Calendar size={17} /> },
      { href: '/command/training',   label: 'Training',        icon: <BookOpen size={17} /> },
      { href: '/command/camps',      label: 'Camps',           icon: <Tent size={17} /> },
      { href: '/command/events',     label: 'Events',          icon: <MapPin size={17} /> },
      { href: '/command/communication', label: 'Communication', icon: <Megaphone size={17} /> },
      { href: '/command/documents',  label: 'Documents',       icon: <FileText size={17} /> },
      { href: '/command/inventory',  label: 'Inventory',       icon: <Package size={17} /> },
      { href: '/command/medical',    label: 'Medical',         icon: <HeartPulse size={17} /> },
      { href: '/command/finance',    label: 'Finance',         icon: <Wallet size={17} /> },
      { href: '/command/promotions', label: 'Promotions',      icon: <TrendingUp size={17} /> },
      { href: '/command/compliance', label: 'Compliance',      icon: <Clipboard size={17} /> },
      { href: '/command/alumni',     label: 'Alumni',          icon: <GraduationCap size={17} /> },
    ],
  },
  {
    label: 'Data & Records',
    links: [
      { href: '/admin/cadets',       label: 'Cadets',          icon: <Users size={17} /> },
      { href: '/admin/camps',        label: 'Camps',           icon: <Tent size={17} /> },
      { href: '/admin/skills',       label: 'Skills',          icon: <Star size={17} /> },
      { href: '/admin/achievements', label: 'Achievements',    icon: <Trophy size={17} /> },
      { href: '/admin/evaluations',  label: 'Evaluations',     icon: <ClipboardList size={17} /> },
    ],
  },
  {
    label: 'Analytics',
    links: [
      { href: '/ano/analytics',      label: 'Analytics',       icon: <BarChart2 size={17} /> },
      { href: '/ano/recommend',      label: 'Camp Recommend',  icon: <Compass size={17} /> },
    ],
  },
];

// ─── ALUMNI Navigation ─────────────────────────────────────────────────────────
const alumniGroups: NavGroup[] = [
  {
    label: 'Alumni Portal',
    links: [
      { href: '/alumni/dashboard',   label: 'My Dashboard',    icon: <LayoutDashboard size={17} /> },
      { href: '/cadet/profile',      label: 'My History',      icon: <Archive size={17} /> },
    ],
  },
];

// ─── CLERK Navigation ──────────────────────────────────────────────────────────
const clerkGroups: NavGroup[] = [
  {
    label: 'Clerk Portal',
    links: [
      { href: '/command/cadets',     label: 'Cadet Roster',    icon: <Users size={17} /> },
      { href: '/command/attendance', label: 'Attendance',      icon: <Calendar size={17} /> },
      { href: '/command/events',     label: 'Events',          icon: <MapPin size={17} /> },
      { href: '/command/documents',  label: 'Documents',       icon: <FileText size={17} /> },
      { href: '/command/inventory',  label: 'Inventory',       icon: <Package size={17} /> },
    ],
  },
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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const role = userProfile?.role;

  const groups =
    role === 'admin'     ? adminGroups :
    role === 'ano'       ? commandGroups :
    role === 'oic'       ? commandGroups :
    role === 'clerk'     ? clerkGroups :
    role === 'alumni'    ? alumniGroups :
    role === 'mod_cadet' ? modCadetGroups :
                          cadetGroups;

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      router.push('/login');
    } catch {
      toast.error('Sign out failed');
    }
  };

  const displayName = userProfile?.displayName || user?.displayName || 'User';
  const roleLabel = role ? ROLE_LABELS[role] : 'Member';

  const nccRank = userProfile?.nccRank;
  const rankLabel = nccRank ? (RANK_LABELS[nccRank] || nccRank) : null;
  const officerRank = userProfile?.rank;

  const sidebarContent = (
    <nav
      style={{
        width: isDesktopCollapsed ? 72 : 260,
        minHeight: '100vh',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        overflow: 'hidden',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 200,
      }}
    >
      {/* ── Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: isDesktopCollapsed ? '20px 0' : '20px 20px',
        justifyContent: isDesktopCollapsed ? 'center' : 'space-between',
        borderBottom: '1px solid var(--sidebar-border)',
        minHeight: 70,
      }}>
        {!isDesktopCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
            <img src={NCC_LOGO} alt="NCC" style={{ width: 36, height: 36, objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1 }}>NCC TCET</div>
              <div style={{ color: 'var(--gold-400)', fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase' }}>Command Portal</div>
            </div>
          </div>
        )}
        {isDesktopCollapsed && (
          <img src={NCC_LOGO} alt="NCC" style={{ width: 32, height: 32, objectFit: 'contain' }} />
        )}
        <button
          onClick={onToggleCollapse}
          className="sidebar-toggle-btn"
          title={isDesktopCollapsed ? 'Expand' : 'Collapse'}
        >
          {isDesktopCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* ── User Profile ── */}
      {!isDesktopCollapsed && (
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--sidebar-border)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid var(--gold-600)', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--navy-500), var(--navy-700))',
                border: '2px solid var(--gold-600)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 14
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{
                color: 'var(--sidebar-text-active)', fontSize: 13, fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {officerRank ? `${officerRank} ` : ''}{displayName}
              </div>
              <div style={{
                color: 'var(--gold-400)', fontSize: 10, fontWeight: 600,
                letterSpacing: 0.5, textTransform: 'uppercase',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {rankLabel || roleLabel}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Nav Links ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '8px 0' }}>
        {groups.map((group) => {
          const isGroupCollapsed = collapsedGroups.has(group.label);
          return (
            <div key={group.label} style={{ marginBottom: 4 }}>
              {!isDesktopCollapsed && (
                <button
                  onClick={() => toggleGroup(group.label)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: '100%', padding: '6px 18px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(255,255,255,0.35)', fontSize: 10,
                    fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
                    marginTop: 4,
                  }}
                >
                  {group.label}
                  {isGroupCollapsed ? <ChevronRight size={11} /> : <ChevronDown size={11} />}
                </button>
              )}
              {!isGroupCollapsed && group.links.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/cadet/dashboard' && link.href !== '/ano/dashboard' && link.href !== '/admin/dashboard' && link.href !== '/command/dashboard' && link.href !== '/mod-cadet/dashboard' && link.href !== '/alumni/dashboard' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onMobileClose}
                    title={isDesktopCollapsed ? link.label : undefined}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isDesktopCollapsed ? 0 : 10,
                      padding: isDesktopCollapsed ? '10px 0' : '9px 18px',
                      justifyContent: isDesktopCollapsed ? 'center' : 'flex-start',
                      borderRadius: isDesktopCollapsed ? 0 : 8,
                      margin: isDesktopCollapsed ? '1px 0' : '1px 8px',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? 'var(--sidebar-text-active)' : 'var(--sidebar-text)',
                      background: isActive
                        ? 'var(--sidebar-active-bg)'
                        : 'transparent',
                      borderLeft: isActive && !isDesktopCollapsed
                        ? '3px solid var(--sidebar-active-border)'
                        : isDesktopCollapsed ? 'none' : '3px solid transparent',
                      transition: 'var(--transition-fast)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                    className="sidebar-nav-link"
                  >
                    <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', opacity: isActive ? 1 : 0.75 }}>
                      {link.icon}
                    </span>
                    {!isDesktopCollapsed && (
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {link.label}
                        {link.badge && (
                          <span style={{
                            marginLeft: 6,
                            background: 'var(--gold-600)',
                            color: '#fff',
                            borderRadius: 99,
                            padding: '1px 7px',
                            fontSize: 10,
                            fontWeight: 700,
                          }}>{link.badge}</span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: '1px solid var(--sidebar-border)',
        padding: isDesktopCollapsed ? '12px 0' : '12px 8px',
      }}>
        <button
          onClick={handleSignOut}
          className="sidebar-nav-link"
          title="Sign Out"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: isDesktopCollapsed ? 0 : 10,
            padding: isDesktopCollapsed ? '10px 0' : '9px 18px',
            justifyContent: isDesktopCollapsed ? 'center' : 'flex-start',
            width: '100%',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'rgba(255,80,80,0.75)',
            fontSize: 13,
            fontWeight: 500,
            borderRadius: 8,
            margin: isDesktopCollapsed ? '0' : '0',
            transition: 'var(--transition-fast)',
            whiteSpace: 'nowrap',
          }}
        >
          <LogOut size={17} />
          {!isDesktopCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">{sidebarContent}</div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            zIndex: 299,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className="mobile-sidebar"
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0,
          transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 300,
        }}
      >
        {sidebarContent}
      </div>
    </>
  );
}
