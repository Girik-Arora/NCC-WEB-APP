'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  getAllCadets, getAllParades, getAllEvents,
  getAllAnnouncements, getAllApplications, getAllInventory,
  getAllMedicalRecords, getAllPromotions, getRecentAuditLogs,
} from '@/lib/db';
import {
  Shield, Users, Calendar, MapPin, Bell, Package,
  TrendingUp, HeartPulse, CheckCircle, Clock, AlertTriangle,
  BarChart3, ChevronRight, Activity, Megaphone, FileText
} from 'lucide-react';
import Link from 'next/link';

interface StatCard {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

export default function CommandDashboardPage() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalCadets: 0,
    armyCadets: 0,
    navyCadets: 0,
    airForceCadets: 0,
    activeCadets: 0,
    pendingApplications: 0,
    todayParades: 0,
    upcomingEvents: 0,
    unreadAnnouncements: 0,
    lowStockItems: 0,
    unfitCadets: 0,
    pendingPromotions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [cadets, parades, events, anns, apps, inventory, medical, promotions, logs] =
          await Promise.all([
            getAllCadets(),
            getAllParades(),
            getAllEvents(),
            getAllAnnouncements(),
            getAllApplications(),
            getAllInventory(),
            getAllMedicalRecords(),
            getAllPromotions(),
            getRecentAuditLogs(10),
          ]);

        const today = new Date().toISOString().split('T')[0];
        const todayParades = parades.filter(p => p.date === today).length;

        const upcomingEvents = events.filter(e => e.date >= today).length;

        const lowStock = inventory.filter(i => i.availableQuantity <= 2).length;
        const unfitCadets = medical.filter(m => m.fitnessStatus === 'Temporarily Unfit' || m.fitnessStatus === 'Permanently Unfit').length;
        const pendingApps = apps.filter(a => a.status === 'new').length;
        const pendingPromos = promotions.filter(p => p.status === 'pending').length;

        setStats({
          totalCadets: cadets.length,
          armyCadets: cadets.filter(c => c.branch === 'Army').length,
          navyCadets: cadets.filter(c => c.branch === 'Navy').length,
          airForceCadets: cadets.filter(c => c.branch === 'Air Force').length,
          activeCadets: cadets.filter(c => c.lifecycleStatus === 'active' || !c.lifecycleStatus).length,
          pendingApplications: pendingApps,
          todayParades,
          upcomingEvents,
          unreadAnnouncements: anns.length,
          lowStockItems: lowStock,
          unfitCadets,
          pendingPromotions: pendingPromos,
        });

