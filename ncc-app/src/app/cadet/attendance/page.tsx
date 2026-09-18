'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetAttendance, getAllParades, getCadetProfile } from '@/lib/db';
import { calculateAttendancePct } from '@/lib/eligibility';
import type { AttendanceRecord, ParadeSession } from '@/types';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

export default function CadetAttendancePage() {
  const { userProfile } = useAuth();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [parades, setParades] = useState<ParadeSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;
    Promise.all([
      getCadetAttendance(userProfile.uid),
      getAllParades(),
    ]).then(([att, pars]) => {
      setAttendance(att);
      setParades(pars);
    }).finally(() => setLoading(false));
  }, [userProfile]);

  const pct = calculateAttendancePct(attendance);
  const present = attendance.filter(a => a.status === 'present' || a.status === 'on_duty').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const total = attendance.length;

  const isWarning = pct < 75;

  const paradeMap: Record<string, ParadeSession> = {};
  parades.forEach(p => { paradeMap[p.id!] = p; });

  const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
    present: { label: 'Present', color: '#15803d', bg: '#f0fdf4' },
    absent: { label: 'Absent', color: '#dc2626', bg: '#fef2f2' },
    on_duty: { label: 'On Duty', color: '#0369a1', bg: '#f0f9ff' },
    medical: { label: 'Medical', color: '#be185d', bg: '#fdf2f8' },
    leave: { label: 'Leave', color: '#b45309', bg: '#fffbeb' },
  };

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)', marginBottom: 6 }}>My Attendance</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Track your NCC attendance and certificate eligibility</p>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Sessions', value: total, color: 'var(--navy-600)' },
            { label: 'Present', value: present, color: '#15803d' },
            { label: 'Absent', value: absent, color: '#dc2626' },
            { label: 'Attendance %', value: `${pct}%`, color: pct >= 75 ? '#15803d' : '#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Eligibility Alert */}
        {!loading && (
          <div style={{
            padding: '14px 18px', borderRadius: 10, marginBottom: 20,
            background: isWarning ? 'var(--danger-bg)' : 'var(--success-bg)',
            border: `1px solid ${isWarning ? 'var(--danger-border)' : 'var(--success-border)'}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            {isWarning ? <AlertTriangle size={18} color="var(--danger)" /> : <CheckCircle size={18} color="var(--success)" />}
            <div>
              <div style={{ fontWeight: 700, color: isWarning ? 'var(--danger)' : 'var(--success)', fontSize: 14 }}>
                {isWarning ? '⚠️ Attendance Below 75% — Certificate at Risk!' : '✅ Attendance Satisfactory (≥ 75%)'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                {isWarning
                  ? `You need at least 75% attendance for certificate eligibility. Currently: ${pct}%`
                  : `Your attendance is ${pct}% — good standing for certificate eligibility.`
                }
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: 'var(--text-body)' }}>Attendance Progress</span>
            <span style={{ fontWeight: 700, color: pct >= 75 ? 'var(--success)' : 'var(--danger)' }}>{pct}% / 75% required</span>
          </div>
          <div style={{ height: 10, background: 'var(--bg-secondary)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 99,
              width: `${Math.min(pct, 100)}%`,
              background: pct >= 75 ? 'var(--success)' : pct >= 60 ? 'var(--warning)' : 'var(--danger)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
            <span>0%</span>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>75% min</span>
            <span>100%</span>
          </div>
        </div>

        {/* Record List */}
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border-light)', fontWeight: 700, fontSize: 14, color: 'var(--text-heading)' }}>
            Attendance History ({attendance.length} sessions)
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          ) : attendance.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No attendance records yet.</div>
          ) : (
            <div>
              {attendance.slice().reverse().map((rec, idx) => {
                const parade = paradeMap[rec.paradeId];
                const cfg = STATUS_BADGE[rec.status] || STATUS_BADGE.absent;
                return (
                  <div key={rec.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 18px',
                    borderBottom: idx < attendance.length - 1 ? '1px solid var(--border-light)' : 'none',
                  }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-heading)' }}>
                        {parade?.paradeType || 'Session'} — {parade?.date || 'Date unknown'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {parade?.venue || ''} {rec.remarks ? `· ${rec.remarks}` : ''}
                      </div>
                    </div>
                    <span style={{ padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
