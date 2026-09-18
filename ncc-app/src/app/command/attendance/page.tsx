'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllParades, deleteParade } from '@/lib/db';
import type { ParadeSession } from '@/types';
import { Calendar, Plus, Trash2, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CommandAttendancePage() {
  const [parades, setParades] = useState<ParadeSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getAllParades().then(setParades).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this parade session?')) return;
    await deleteParade(id);
    toast.success('Parade deleted');
    load();
  };

  const TYPE_COLORS: Record<string, string> = {
    'Parade': '#0369a1',
    'PT': '#15803d',
    'NCC Lecture': '#7c3aed',
    'Drill': '#b45309',
    'Institutional Training': '#0891b2',
  };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'Rajdhani, sans-serif' }}>Attendance Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{parades.length} parade sessions recorded</p>
          </div>
          <Link href="/command/attendance/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--navy-600)', color: '#fff',
            padding: '10px 18px', borderRadius: 10, textDecoration: 'none',
            fontSize: 13, fontWeight: 600,
          }}>
            <Plus size={15} /> New Session
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : parades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <AlertCircle size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)' }}>No parade sessions yet. Create one to start marking attendance.</p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                  {['Date', 'Type', 'Wing', 'Venue', 'Present', 'Absent', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parades.map((p, idx) => {
                  const color = TYPE_COLORS[p.paradeType] || 'var(--navy-500)';
                  return (
                    <tr key={p.id} style={{ borderBottom: idx < parades.length - 1 ? '1px solid var(--border-light)' : 'none' }} className="table-row-hover">
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{p.date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${color}15`, color }}>{p.paradeType}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>{p.wing || 'All'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>{p.venue || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--success)' }}>{p.totalPresent ?? '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>{p.totalAbsent ?? '—'}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Link href={`/command/attendance/${p.id}`} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          fontSize: 12, color: 'var(--navy-600)', fontWeight: 600, textDecoration: 'none',
                          padding: '5px 10px', border: '1px solid var(--border-light)', borderRadius: 6,
                        }}>
                          <Eye size={13} /> View
                        </Link>
                        <button onClick={() => handleDelete(p.id!)} style={{
                          background: 'none', border: '1px solid var(--danger-border)', color: 'var(--danger)',
                          borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`.table-row-hover:hover { background: var(--bg-secondary); }`}</style>
    </AppShell>
  );
}
