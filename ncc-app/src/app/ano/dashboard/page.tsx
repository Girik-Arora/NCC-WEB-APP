'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllCadets } from '@/lib/db';
import type { CadetProfile } from '@/types';
import { Users, UserCheck, GraduationCap, Tent, TrendingUp, ArrowRight, Activity, Shield, Target, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const RANK_ABBREVIATIONS: Record<string, string> = {
  'Lieutenant': 'Lt.', 'Captain': 'Capt.', 'Major': 'Maj.',
  'Sub Lieutenant': 'S Lt.', 'Lieutenant Commander': 'Lt. Cdr.',
  'Flying Officer': 'Fg. Off.', 'Flight Lieutenant': 'Flt. Lt.',
  'Squadron Leader': 'Sqn. Ldr.',
};

export default function ANODashboard() {
  const { userProfile } = useAuth();
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await getAllCadets();
        setCadets(c);
      } catch (err) {
        console.error('Error loading ANO dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalCadets = cadets.length;
  const profileComplete = cadets.filter((c) => c.profileComplete).length;
  const available = cadets.filter((c) => c.availability).length;
  const completionRate = totalCadets > 0 ? Math.round((profileComplete / totalCadets) * 100) : 0;
  const byBranch = cadets.reduce((acc, c) => { acc[c.branch] = (acc[c.branch] || 0) + 1; return acc; }, {} as Record<string, number>);
  const bySemester = cadets.reduce((acc, c) => { acc[c.semester] = (acc[c.semester] || 0) + 1; return acc; }, {} as Record<number, number>);

  const rankPrefix = userProfile?.rank ? (RANK_ABBREVIATIONS[userProfile.rank] || userProfile.rank) + ' ' : '';

  const stats = [
    {
      label: 'Total Cadets', value: totalCadets,
      icon: <Users size={20} />, iconBg: '#eff6ff', iconColor: '#2563eb',
      accent: '#bfdbfe', href: '/ano/cadets',
    },
    {
      label: 'Profiles Complete', value: profileComplete,
      icon: <UserCheck size={20} />, iconBg: '#f0fdf4', iconColor: '#16a34a',
      accent: '#bbf7d0', href: '/ano/cadets',
    },
    {
      label: 'Camp Ready', value: available,
      icon: <Tent size={20} />, iconBg: '#faf5ff', iconColor: '#7c3aed',
      accent: '#e9d5ff', href: '/ano/recommend',
    },
    {
      label: 'Completion Rate', value: loading ? '—' : `${completionRate}%`,
      icon: <TrendingUp size={20} />, iconBg: '#fffbeb', iconColor: '#d97706',
      accent: '#fde68a', href: '/ano/analytics',
    },
  ];

  const quickActions = [
    { href: '/ano/recommend',  icon: <Tent size={16} />,         label: 'Camp Recommendation', desc: 'Find best cadets for a camp', iconBg: '#f0fdf4', iconColor: '#16a34a' },
    { href: '/ano/evaluate',   icon: <GraduationCap size={16} />, label: 'Semester Evaluation',  desc: 'Evaluate cadet performance',  iconBg: '#eff6ff', iconColor: '#2563eb' },
    { href: '/ano/cadets',     icon: <Users size={16} />,         label: 'Browse Cadets',        desc: 'View all registered cadets', iconBg: '#faf5ff', iconColor: '#7c3aed' },
    { href: '/ano/search',     icon: <Target size={16} />,        label: 'Search Cadets',        desc: 'Search by skill, name, branch', iconBg: '#fffbeb', iconColor: '#d97706' },
    { href: '/ano/analytics',  icon: <BarChart3 size={16} />,     label: 'Analytics',            desc: 'Performance trends & charts', iconBg: '#f0f9ff', iconColor: '#0369a1' },
  ];

  const branchColors: Record<string, { bar: string; bg: string }> = {
    'Army':      { bar: '#16a34a', bg: '#f0fdf4' },
    'Navy':      { bar: '#1d4ed8', bg: '#eff6ff' },
    'Air Force': { bar: '#0369a1', bg: '#f0f9ff' },
  };

  if (loading) {
    return (
      <AppShell requiredRole={['ano', 'admin']}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 100 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="skeleton" style={{ height: 300 }} />
          <div className="skeleton" style={{ height: 300 }} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell requiredRole={['ano', 'admin']}>

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            Welcome back,
          </p>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 30, fontWeight: 700, color: 'var(--text-heading)',
            letterSpacing: '0.3px', marginBottom: 4,
          }}>
            {rankPrefix}{userProfile?.displayName || 'Officer'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Officer Dashboard · Manage cadets, run evaluations, recommend for camps
          </p>
        </div>

        {/* Status pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--surface-0)', border: '1px solid var(--border-light)',
          borderRadius: 12, padding: '10px 16px', boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: '#16a34a', boxShadow: '0 0 0 3px rgba(22,163,74,0.2)',
          }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)' }}>System Active</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{totalCadets} cadets enrolled</p>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ borderTop: `3px solid ${stat.accent}` }}>
              <div className="stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                {stat.icon}
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>

        {/* ── Left: Quick Actions + Completion ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={17} color="#2563eb" />
                </div>
                <h3>Quick Actions</h3>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <div className="action-card">
                    <div className="action-icon" style={{ background: action.iconBg, color: action.iconColor }}>
                      {action.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-heading)' }}>{action.label}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{action.desc}</p>
                    </div>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Completion Progress */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={17} color="#16a34a" />
                </div>
                <h3>Platoon Status</h3>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  position: 'relative', width: 80, height: 80,
                  background: `conic-gradient(#16a34a ${completionRate * 3.6}deg, var(--bg-secondary) 0deg)`,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    position: 'absolute', inset: 10, borderRadius: '50%',
                    background: 'var(--surface-0)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#16a34a', fontFamily: "'Rajdhani', sans-serif" }}>{completionRate}%</span>
                  </div>
                </div>
              </div>
              <div style={{ flex: 2 }}>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Profiles Complete</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{profileComplete}/{totalCadets}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${completionRate}%`, background: 'linear-gradient(90deg, #16a34a, #22c55e)' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Camp Ready</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{available}/{totalCadets}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: totalCadets > 0 ? `${Math.round((available/totalCadets)*100)}%` : '0%', background: 'linear-gradient(90deg, #7c3aed, #a855f7)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Branch + Semester ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* By Branch */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={17} color="#7c3aed" />
                </div>
                <h3>By Branch</h3>
              </div>
            </div>
            {Object.entries(byBranch).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(byBranch).map(([branch, count]) => {
                  const pct = totalCadets > 0 ? (count / totalCadets) * 100 : 0;
                  const colors = branchColors[branch] || { bar: '#6b7280', bg: '#f3f4f6' };
                  return (
                    <div key={branch}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.bar }} />
                          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{branch}</span>
                        </div>
                        <span style={{
                          background: colors.bg, color: colors.bar,
                          borderRadius: 6, padding: '2px 8px',
                          fontSize: 12, fontWeight: 700
                        }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${colors.bar}, ${colors.bar}99)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No cadet data yet.</p>
            )}
          </div>

          {/* By Semester */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GraduationCap size={17} color="#d97706" />
                </div>
                <h3>By Semester</h3>
              </div>
            </div>
            {Object.entries(bySemester).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {Object.entries(bySemester).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([sem, count]) => (
                  <div key={sem} style={{
                    padding: '10px 6px', borderRadius: 8,
                    background: 'var(--bg-primary)', textAlign: 'center',
                    border: '1px solid var(--border-light)',
                  }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--navy-600)', fontFamily: "'Rajdhani', sans-serif", lineHeight: 1 }}>{count}</p>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>Sem {sem}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No cadet data yet.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
