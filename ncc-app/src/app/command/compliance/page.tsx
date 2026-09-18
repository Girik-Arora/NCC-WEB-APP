'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import {
  getAllCadets, getAllParades, getAllTrainingSessions, getAllEvents,
  getAllDocuments, getAllInventory, getAllMedicalRecords, getAllApplications
} from '@/lib/db';
import { Clipboard, CheckCircle, XCircle, AlertTriangle, Printer } from 'lucide-react';

interface CheckItem {
  label: string;
  status: 'ok' | 'warn' | 'fail';
  detail: string;
}

interface CheckCategory {
  name: string;
  icon: string;
  items: CheckItem[];
}

export default function CommandCompliancePage() {
  const [categories, setCategories] = useState<CheckCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function compute() {
      const [cadets, parades, training, events, docs, inventory, medical, apps] = await Promise.all([
        getAllCadets(), getAllParades(), getAllTrainingSessions(), getAllEvents(),
        getAllDocuments(), getAllInventory(), getAllMedicalRecords(), getAllApplications(),
      ]);

      const now = new Date().toISOString().split('T')[0];
      const thisYear = new Date().getFullYear();

      const profileComplete = cadets.filter(c => c.profileComplete).length;
      const incompleteProfiles = cadets.length - profileComplete;
      const medicalIssues = cadets.filter(c => c.medicalIssues).length;

      const thisYearParades = parades.filter(p => p.date?.startsWith(thisYear.toString())).length;
      const avgAttendance = parades.filter(p => p.totalPresent !== undefined).length > 0
        ? Math.round(parades.filter(p => p.totalPresent !== undefined).reduce((sum, p) => sum + (p.totalPresent || 0) / Math.max((p.totalPresent || 0) + (p.totalAbsent || 0), 1), 0) / parades.filter(p => p.totalPresent !== undefined).length * 100)
        : 0;

      const trainingThisYear = training.filter(t => t.year === thisYear).length;
      const recentEvents = events.filter(e => e.date >= `${thisYear}-01-01`).length;
      const lowStockItems = inventory.filter(i => i.availableQuantity <= 2).length;
      const unfitCadets = medical.filter(m => m.fitnessStatus !== 'Fit').length;

      const checks: CheckCategory[] = [
        {
          name: 'Cadet Records',
          icon: '👤',
          items: [
            { label: 'All cadet profiles complete', status: incompleteProfiles === 0 ? 'ok' : incompleteProfiles <= 3 ? 'warn' : 'fail', detail: `${profileComplete}/${cadets.length} profiles complete` },
            { label: 'Cadet strength sufficient', status: cadets.length >= 30 ? 'ok' : cadets.length >= 15 ? 'warn' : 'fail', detail: `${cadets.length} total cadets enrolled` },
            { label: 'Medical flags reviewed', status: unfitCadets === 0 ? 'ok' : unfitCadets <= 3 ? 'warn' : 'fail', detail: `${unfitCadets} cadets with fitness restrictions` },
          ],
        },
        {
          name: 'Attendance',
          icon: '📅',
          items: [
            { label: 'Parades conducted this year', status: thisYearParades >= 20 ? 'ok' : thisYearParades >= 10 ? 'warn' : 'fail', detail: `${thisYearParades} parades recorded` },
            { label: 'Average attendance rate', status: avgAttendance >= 75 ? 'ok' : avgAttendance >= 60 ? 'warn' : 'fail', detail: `Average: ${avgAttendance}%` },
          ],
        },
        {
          name: 'Training',
          icon: '🏋️',
          items: [
            { label: 'Training sessions this year', status: trainingThisYear >= 15 ? 'ok' : trainingThisYear >= 8 ? 'warn' : 'fail', detail: `${trainingThisYear} sessions logged` },
          ],
        },
        {
          name: 'Events & Activities',
          icon: '🎯',
          items: [
            { label: 'Events / activities this year', status: recentEvents >= 5 ? 'ok' : recentEvents >= 2 ? 'warn' : 'fail', detail: `${recentEvents} events recorded` },
          ],
        },
        {
          name: 'Documents',
          icon: '📄',
          items: [
            { label: 'Document repository maintained', status: docs.length >= 10 ? 'ok' : docs.length >= 3 ? 'warn' : 'fail', detail: `${docs.length} documents on file` },
          ],
        },
        {
          name: 'Inventory',
          icon: '📦',
          items: [
            { label: 'Inventory catalog maintained', status: inventory.length >= 5 ? 'ok' : inventory.length >= 1 ? 'warn' : 'fail', detail: `${inventory.length} items cataloged` },
            { label: 'No critical stock shortages', status: lowStockItems === 0 ? 'ok' : lowStockItems <= 3 ? 'warn' : 'fail', detail: `${lowStockItems} items at low stock` },
          ],
        },
        {
          name: 'Enrollment',
          icon: '📋',
          items: [
            { label: 'No pending applications delayed', status: apps.filter(a => a.status === 'new').length === 0 ? 'ok' : 'warn', detail: `${apps.filter(a => a.status === 'new').length} new applications pending` },
          ],
        },
      ];

      const allItems = checks.flatMap(c => c.items);
      const okCount = allItems.filter(i => i.status === 'ok').length;
      setScore(Math.round((okCount / allItems.length) * 100));
      setCategories(checks);
      setLoading(false);
    }
    compute();
  }, []);

  const scoreColor = score >= 80 ? '#15803d' : score >= 60 ? '#b45309' : '#dc2626';

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Compliance & Inspection Readiness</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Real-time status of your unit's inspection readiness</p>
          </div>
          <button onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1.5px solid var(--border-mid)', background: 'var(--surface-0)', color: 'var(--text-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Printer size={14} /> Print Report
          </button>
        </div>

        {/* Score Card */}
        {!loading && (
          <div style={{
            background: 'linear-gradient(135deg, var(--navy-800), var(--navy-600))',
            borderRadius: 16, padding: '24px 28px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              border: `4px solid ${scoreColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: scoreColor }}>{score}%</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Rajdhani, sans-serif' }}>
                Inspection Readiness Score
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
                {score >= 80 ? '✅ Unit is inspection-ready' : score >= 60 ? '⚠️ Some areas need attention' : '❌ Significant gaps — urgent action required'}
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Computing readiness...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {categories.map(cat => {
              const okCount = cat.items.filter(i => i.status === 'ok').length;
              const catScore = Math.round((okCount / cat.items.length) * 100);
              return (
                <div key={cat.name} style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>{cat.icon} {cat.name}</div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                      background: catScore === 100 ? 'var(--success-bg)' : catScore >= 60 ? 'var(--warning-bg)' : 'var(--danger-bg)',
                      color: catScore === 100 ? 'var(--success)' : catScore >= 60 ? 'var(--warning)' : 'var(--danger)',
                    }}>{catScore}%</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cat.items.map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        {item.status === 'ok' ? <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} /> :
                          item.status === 'warn' ? <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} /> :
                            <XCircle size={16} color="var(--danger)" style={{ flexShrink: 0, marginTop: 1 }} />}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-body)' }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{item.detail}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@media print { .sidebar-nav-link, .desktop-sidebar, .mobile-sidebar, .mobile-header { display: none !important; } .main-content { margin-left: 0 !important; } }`}</style>
    </AppShell>
  );
}
