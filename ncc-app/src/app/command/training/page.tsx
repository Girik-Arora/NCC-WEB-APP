'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTrainingSessions, addTrainingSession, deleteTrainingSession } from '@/lib/db';
import type { TrainingSession, TrainingCategory, Wing } from '@/types';
import { BookOpen, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TRAINING_CATEGORIES: TrainingCategory[] = [
  'Drill', 'Weapon Training', 'Map Reading', 'Leadership',
  'Personality Development', 'PT & Sports', 'First Aid',
  'Navigation', 'Firing', 'Cultural', 'Defence Awareness', 'Other',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Drill': '#0369a1', 'Weapon Training': '#dc2626', 'PT & Sports': '#15803d',
  'Leadership': '#7c3aed', 'First Aid': '#be185d', 'Firing': '#b45309',
  'Map Reading': '#d97706', 'Navigation': '#0891b2', 'Other': '#6b7280',
};

export default function CommandTrainingPage() {
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Drill' as TrainingCategory,
    subject: '',
    description: '',
    trainer: '',
    wing: 'All' as Wing | 'All',
    periods: 1,
    year: new Date().getFullYear(),
    documentUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => getAllTrainingSessions().then(setSessions).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim()) { toast.error('Subject is required'); return; }
    setSaving(true);
    try {
      await addTrainingSession({ ...form, createdBy: userProfile?.uid || '', createdAt: new Date() as any });
      toast.success('Training session logged');
      setShowForm(false);
      setForm(f => ({ ...f, subject: '', description: '', documentUrl: '' }));
      load();
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this training session?')) return;
    await deleteTrainingSession(id);
    toast.success('Deleted');
    load();
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Training Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{sessions.length} sessions recorded</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--navy-600)', color: '#fff', padding: '10px 18px',
            borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={15} /> Log Training Session
          </button>
        </div>

        {/* Summary by category */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {TRAINING_CATEGORIES.map(cat => {
            const count = sessions.filter(s => s.category === cat).length;
            if (count === 0) return null;
            return (
              <div key={cat} style={{
                padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                background: `${CATEGORY_COLORS[cat] || '#6b7280'}18`,
                color: CATEGORY_COLORS[cat] || '#6b7280',
                border: `1px solid ${CATEGORY_COLORS[cat] || '#6b7280'}40`,
              }}>
                {cat} ({count})
              </div>
            );
          })}
        </div>

        {/* Sessions List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No training sessions yet. Start logging!</div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                  {['Date', 'Category', 'Subject', 'Wing', 'Trainer', 'Periods', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, idx) => (
                  <tr key={s.id} style={{ borderBottom: idx < sessions.length - 1 ? '1px solid var(--border-light)' : 'none' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{s.date}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${CATEGORY_COLORS[s.category] || '#6b7280'}18`, color: CATEGORY_COLORS[s.category] || '#6b7280' }}>
                        {s.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>{s.subject}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>{s.wing}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>{s.trainer || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)', textAlign: 'center' }}>{s.periods}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleDelete(s.id!)} style={{ background: 'none', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>Log Training Session</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[
                    { label: 'Date', field: 'date', type: 'date' },
                    { label: 'Year', field: 'year', type: 'number' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                      <input type={f.type} value={(form as any)[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} style={inputStyle} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TrainingCategory }))} style={inputStyle}>
                      {TRAINING_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Wing</label>
                    <select value={form.wing} onChange={e => setForm(f => ({ ...f, wing: e.target.value as any }))} style={inputStyle}>
                      <option value="All">All Wings</option>
                      <option value="Army">Army</option>
                      <option value="Navy">Navy</option>
                      <option value="Air Force">Air Force</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Subject / Topic <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Close Order Drill" style={inputStyle} />
                </div>
                {[
                  { label: 'Trainer Name', field: 'trainer', placeholder: 'Name of instructor' },
                  { label: 'Periods (Hours)', field: 'periods', placeholder: '1', type: 'number' },
                  { label: 'Document / Drive URL', field: 'documentUrl', placeholder: 'https://drive.google.com/...' },
                ].map(f => (
                  <div key={f.field} style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>{f.label}</label>
                    <input type={f.type || 'text'} value={(form as any)[f.field]} onChange={e => setForm(prev => ({ ...prev, [f.field]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                  </div>
                ))}
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Log Session'}
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
