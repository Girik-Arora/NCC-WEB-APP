'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllFinanceRecords, addFinanceRecord, deleteFinanceRecord } from '@/lib/db';
import type { FinanceRecord, FinanceCategory } from '@/types';
import { Wallet, Plus, Trash2, X, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES: FinanceCategory[] = [
  'Camp Expenditure', 'Refreshment', 'Travel', 'Procurement',
  'Washing Allowance', 'Reimbursement', 'Vendor Payment', 'Other',
];

export default function CommandFinancePage() {
  const { userProfile } = useAuth();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'Camp Expenditure' as FinanceCategory,
    description: '', amount: '', date: new Date().toISOString().split('T')[0],
    sanctionedBy: '', billUrl: '', status: 'pending' as FinanceRecord['status'], remarks: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => getAllFinanceRecords().then(setRecords).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const totalIncome = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
  const totalExpense = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) { toast.error('Description and amount required'); return; }
    setSaving(true);
    try {
      await addFinanceRecord({
        ...form,
        amount: parseFloat(form.amount),
        createdBy: userProfile?.uid || '',
        createdAt: new Date() as any,
      });
      toast.success('Record saved');
      setShowForm(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Finance & Claims</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Unit expenditure tracking and claim register</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'var(--navy-600)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            <Plus size={14} /> Add Entry
          </button>
        </div>

        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Income', value: totalIncome, color: '#15803d', icon: <TrendingUp size={20} /> },
            { label: 'Total Expenditure', value: totalExpense, color: '#dc2626', icon: <TrendingDown size={20} /> },
            { label: 'Net Balance', value: balance, color: balance >= 0 ? '#15803d' : '#dc2626', icon: <Wallet size={20} /> },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>₹{Math.abs(s.value).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Records Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No finance records yet.</div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                {['Date', 'Type', 'Category', 'Description', 'Amount', 'Status', 'Bill', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {records.map((r, idx) => (
                  <tr key={r.id} style={{ borderBottom: idx < records.length - 1 ? '1px solid var(--border-light)' : 'none' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{r.date}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: r.type === 'income' ? 'var(--success-bg)' : 'var(--danger-bg)', color: r.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                        {r.type === 'income' ? '↑ Income' : '↓ Expense'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-body)' }}>{r.category}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)', maxWidth: 200 }}>{r.description}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 700, color: r.type === 'income' ? 'var(--success)' : 'var(--danger)' }}>
                      {r.type === 'income' ? '+' : '-'}₹{r.amount.toLocaleString('en-IN')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                        background: r.status === 'paid' ? 'var(--success-bg)' : r.status === 'approved' ? 'var(--info-bg)' : 'var(--warning-bg)',
                        color: r.status === 'paid' ? 'var(--success)' : r.status === 'approved' ? 'var(--info)' : 'var(--warning)',
                      }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {r.billUrl ? <a href={r.billUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--navy-600)', fontWeight: 600 }}>View</a> : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={async () => { await deleteFinanceRecord(r.id!); toast.success('Deleted'); load(); }} style={{ background: 'none', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>Add Finance Entry</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Type</label>
                      <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))} style={inputStyle}>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date</label>
                      <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as FinanceCategory }))} style={inputStyle}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description *</label>
                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. CATC camp refreshments" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Amount (₹) *</label>
                      <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Status</label>
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as FinanceRecord['status'] }))} style={inputStyle}>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="paid">Paid</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Sanctioned By</label>
                    <input value={form.sanctionedBy} onChange={e => setForm(f => ({ ...f, sanctionedBy: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Bill / Document URL (Drive)</label>
                    <input value={form.billUrl} onChange={e => setForm(f => ({ ...f, billUrl: e.target.value }))} placeholder="https://drive.google.com/..." style={inputStyle} />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Entry'}
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
