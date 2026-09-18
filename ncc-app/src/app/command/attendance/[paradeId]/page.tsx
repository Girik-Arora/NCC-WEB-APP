'use client';

import { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getParade, getAllCadets, getAttendanceForParade, markAttendanceBulk, updateParade } from '@/lib/db';
import type { ParadeSession, CadetProfile, AttendanceRecord, AttendanceStatus } from '@/types';
import { ChevronLeft, CheckCircle, XCircle, Clock, Stethoscope, FileText, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  present: { label: 'P', icon: <CheckCircle size={14} />, color: '#15803d', bg: '#f0fdf4' },
  absent: { label: 'A', icon: <XCircle size={14} />, color: '#dc2626', bg: '#fef2f2' },
  on_duty: { label: 'OD', icon: <Clock size={14} />, color: '#0369a1', bg: '#f0f9ff' },
  medical: { label: 'Med', icon: <Stethoscope size={14} />, color: '#be185d', bg: '#fdf2f8' },
  leave: { label: 'L', icon: <FileText size={14} />, color: '#b45309', bg: '#fffbeb' },
};

export default function MarkAttendancePage() {
  const params = useParams();
  const paradeId = params?.paradeId as string;
  const { userProfile } = useAuth();
  const [parade, setParade] = useState<ParadeSession | null>(null);
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [existing, setExisting] = useState<AttendanceRecord[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [p, allCadets, att] = await Promise.all([
      getParade(paradeId),
      getAllCadets(),
      getAttendanceForParade(paradeId),
    ]);
    setParade(p);

    const filtered = p?.wing === 'All'
      ? allCadets
      : allCadets.filter(c => c.branch === p?.wing);
    setCadets(filtered);
    setExisting(att);

    const statusMap: Record<string, AttendanceStatus> = {};
    const remarkMap: Record<string, string> = {};
    att.forEach(r => {
      statusMap[r.cadetUid] = r.status;
      remarkMap[r.cadetUid] = r.remarks || '';
    });
    // Default unrecorded cadets to absent
    filtered.forEach(c => {
      if (!statusMap[c.uid]) statusMap[c.uid] = 'absent';
    });
    setStatuses(statusMap);
    setRemarks(remarkMap);
    setLoading(false);
  }, [paradeId]);

  useEffect(() => { load(); }, [load]);

  const setAll = (status: AttendanceStatus) => {
    setStatuses(prev => {
      const next = { ...prev };
      cadets.forEach(c => { next[c.uid] = status; });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = cadets.map(c => ({
        cadetUid: c.uid,
        status: statuses[c.uid] || 'absent',
        remarks: remarks[c.uid] || '',
      }));
      await markAttendanceBulk(paradeId, records, userProfile?.displayName || 'ANO');

      const presentCount = records.filter(r => r.status === 'present').length;
      const absentCount = records.filter(r => r.status === 'absent').length;
      const odCount = records.filter(r => r.status === 'on_duty').length;
      const medCount = records.filter(r => r.status === 'medical').length;
      const leaveCount = records.filter(r => r.status === 'leave').length;

      await updateParade(paradeId, {
        totalPresent: presentCount,
        totalAbsent: absentCount,
        totalOnDuty: odCount,
        totalMedical: medCount,
        totalLeave: leaveCount,
      });

      toast.success(`Attendance saved — ${presentCount} present, ${absentCount} absent`);
    } catch (e) {
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = cadets.filter(c => statuses[c.uid] === 'present').length;
  const absentCount = cadets.filter(c => statuses[c.uid] === 'absent').length;

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/command/attendance" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--navy-600)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Attendance
        </Link>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--navy-700), var(--navy-500))',
              borderRadius: 14, padding: '20px 24px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <h1 style={{ color: '#fff', fontSize: 20, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', margin: 0 }}>
                  {parade?.paradeType} — {parade?.date}
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '4px 0 0' }}>
                  {parade?.wing} Wing · {parade?.venue || 'No venue specified'} · {cadets.length} cadets
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>{presentCount}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Present</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#f87171' }}>{absentCount}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Absent</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
                    {cadets.length > 0 ? Math.round((presentCount / cadets.length) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Attendance</div>
                </div>
              </div>
            </div>

            {/* Bulk Buttons */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', alignSelf: 'center' }}>Mark all:</span>
              {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <button key={s} onClick={() => setAll(s)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                    border: `1.5px solid ${cfg.color}`, background: cfg.bg, color: cfg.color,
                    cursor: 'pointer',
                  }}>
                    {cfg.icon} {s.replace('_', ' ').toUpperCase()}
                  </button>
                );
              })}
            </div>

            {/* Cadet List */}
            <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden', marginBottom: 20 }}>
              {cadets.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No cadets found for this wing.
                </div>
              ) : (
                cadets.map((cadet, idx) => {
                  const status = statuses[cadet.uid] || 'absent';
                  const cfg = STATUS_CONFIG[status];
                  return (
                    <div key={cadet.uid} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                      borderBottom: idx < cadets.length - 1 ? '1px solid var(--border-light)' : 'none',
                      background: status === 'present' ? 'rgba(21,128,61,0.03)' : 'transparent',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {cadet.firstName} {cadet.lastName}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {cadet.nccRank || 'CDT'} · {cadet.rollNumber || '—'}
                        </div>
                      </div>

                      {/* Status Buttons */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => {
                          const scfg = STATUS_CONFIG[s];
                          const isActive = status === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setStatuses(prev => ({ ...prev, [cadet.uid]: s }))}
                              title={s.replace('_', ' ')}
                              style={{
                                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                border: `1.5px solid ${isActive ? scfg.color : 'var(--border-light)'}`,
                                background: isActive ? scfg.bg : 'transparent',
                                color: isActive ? scfg.color : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.12s',
                              }}
                            >
                              {scfg.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Remarks */}
                      <input
                        value={remarks[cadet.uid] || ''}
                        onChange={e => setRemarks(prev => ({ ...prev, [cadet.uid]: e.target.value }))}
                        placeholder="Remarks..."
                        style={{
                          width: 140, height: 32, padding: '0 10px', borderRadius: 6,
                          border: '1.5px solid var(--border-light)', fontSize: 12,
                          background: 'var(--surface-0)', color: 'var(--text-body)',
                          outline: 'none',
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Save */}
            <button onClick={handleSave} disabled={saving} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: saving ? 'var(--border-mid)' : 'var(--navy-600)',
              color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px',
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              <Save size={16} />
              {saving ? 'Saving...' : `Save Attendance (${presentCount}P / ${absentCount}A)`}
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
