'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllDocuments, addDocument, deleteDocument } from '@/lib/db';
import type { NccDocument, DocumentCategory } from '@/types';
import { FileText, Plus, Trash2, ExternalLink, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES: DocumentCategory[] = [
  'Correspondence', 'Event Report', 'Annual Report', 'Training Report',
  'Camp Report', 'Inspection Report', 'Administrative',
  'Enrolment', 'Promotion', 'Discharge', 'Certificate', 'Medical',
  'Uniform', 'Inventory', 'Finance', 'Other',
];

const CAT_COLORS: Record<string, string> = {
  'Correspondence': '#0369a1', 'Event Report': '#7c3aed', 'Annual Report': '#b45309',
  'Camp Report': '#15803d', 'Inspection Report': '#dc2626', 'Certificate': '#d97706',
  'Finance': '#0891b2', 'Medical': '#be185d', 'Administrative': '#6b7280',
};

export default function CommandDocumentsPage() {
  const { userProfile } = useAuth();
  const [docs, setDocs] = useState<NccDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<string>('All');
  const [form, setForm] = useState({
    title: '', category: 'Correspondence' as DocumentCategory,
    subCategory: '', description: '',
    driveUrl: '', referenceNumber: '', date: '',
    tags: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => getAllDocuments().then(setDocs).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = docs.filter(d => {
    const matchCat = catFilter === 'All' || d.category === catFilter;
    const matchSearch = !search.trim() || d.title.toLowerCase().includes(search.toLowerCase()) || d.referenceNumber?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      await addDocument({
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
        uploadedBy: userProfile?.uid || '',
        uploadedByName: userProfile?.displayName || '',
        createdAt: new Date() as any,
      });
      toast.success('Document saved');
      setShowForm(false);
      setForm({ title: '', category: 'Correspondence', subCategory: '', description: '', driveUrl: '', referenceNumber: '', date: '', tags: '' });
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Document Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{docs.length} documents in repository</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--navy-600)', color: '#fff', padding: '10px 18px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={15} /> Add Document
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." style={{ ...inputStyle, paddingLeft: 32 }} />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ ...inputStyle, width: 'auto', minWidth: 180 }}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Documents */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No documents found.</div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                  {['Title', 'Category', 'Ref No', 'Date', 'Uploaded By', 'Link', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((d, idx) => {
                  const color = CAT_COLORS[d.category] || '#6b7280';
                  return (
                    <tr key={d.id} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-light)' : 'none' }} className="table-row-hover">
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-heading)' }}>{d.title}</div>
                        {d.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{d.description.slice(0, 60)}{d.description.length > 60 ? '...' : ''}</div>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${color}15`, color }}>{d.category}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-body)', fontFamily: 'monospace' }}>{d.referenceNumber || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-body)' }}>{d.date || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-body)' }}>{d.uploadedByName || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {d.driveUrl ? (
                          <a href={d.driveUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--navy-600)', fontWeight: 600, textDecoration: 'none', padding: '5px 10px', border: '1px solid var(--border-light)', borderRadius: 6 }}>
                            <ExternalLink size={12} /> Open
                          </a>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>No link</span>}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={async () => { await deleteDocument(d.id!); toast.success('Deleted'); load(); }} style={{ background: 'none', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
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

        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>Add Document</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { label: 'Document Title', field: 'title', placeholder: 'e.g. Letter to Commanding Officer', required: true },
                    { label: 'Reference Number', field: 'referenceNumber', placeholder: 'e.g. NCC/TCET/2024/001' },
                    { label: 'Date', field: 'date', type: 'date' },
                    { label: 'Google Drive URL', field: 'driveUrl', placeholder: 'https://drive.google.com/...' },
                  ].map(f => (
                    <div key={f.field}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>{f.label} {f.required && <span style={{ color: 'var(--danger)' }}>*</span>}</label>
                      <input type={f.type || 'text'} value={(form as any)[f.field]} onChange={e => setForm(p => ({ ...p, [f.field]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                    </div>
                  ))}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as DocumentCategory }))} style={inputStyle}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Tags (comma-separated)</label>
                    <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. annual, republic-day, 2024" style={inputStyle} />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save Document'}
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
