'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllAnnouncements, addAnnouncement, deleteAnnouncement, updateAnnouncement } from '@/lib/db';
import type { Announcement, AnnouncementPriority, AnnouncementTarget } from '@/types';
import { Megaphone, Plus, Trash2, Pin, X, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

const PRIORITY_CONFIG: Record<AnnouncementPriority, { label: string; color: string; bg: string }> = {
  urgent: { label: '🚨 Urgent', color: '#dc2626', bg: '#fef2f2' },
  important: { label: '⚠️ Important', color: '#b45309', bg: '#fffbeb' },
  training: { label: '🏋️ Training', color: '#0369a1', bg: '#f0f9ff' },
  event: { label: '📅 Event', color: '#7c3aed', bg: '#faf5ff' },
  general: { label: '📢 General', color: '#4b5563', bg: '#f9fafb' },
};

const TARGET_LABELS: Record<AnnouncementTarget, string> = {
  all: 'All Members',
  army: 'Army Wing',
  navy: 'Navy Wing',
  air_force: 'Air Force Wing',
  sd: 'SD Division',
  sw: 'SW Division',
  cadets_only: 'Cadets Only',
  senior_cadets: 'Senior Cadets',
  officers: 'Officers',
  specific: 'Specific Cadets',
};

export default function CommandCommunicationPage() {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', body: '',
    priority: 'general' as AnnouncementPriority,
    target: 'all' as AnnouncementTarget,
    pinned: false,
    attachmentUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => getAllAnnouncements().then(setAnnouncements).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body required'); return; }
    setSaving(true);
    try {
      await addAnnouncement({
        ...form,
        createdBy: userProfile?.uid || '',
        createdByName: userProfile?.displayName || 'ANO',
        createdAt: new Date() as any,
      });
      toast.success('Announcement published!');
      setShowForm(false);
      setForm({ title: '', body: '', priority: 'general', target: 'all', pinned: false, attachmentUrl: '' });
      load();
    } catch { toast.error('Failed to publish'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await deleteAnnouncement(id);
    toast.success('Deleted');
    load();
  };

  const handlePin = async (ann: Announcement) => {
    await updateAnnouncement(ann.id!, { pinned: !ann.pinned });
    toast.success(ann.pinned ? 'Unpinned' : 'Pinned');
    load();
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Communication Centre</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Broadcast notices, orders, and announcements</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--navy-600)', color: '#fff', padding: '10px 18px',
            borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            <Plus size={15} /> New Announcement
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Bell size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)' }}>No announcements yet. Create the first one!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {announcements.map(ann => {
              const pcfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.general;
              return (
                <div key={ann.id} style={{
                  background: 'var(--surface-0)', border: `1.5px solid ${ann.pinned ? 'var(--gold-300)' : 'var(--border-light)'}`,
                  borderRadius: 12, padding: '18px 20px',
                  borderLeft: `4px solid ${pcfg.color}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        {ann.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold-700)', background: 'var(--gold-100)', padding: '2px 8px', borderRadius: 99 }}>📌 PINNED</span>}
                        <span style={{ fontSize: 11, fontWeight: 700, color: pcfg.color, background: pcfg.bg, padding: '2px 8px', borderRadius: 99 }}>{pcfg.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 99 }}>→ {TARGET_LABELS[ann.target] || ann.target}</span>
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{ann.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{ann.body}</div>
                      {ann.attachmentUrl && (
                        <a href={ann.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--navy-600)', marginTop: 8, display: 'inline-block' }}>
                          📎 View Attachment
                        </a>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                        By {ann.createdByName}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handlePin(ann)} title={ann.pinned ? 'Unpin' : 'Pin'} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-light)', background: ann.pinned ? 'var(--gold-100)' : 'none', cursor: 'pointer', color: ann.pinned ? 'var(--gold-700)' : 'var(--text-muted)' }}>
                        <Pin size={14} />
                      </button>
                      <button onClick={() => handleDelete(ann.id!)} style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid var(--danger-border)', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Announcement Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 540, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>📢 New Announcement</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" style={inputStyle} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Priority</label>
                      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as AnnouncementPriority }))} style={inputStyle}>
                        {(Object.keys(PRIORITY_CONFIG) as AnnouncementPriority[]).map(p => (
                          <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Target Audience</label>
                      <select value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value as AnnouncementTarget }))} style={inputStyle}>
                        {(Object.keys(TARGET_LABELS) as AnnouncementTarget[]).map(t => (
                          <option key={t} value={t}>{TARGET_LABELS[t]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Message Body <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} placeholder="Write your announcement here..." style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>Attachment URL (Google Drive)</label>
                    <input value={form.attachmentUrl} onChange={e => setForm(f => ({ ...f, attachmentUrl: e.target.value }))} placeholder="https://drive.google.com/..." style={inputStyle} />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.pinned} onChange={e => setForm(f => ({ ...f, pinned: e.target.checked }))} />
                    📌 Pin this announcement (show at top)
                  </label>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
