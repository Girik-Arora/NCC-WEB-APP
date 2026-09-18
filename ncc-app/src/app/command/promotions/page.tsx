'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllPromotions, addPromotion, approvePromotion, rejectPromotion, getAllCadets } from '@/lib/db';
import type { PromotionRecord, PromotionStatus, CadetProfile } from '@/types';
import { TrendingUp, Plus, CheckCircle, XCircle, X } from 'lucide-react';
import { RANKS_BY_WING } from '@/types';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<PromotionStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#b45309', bg: '#fffbeb' },
  approved: { label: 'Approved', color: '#15803d', bg: '#f0fdf4' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
};

export default function CommandPromotionsPage() {
  const { userProfile } = useAuth();
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cadetUid: '', fromRank: '', toRank: '', effectiveDate: '', orderNumber: '', remarks: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [proms, cads] = await Promise.all([getAllPromotions(), getAllCadets()]);
    setPromotions(proms);
    setCadets(cads);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cadetMap: Record<string, CadetProfile> = {};
  cadets.forEach(c => { cadetMap[c.uid] = c; });

  const selectedCadet = cadetMap[form.cadetUid];
  const availableRanks = selectedCadet
    ? [...RANKS_BY_WING[selectedCadet.branch].mod, ...RANKS_BY_WING[selectedCadet.branch].cadet]
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cadetUid || !form.toRank) { toast.error('Cadet and rank required'); return; }
    setSaving(true);
    const cadet = cadetMap[form.cadetUid];
    try {
      await addPromotion({
        ...form,
        fromRank: form.fromRank || cadet?.nccRank || 'CDT',
        cadetName: cadet ? `${cadet.firstName} ${cadet.lastName}` : '',
        status: 'pending',
        createdAt: new Date() as any,
        recommendedBy: userProfile?.displayName || '',
      });
      toast.success('Promotion recommendation created');
      setShowForm(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (p: PromotionRecord) => {
    await approvePromotion(p.id!, p.cadetUid, p.toRank, userProfile?.displayName || '');
    toast.success(`Promotion approved — ${p.cadetName} promoted to ${p.toRank}`);
    load();
  };

  const handleReject = async (id: string) => {
    await rejectPromotion(id);
    toast.success('Promotion rejected');
    load();
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  const pending = promotions.filter(p => p.status === 'pending');
  const historical = promotions.filter(p => p.status !== 'pending');

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Promotion Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{pending.length} pending · {promotions.length} total</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'var(--navy-600)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            <Plus size={14} /> Recommend Promotion
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <>
            {pending.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Pending Approvals ({pending.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pending.map(p => (
                    <div key={p.id} style={{ background: 'var(--surface-0)', border: '1.5px solid var(--warning-border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-heading)' }}>{p.cadetName}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3 }}>
                          <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>{p.fromRank}</span>
                          {' → '}
                          <span style={{ fontWeight: 700, color: 'var(--navy-600)' }}>{p.toRank}</span>
                        </div>
                        {p.remarks && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>Remarks: {p.remarks}</div>}
                        {p.orderNumber && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Order: {p.orderNumber}</div>}
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>Recommended by: {p.recommendedBy}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => handleApprove(p)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          <CheckCircle size={15} /> Approve
                        </button>
                        <button onClick={() => handleReject(p.id!)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', borderRadius: 8, background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', color: 'var(--danger)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                          <XCircle size={15} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {historical.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Promotion History ({historical.length})</div>
                <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                      {['Cadet', 'From', 'To', 'Effective Date', 'Status', 'Approved By'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {historical.map((p, idx) => {
                        const cfg = STATUS_CONFIG[p.status];
                        return (
                          <tr key={p.id} style={{ borderBottom: idx < historical.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{p.cadetName}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{p.fromRank}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: 'var(--navy-600)' }}>{p.toRank}</td>
                            <td style={{ padding: '12px 16px', fontSize: 13 }}>{p.effectiveDate || '—'}</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                            <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{p.approvedBy || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {promotions.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No promotions yet.</div>}
          </>
        )}

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>Recommend Promotion</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Cadet</label>
                    <select value={form.cadetUid} onChange={e => setForm(f => ({ ...f, cadetUid: e.target.value, fromRank: cadetMap[e.target.value]?.nccRank || '' }))} style={inputStyle}>
                      <option value="">-- Select Cadet --</option>
                      {cadets.map(c => <option key={c.uid} value={c.uid}>{c.firstName} {c.lastName} — {c.nccRank || 'CDT'} ({c.branch})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>From Rank</label>
                      <input value={form.fromRank || (selectedCadet?.nccRank || 'CDT')} readOnly style={{ ...inputStyle, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Promote To</label>
                      <select value={form.toRank} onChange={e => setForm(f => ({ ...f, toRank: e.target.value }))} style={inputStyle}>
                        <option value="">-- Select Rank --</option>
                        {availableRanks.map(r => <option key={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>
                  {[
                    { label: 'Order / Sanction No.', field: 'orderNumber', placeholder: 'e.g. NCC/Promo/2024/001' },
                    { label: 'Effective Date', field: 'effectiveDate', type: 'date' },
                    { label: 'Remarks', field: 'remarks', placeholder: 'Optional remarks' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{f.label}</label>
                      <input type={f.type || 'text'} value={(form as any)[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Submitting...' : 'Submit Recommendation'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
