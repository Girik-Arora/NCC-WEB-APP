'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllCadets } from '@/lib/db';
import type { CadetProfile } from '@/types';
import { Users, UserCheck, GraduationCap, Tent, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ANODashboard() {
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const c = await getAllCadets();
        setCadets(c);
      } catch (err) {
        console.error("Error loading ANO dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalCadets = cadets.length;
  const profileComplete = cadets.filter((c) => c.profileComplete).length;
  const available = cadets.filter((c) => c.availability).length;
  const byBranch = cadets.reduce((acc, c) => { acc[c.branch] = (acc[c.branch] || 0) + 1; return acc; }, {} as Record<string, number>);
  const bySemester = cadets.reduce((acc, c) => { acc[c.semester] = (acc[c.semester] || 0) + 1; return acc; }, {} as Record<number, number>);

  const stats = [
    { label: 'Total Cadets', value: totalCadets, icon: <Users size={22} color="#2563eb" />, color: '#eff6ff', border: '#bfdbfe', href: '/ano/cadets' },
    { label: 'Profiles Complete', value: profileComplete, icon: <UserCheck size={22} color="#16a34a" />, color: '#f0fdf4', border: '#bbf7d0', href: '/ano/cadets' },
    { label: 'Available for Camp', value: available, icon: <Tent size={22} color="#7c3aed" />, color: '#faf5ff', border: '#e9d5ff', href: '/ano/recommend' },
    { label: 'Completion Rate', value: totalCadets > 0 ? `${Math.round((profileComplete / totalCadets) * 100)}%` : '0%', icon: <TrendingUp size={22} color="#d97706" />, color: '#fffbeb', border: '#fde68a', href: '/ano/analytics' },
  ];

  const quickActions = [
    { href: '/ano/recommend', icon: <Tent size={18} />, label: 'Run Camp Recommendation', desc: 'Find best cadets for a camp', color: '#eff6ff' },
    { href: '/ano/evaluate', icon: <GraduationCap size={18} />, label: 'Semester Evaluation', desc: 'Evaluate cadet performance', color: '#f0fdf4' },
    { href: '/ano/search', icon: <Users size={18} />, label: 'Search Cadets', desc: 'Search by skill, name, branch', color: '#faf5ff' },
    { href: '/ano/analytics', icon: <TrendingUp size={18} />, label: 'View Analytics', desc: 'Performance trends and charts', color: '#fffbeb' },
  ];

  return (
    <AppShell requiredRole={['ano', 'admin']}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 4 }}>Welcome back,</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>ANO Dashboard</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Manage cadets, run evaluations, and recommend for camps.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ borderTop: `3px solid ${stat.border}` }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                {loading ? '—' : stat.value}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Quick Actions */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px',
                  borderRadius: 8, border: '1px solid #f1f5f9', transition: 'all 0.2s', cursor: 'pointer',
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9fc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f' }}>
                    {action.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{action.label}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{action.desc}</p>
                  </div>
                  <ArrowRight size={16} color="#94a3b8" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Branch & Semester breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>By Branch</h3>
            {Object.entries(byBranch).length > 0 ? (
              Object.entries(byBranch).map(([branch, count]) => (
                <div key={branch} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{branch}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{count}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(count / totalCadets) * 100}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No cadet data yet.</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>By Semester</h3>
            {Object.entries(bySemester).length > 0 ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.entries(bySemester).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([sem, count]) => (
                  <div key={sem} style={{
                    padding: '8px 14px', borderRadius: 8, background: '#f1f5f9',
                    textAlign: 'center' as const,
                  }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: '#1e3a5f' }}>{count}</p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>Sem {sem}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No cadet data yet.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
