'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetAchievements, addAchievement, deleteAchievement } from '@/lib/db';
import type { Achievement, VerificationStatus } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Trophy, Trash2, X, Calendar, CloudOff, AlertCircle } from 'lucide-react';

function StatusBadge({ status, reason }: { status?: VerificationStatus; reason?: string }) {
  if (status === 'verified') return <span className="badge badge-green" style={{fontSize: 11}}>Verified</span>;
  if (status === 'rejected') return (
    <span className="badge badge-red" style={{fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4}} title={reason}>
      <AlertCircle size={12}/> Rejected
    </span>
  );
  return <span className="badge badge-yellow" style={{fontSize: 11}}>Pending</span>;
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: Omit<Achievement, 'id' | 'uid' | 'createdAt'>) => Promise<void> }) {
  const [form, setForm] = useState({ title: '', description: '', date: '', certificateUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title || !form.date) { toast.error('Title and date are required.'); return; }
    setLoading(true);
    try {
      await onAdd({ ...form, photoUrl: '' });
      onClose();
    } catch {
      toast.error('Failed to add achievement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, fontSize: 20, color: '#0f172a' }}>Add Achievement</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><X size={20} /></button>
        </div>

        <div className="form-group">
          <label className="form-label">Title *</label>
          <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Best Cadet Award, State NCC Rally" />
        </div>
        <div className="form-group">
          <label className="form-label">Date *</label>
          <input className="form-input" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Briefly describe what you achieved..." rows={3} style={{ resize: 'vertical' }} />
        </div>
        <div className="form-group">
          <label className="form-label">Document Link (Optional)</label>
          <input className="form-input" type="url" value={form.certificateUrl} onChange={(e) => setForm({ ...form, certificateUrl: e.target.value })}
            placeholder="Paste a Google Drive or OneDrive link here..." />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Add Achievement'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCadetAchievements(user.uid).then((a) => { setAchievements(a); setLoading(false); });
  }, [user]);

  const handleAdd = async (data: Omit<Achievement, 'id' | 'uid' | 'createdAt'>) => {
    if (!user) return;
    const id = await addAchievement(user.uid, data);
    const newA: Achievement = { ...data, id, uid: user.uid, createdAt: new Date() };
    setAchievements((prev) => [newA, ...prev]);
    toast.success('Achievement added!');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this achievement?')) return;
    await deleteAchievement(id);
    setAchievements((prev) => prev.filter((a) => a.id !== id));
    toast.success('Achievement deleted.');
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Achievements</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Your awards, certificates, and accomplishments.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Achievement
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[1, 2, 3].map((i) => (<div key={i} style={{ height: 160, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />))}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
        </div>
      ) : achievements.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <Trophy size={56} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>No achievements yet</h3>
          <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Add First Achievement</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {achievements.map((a) => (
            <div key={a.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #c8960c, #f59e0b)' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fffbeb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trophy size={18} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.3 }}>{a.title}</h3>
                      <StatusBadge status={a.verificationStatus} reason={a.rejectionReason} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, color: '#94a3b8', fontSize: 12 }}>
                      <Calendar size={12} />{a.date}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 4, flexShrink: 0 }}>
                  <Trash2 size={15} />
                </button>
              </div>
              {a.description && <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 12 }}>{a.description}</p>}
              {a.certificateUrl && (
                <a href={a.certificateUrl} target="_blank" rel="noopener noreferrer" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: 6 }}>
                  View Document
                </a>
              )}
              {a.verificationStatus === 'rejected' && a.rejectionReason && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#991b1b' }}>
                  <strong>Rejection Reason:</strong> {a.rejectionReason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </AppShell>
  );
}