        setAnnouncements(anns.slice(0, 5));
        setRecentActivity(logs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statCards: StatCard[] = [
    {
      label: 'Total Cadets', value: stats.totalCadets, sub: `Army: ${stats.armyCadets} · Navy: ${stats.navyCadets} · AF: ${stats.airForceCadets}`,
      icon: <Users size={22} />, color: 'var(--navy-600)', href: '/command/cadets'
    },
    {
      label: 'Active Cadets', value: stats.activeCadets, sub: 'Currently enrolled',
      icon: <Activity size={22} />, color: '#15803d', href: '/command/cadets'
    },
    {
      label: 'Pending Applications', value: stats.pendingApplications, sub: 'New enrollment requests',
      icon: <FileText size={22} />, color: '#b45309', href: '/command/enrollment'
    },
    {
      label: 'Parades Today', value: stats.todayParades, sub: 'Scheduled sessions',
      icon: <Calendar size={22} />, color: 'var(--navy-500)', href: '/command/attendance'
    },
    {
      label: 'Upcoming Events', value: stats.upcomingEvents, sub: 'Planned activities',
      icon: <MapPin size={22} />, color: '#7c3aed', href: '/command/events'
    },
    {
      label: 'Announcements', value: stats.unreadAnnouncements, sub: 'Total active notices',
      icon: <Megaphone size={22} />, color: '#0369a1', href: '/command/communication'
    },
    {
      label: 'Low Stock Items', value: stats.lowStockItems, sub: 'Inventory alerts',
      icon: <Package size={22} />, color: '#dc2626', href: '/command/inventory'
    },
    {
      label: 'Medical Flags', value: stats.unfitCadets, sub: 'Temporarily/Permanently Unfit',
      icon: <HeartPulse size={22} />, color: '#be185d', href: '/command/medical'
    },
    {
      label: 'Pending Promotions', value: stats.pendingPromotions, sub: 'Awaiting approval',
      icon: <TrendingUp size={22} />, color: '#d97706', href: '/command/promotions'
    },
  ];

  const quickActions = [
    { label: 'Mark Attendance', href: '/command/attendance/new', icon: <Calendar size={18} />, desc: 'Start a new parade session' },
    { label: 'Create Event', href: '/command/events/new', icon: <MapPin size={18} />, desc: 'Log an activity or event' },
    { label: 'Send Notice', href: '/command/communication', icon: <Megaphone size={18} />, desc: 'Broadcast an announcement' },
    { label: 'Schedule Training', href: '/command/training/new', icon: <BarChart3 size={18} />, desc: 'Add a training session' },
    { label: 'Enroll Cadet', href: '/command/enrollment', icon: <Users size={18} />, desc: 'Process new applications' },
    { label: 'Add Document', href: '/command/documents/new', icon: <FileText size={18} />, desc: 'Upload to document store' },
  ];

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 4px' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, var(--navy-700), var(--navy-500))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Shield size={24} color="var(--gold-400)" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 0.5 }}>
                Command Dashboard
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                TCET NCC — Digital Operating System
              </p>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}>
          {statCards.map((card) => (
            <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{
                background: 'var(--surface-0)',
                border: '1px solid var(--border-light)',
                borderRadius: 14,
                padding: '18px 20px',
                display: 'flex', flexDirection: 'column', gap: 12,
                cursor: 'pointer',
                transition: 'var(--transition-normal)',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: `${card.color}18`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: card.color,
                  }}>
                    {card.icon}
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1 }}>
                    {loading ? '—' : card.value}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)', marginTop: 4 }}>{card.label}</div>
                  {card.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{card.sub}</div>}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Bottom Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Quick Actions */}
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 14, padding: 22,
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>
              ⚡ Quick Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    border: '1px solid var(--border-light)', borderRadius: 10,
                    padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4,
                    transition: 'var(--transition-fast)',
                    cursor: 'pointer',
                  }}
                    className="quick-action-card"
                  >
                    <div style={{ color: 'var(--navy-600)', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, fontSize: 12.5 }}>
                      {action.icon} {action.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Announcements */}
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 14, padding: 22,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>
                📢 Recent Announcements
              </div>
              <Link href="/command/communication" style={{ fontSize: 12, color: 'var(--navy-600)', textDecoration: 'none', fontWeight: 500 }}>
                View all →
              </Link>
            </div>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
            ) : announcements.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No announcements yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {announcements.map((a) => (
                  <div key={a.id} style={{
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    borderRadius: 8,
                    borderLeft: `3px solid ${a.priority === 'urgent' ? 'var(--danger)' : a.priority === 'important' ? 'var(--warning)' : 'var(--navy-400)'}`,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      By {a.createdByName} · {a.priority?.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 14, padding: 22,
            gridColumn: '1 / -1',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16 }}>
              🕐 Recent System Activity
            </div>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading...</div>
            ) : recentActivity.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No activity recorded yet
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {recentActivity.map((log) => (
                  <div key={log.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--bg-secondary)',
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: log.action === 'CREATE' ? 'var(--success)' : log.action === 'DELETE' ? 'var(--danger)' : 'var(--navy-400)',
                      flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, fontSize: 13, color: 'var(--text-body)' }}>
                      <span style={{ fontWeight: 600 }}>{log.actorName}</span>
                      {' '}{log.action.toLowerCase()}d in <span style={{ color: 'var(--navy-600)', fontWeight: 500 }}>{log.module}</span>
                      {log.targetDescription && <span style={{ color: 'var(--text-muted)' }}> — {log.targetDescription}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                      {log.actorRole}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`
        .stat-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: var(--border-mid); }
        .quick-action-card:hover { background: var(--bg-secondary); border-color: var(--navy-300); }
      `}</style>
    </AppShell>
  );
}
