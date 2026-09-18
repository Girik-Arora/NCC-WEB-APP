'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllApplications, updateApplicationStatus } from '@/lib/db';
import type { EnrollmentApplication, ApplicationStatus } from '@/types';
import { UserCheck, ChevronRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#0369a1', bg: '#f0f9ff' },
  shortlisted: { label: 'Shortlisted', color: '#7c3aed', bg: '#faf5ff' },
  physical_test: { label: 'Physical Test', color: '#0891b2', bg: '#ecfeff' },
  medical_test: { label: 'Medical Test', color: '#be185d', bg: '#fdf2f8' },
  interview: { label: 'Interview', color: '#b45309', bg: '#fffbeb' },
  selected: { label: 'Selected', color: '#15803d', bg: '#f0fdf4' },
  enrolled: { label: 'Enrolled ✓', color: '#15803d', bg: '#dcfce7' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
  waitlisted: { label: 'Waitlisted', color: '#6b7280', bg: '#f9fafb' },
};

const PIPELINE_STAGES: ApplicationStatus[] = ['new', 'shortlisted', 'physical_test', 'medical_test', 'interview', 'selected', 'enrolled'];

export default function CommandEnrollmentPage() {
  const { userProfile } = useAuth();
  const [apps, setApps] = useState<EnrollmentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<ApplicationStatus | 'all'>('all');
  const [selected, setSelected] = useState<EnrollmentApplication | null>(null);

  const load = () => getAllApplications().then(setApps).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = activeStage === 'all' ? apps : apps.filter(a => a.status === activeStage);

  const handleMove = async (id: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationStatus(id, newStatus, '', userProfile?.displayName);
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
      setSelected(null);
      load();
    } catch (e: any) {
      toast.error(`Error updating status: ${e.message}`);
    }
  };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Enrollment Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{apps.length} applications received</p>
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Public enrollment form: <strong>/enroll</strong>
          </div>
        </div>

        {/* Pipeline Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
          <button onClick={() => setActiveStage('all')} style={{
            padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            border: `1.5px solid ${activeStage === 'all' ? 'var(--navy-600)' : 'var(--border-light)'}`,
            background: activeStage === 'all' ? 'var(--navy-600)' : 'var(--surface-0)',
            color: activeStage === 'all' ? '#fff' : 'var(--text-body)', cursor: 'pointer',
          }}>All ({apps.length})</button>
          {PIPELINE_STAGES.map(s => {
            const count = apps.filter(a => a.status === s).length;
            const cfg = STATUS_CONFIG[s];
            return (
              <button key={s} onClick={() => setActiveStage(s)} style={{
                padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                border: `1.5px solid ${activeStage === s ? cfg.color : 'var(--border-light)'}`,
                background: activeStage === s ? cfg.bg : 'var(--surface-0)',
                color: activeStage === s ? cfg.color : 'var(--text-body)', cursor: 'pointer',
              }}>
                {cfg.label} ({count})
              </button>
            );
          })}
          <button onClick={() => setActiveStage('rejected')} style={{
            padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            border: `1.5px solid ${activeStage === 'rejected' ? 'var(--danger)' : 'var(--border-light)'}`,
            background: activeStage === 'rejected' ? 'var(--danger-bg)' : 'var(--surface-0)',
            color: activeStage === 'rejected' ? 'var(--danger)' : 'var(--text-body)', cursor: 'pointer',
          }}>Rejected ({apps.filter(a => a.status === 'rejected').length})</button>
        </div>

        {/* Applications List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Users size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)' }}>No applications in this stage.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                {['Applicant', 'Roll No / Dept', 'Wing Pref', 'Applied', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((app, idx) => {
                  const cfg = STATUS_CONFIG[app.status];
                  const createdDate = app.createdAt
                    ? (app.createdAt as any)?.toDate?.()?.toLocaleDateString?.() || '—'
                    : '—';
                  return (
                    <tr key={app.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-light)' : 'none' }} className="table-row-hover">
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{app.firstName} {app.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.gender} · {app.bloodGroup}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>
                        <div>{app.rollNumber}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{app.department} · Sem {app.semester}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--navy-600)' }}>{app.wingPreference}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{createdDate}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setSelected(app)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--navy-600)', fontWeight: 600, padding: '5px 10px', border: '1px solid var(--border-light)', borderRadius: 6, background: 'none', cursor: 'pointer' }}>
                          Manage <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Application Detail Modal */}
        {selected && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>{selected.firstName} {selected.lastName}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, fontSize: 13 }}>
                {[
                  ['Roll No', selected.rollNumber], ['Department', selected.department],
                  ['Semester', selected.semester?.toString()], ['Wing Preference', selected.wingPreference],
                  ['Gender', selected.gender], ['Blood Group', selected.bloodGroup],
                  ['Phone', selected.phone], ['Email', selected.email],
                  ['Parent Name', selected.parentName], ['Parent Phone', selected.parentPhone],
                  ['Medical Issues', selected.medicalIssues ? '⚠️ Yes' : '✅ No'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>{k}</div>
                    <div style={{ fontWeight: 500, color: 'var(--text-body)' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 10 }}>Move to Stage:</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {([...PIPELINE_STAGES, 'rejected' as ApplicationStatus, 'waitlisted' as ApplicationStatus]).filter(s => s !== selected.status).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <button key={s} onClick={() => handleMove(selected.id!, s)} style={{
                      padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      border: `1.5px solid ${cfg.color}`, background: cfg.bg, color: cfg.color, cursor: 'pointer',
                    }}>
                      → {cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`.table-row-hover:hover { background: var(--bg-secondary); }`}</style>
    </AppShell>
  );
}
