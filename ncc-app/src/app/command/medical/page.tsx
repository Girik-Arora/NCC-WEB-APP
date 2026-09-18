'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllMedicalRecords, addMedicalRecord, deleteMedicalRecord, getAllCadets } from '@/lib/db';
import type { MedicalRecord, FitnessStatus, CadetProfile } from '@/types';
import { HeartPulse, Plus, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const FITNESS_CONFIG: Record<FitnessStatus, { color: string; bg: string }> = {
  'Fit': { color: '#15803d', bg: '#f0fdf4' },
  'Temporarily Unfit': { color: '#b45309', bg: '#fffbeb' },
  'Permanently Unfit': { color: '#dc2626', bg: '#fef2f2' },
  'Under Review': { color: '#0369a1', bg: '#f0f9ff' },
};

export default function CommandMedicalPage() {
  const { userProfile } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    cadetUid: '', type: 'Annual Medical' as MedicalRecord['type'],
    date: new Date().toISOString().split('T')[0],
    fitnessStatus: 'Fit' as FitnessStatus,
    campClearance: false, details: '', allergies: '',
    bloodGroup: '', height: '', weight: '', documentUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [recs, cads] = await Promise.all([getAllMedicalRecords(), getAllCadets()]);
    setRecords(recs);
    setCadets(cads);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cadetMap: Record<string, CadetProfile> = {};
  cadets.forEach(c => { cadetMap[c.uid] = c; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cadetUid) { toast.error('Select cadet'); return; }
    setSaving(true);
    try {
      await addMedicalRecord({
        ...form,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        recordedBy: userProfile?.displayName || '',
        createdAt: new Date() as any,
      });
      toast.success('Medical record saved');
      setShowForm(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const unfitCount = records.filter(r => r.fitnessStatus && r.fitnessStatus !== 'Fit').length;

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Medical & Safety</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{records.length} records · {unfitCount} fitness flags</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'var(--navy-600)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            <Plus size={14} /> Add Record
          </button>
        </div>

        {unfitCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--warning-bg)', border: '1px solid var(--warning-border)', borderRadius: 10, marginBottom: 20 }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <span style={{ fontSize: 13, color: 'var(--warning)', fontWeight: 600 }}>
              {unfitCount} cadet(s) have unfit/restricted fitness status. Review before camp nominations.
            </span>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No medical records yet.</div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                  {['Cadet', 'Type', 'Date', 'Fitness Status', 'Camp Clearance', 'Recorded By', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((r, idx) => {
                  const cadet = cadetMap[r.cadetUid];
                  const fcfg = r.fitnessStatus ? FITNESS_CONFIG[r.fitnessStatus] : null;
                  return (
                    <tr key={r.id} style={{ borderBottom: idx < records.length - 1 ? '1px solid var(--border-light)' : 'none' }} className="table-row-hover">
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{cadet ? `${cadet.firstName} ${cadet.lastName}` : r.cadetUid}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cadet?.nccRank || ''} · {cadet?.branch || ''}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>{r.type}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {fcfg ? (
                          <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: fcfg.bg, color: fcfg.color }}>{r.fitnessStatus}</span>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13 }}>
                        {r.campClearance === true ? '✅ Cleared' : r.campClearance === false ? '❌ Not Cleared' : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{r.recordedBy}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={async () => { await deleteMedicalRecord(r.id!); toast.success('Deleted'); load(); }} style={{ background: 'none', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>Add Medical Record</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Cadet</label>
                    <select value={form.cadetUid} onChange={e => setForm(f => ({ ...f, cadetUid: e.target.value }))} style={inputStyle}>
                      <option value="">-- Select Cadet --</option>
                      {cadets.map(c => <option key={c.uid} value={c.uid}>{c.firstName} {c.lastName} ({c.nccRank || 'CDT'})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Record Type</label>
                      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as MedicalRecord['type'] }))} style={inputStyle}>
                        {['Annual Medical', 'Camp Clearance', 'Incident Report', 'Allergy', 'General'].map(t => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
                      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Fitness Status</label>
                      <select value={form.fitnessStatus} onChange={e => setForm(f => ({ ...f, fitnessStatus: e.target.value as FitnessStatus }))} style={inputStyle}>
                        {(['Fit', 'Temporarily Unfit', 'Permanently Unfit', 'Under Review'] as FitnessStatus[]).map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Height (cm)</label>
                      <input type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Weight (kg)</label>
                      <input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Blood Group</label>
                      <input value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.campClearance} onChange={e => setForm(f => ({ ...f, campClearance: e.target.checked }))} />
                    Camp Clearance Granted
                  </label>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Details / Notes</label>
                    <textarea value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Document URL (Drive)</label>
                    <input value={form.documentUrl} onChange={e => setForm(f => ({ ...f, documentUrl: e.target.value }))} placeholder="https://drive.google.com/..." style={inputStyle} />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
      <style>{`.table-row-hover:hover { background: var(--bg-secondary); }`}</style>
    </AppShell>
  );
}
