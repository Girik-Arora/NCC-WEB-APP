'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import {
  getAllCadets, getAllParades, getAllTrainingSessions, getAllEvents,
  getAllInventory, getAllMedicalRecords, getAllPromotions, getAllFinanceRecords,
  getAllCampEvents, getAllApplications,
} from '@/lib/db';
import { BarChart3, TrendingUp, Users, Calendar, Package, Wallet } from 'lucide-react';

export default function CommandAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [cadets, parades, training, events, inventory, medical, promotions, finance, camps, apps] = await Promise.all([
        getAllCadets(), getAllParades(), getAllTrainingSessions(), getAllEvents(),
        getAllInventory(), getAllMedicalRecords(), getAllPromotions(), getAllFinanceRecords(),
        getAllCampEvents(), getAllApplications(),
      ]);

      const thisYear = new Date().getFullYear();

      // Attendance by month (last 6 months)
      const attendanceByMonth: Record<string, { present: number; total: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        attendanceByMonth[key] = { present: 0, total: 0 };
      }
      parades.forEach(p => {
        const month = p.date?.slice(0, 7);
        if (month && attendanceByMonth[month]) {
          attendanceByMonth[month].present += p.totalPresent || 0;
          attendanceByMonth[month].total += (p.totalPresent || 0) + (p.totalAbsent || 0);
        }
      });

      // Training by category
      const trainingByCategory: Record<string, number> = {};
      training.forEach(t => {
        trainingByCategory[t.category] = (trainingByCategory[t.category] || 0) + 1;
      });

      // Events by category
      const eventsByCategory: Record<string, number> = {};
      events.forEach(e => {
        eventsByCategory[e.category] = (eventsByCategory[e.category] || 0) + 1;
      });

      // Finance totals
      const totalIncome = finance.filter(f => f.type === 'income').reduce((s, r) => s + r.amount, 0);
      const totalExpense = finance.filter(f => f.type === 'expense').reduce((s, r) => s + r.amount, 0);

      // Wing distribution
      const armyCadets = cadets.filter(c => c.branch === 'Army').length;
      const navyCadets = cadets.filter(c => c.branch === 'Navy').length;
      const afCadets = cadets.filter(c => c.branch === 'Air Force').length;

      // Application pipeline
      const appsByStatus: Record<string, number> = {};
      apps.forEach(a => { appsByStatus[a.status] = (appsByStatus[a.status] || 0) + 1; });

      setData({
        cadets: { total: cadets.length, army: armyCadets, navy: navyCadets, airForce: afCadets },
        attendance: { months: attendanceByMonth, totalParades: parades.length },
        training: { byCategory: trainingByCategory, total: training.length },
        events: { byCategory: eventsByCategory, total: events.length },
        finance: { income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense },
        inventory: { total: inventory.length, lowStock: inventory.filter(i => i.availableQuantity <= 2).length },
        medical: { total: medical.length, flags: medical.filter(m => m.fitnessStatus !== 'Fit').length },
        promotions: { total: promotions.length, pending: promotions.filter(p => p.status === 'pending').length },
        camps: { total: camps.length, upcoming: camps.filter(c => c.status === 'upcoming').length },
        applications: { total: apps.length, byStatus: appsByStatus },
      });
      setLoading(false);
    }
    load();
  }, []);

  const months = data ? Object.keys(data.attendance.months) : [];
  const maxAttendance = data ? Math.max(...months.map(m => data.attendance.months[m].total || 1)) : 1;

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Analytics & Reports</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Unit-wide metrics, trends, and insights</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading analytics...</div>
        ) : (
          <>
            {/* Top KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
              {[
                { label: 'Total Cadets', value: data.cadets.total, sub: `A:${data.cadets.army} N:${data.cadets.navy} AF:${data.cadets.airForce}`, color: 'var(--navy-600)' },
                { label: 'Total Parades', value: data.attendance.totalParades, sub: 'Sessions recorded', color: '#0891b2' },
                { label: 'Training Sessions', value: data.training.total, sub: 'Logged this year', color: '#7c3aed' },
                { label: 'Events', value: data.events.total, sub: 'Activities logged', color: '#15803d' },
                { label: 'Net Balance', value: `₹${(data.finance.balance / 1000).toFixed(0)}K`, sub: `Income: ₹${(data.finance.income / 1000).toFixed(0)}K`, color: data.finance.balance >= 0 ? '#15803d' : '#dc2626' },
                { label: 'Inventory Items', value: data.inventory.total, sub: `${data.inventory.lowStock} low stock`, color: '#b45309' },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-body)', marginTop: 3 }}>{kpi.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{kpi.sub}</div>
                </div>
              ))}
            </div>

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

              {/* Attendance Bar Chart */}
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22, gridColumn: '1 / -1' }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 20 }}>📅 Monthly Parade Attendance (Last 6 months)</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 140 }}>
                  {months.map(month => {
                    const d = data.attendance.months[month];
                    const pct = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
                    const barH = d.total > 0 ? Math.round((d.total / maxAttendance) * 120) : 4;
                    const presentH = d.total > 0 ? Math.round((d.present / maxAttendance) * 120) : 0;
                    const label = month.slice(5, 7) + '/' + month.slice(2, 4);
                    return (
                      <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: pct >= 75 ? 'var(--success)' : 'var(--danger)' }}>{d.total > 0 ? `${pct}%` : '—'}</div>
                        <div style={{ width: '100%', background: 'var(--bg-secondary)', borderRadius: 6, height: `${barH}px`, position: 'relative', overflow: 'hidden', minHeight: 4 }}>
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(d.total > 0 ? (d.present / d.total) : 0) * 100}%`, background: pct >= 75 ? 'var(--success)' : 'var(--danger)', borderRadius: 6, transition: 'height 0.4s ease' }} />
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wing Distribution */}
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🪖 Wing Distribution</div>
                {[
                  { label: 'Army', value: data.cadets.army, color: '#15803d' },
                  { label: 'Navy', value: data.cadets.navy, color: '#0369a1' },
                  { label: 'Air Force', value: data.cadets.airForce, color: '#7c3aed' },
                ].map(w => {
                  const pct = data.cadets.total > 0 ? Math.round((w.value / data.cadets.total) * 100) : 0;
                  return (
                    <div key={w.label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>{w.label}</span>
                        <span style={{ fontWeight: 700, color: w.color }}>{w.value} cadets ({pct}%)</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: w.color, borderRadius: 99, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Training by Category */}
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📚 Training by Category</div>
                {Object.entries(data.training.byCategory).slice(0, 8).map(([cat, count]: any) => {
                  const pct = data.training.total > 0 ? Math.round((count / data.training.total) * 100) : 0;
                  return (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 10 }}>
                      <div style={{ flex: 1, fontSize: 12, color: 'var(--text-body)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</div>
                      <div style={{ width: 80, height: 6, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden', flexShrink: 0 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--navy-500)', borderRadius: 99 }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--navy-600)', width: 20, textAlign: 'right', flexShrink: 0 }}>{count}</div>
                    </div>
                  );
                })}
                {Object.keys(data.training.byCategory).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No training sessions yet.</div>}
              </div>

              {/* Application Pipeline */}
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📋 Enrollment Pipeline</div>
                {Object.entries(data.applications.byStatus).map(([status, count]: any) => {
                  const STATUS_COLORS: Record<string, string> = { new: '#0369a1', shortlisted: '#7c3aed', selected: '#15803d', enrolled: '#15803d', rejected: '#dc2626', waitlisted: '#6b7280', physical_test: '#0891b2', medical_test: '#be185d', interview: '#b45309' };
                  return (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', borderRadius: 6, marginBottom: 4, background: 'var(--bg-secondary)' }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-body)', textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: STATUS_COLORS[status] || 'var(--text-body)' }}>{count}</span>
                    </div>
                  );
                })}
                {Object.keys(data.applications.byStatus).length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No applications yet.</div>}
              </div>

              {/* Finance Summary */}
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>💰 Finance Summary</div>
                {[
                  { label: 'Total Income', value: data.finance.income, color: '#15803d', prefix: '+' },
                  { label: 'Total Expenditure', value: data.finance.expense, color: '#dc2626', prefix: '-' },
                  { label: 'Net Balance', value: data.finance.balance, color: data.finance.balance >= 0 ? '#15803d' : '#dc2626', prefix: '' },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>{f.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: f.color }}>
                      {f.prefix}₹{Math.abs(f.value).toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Camps & Medical */}
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>⛺ Camps & Health Overview</div>
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Total Camps', value: data.camps.total, color: '#0369a1' },
                    { label: 'Upcoming Camps', value: data.camps.upcoming, color: '#7c3aed' },
                    { label: 'Medical Records', value: data.medical.total, color: '#be185d' },
                    { label: 'Fitness Flags', value: data.medical.flags, color: '#dc2626' },
                    { label: 'Total Promotions', value: data.promotions.total, color: '#d97706' },
                    { label: 'Pending Promos', value: data.promotions.pending, color: '#b45309' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
