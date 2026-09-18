'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCampHistory, addCampRecord, deleteCampRecord } from '@/lib/db';
import type { CampRecord, CampType, Grade, VerificationStatus } from '@/types';
import toast from 'react-hot-toast';
import { Plus, Tent, Trash2, Award, X, CloudOff, AlertCircle } from 'lucide-react';

function StatusBadge({ status, reason }: { status?: VerificationStatus; reason?: string }) {
  if (status === 'verified') return <span className="badge badge-green" style={{fontSize: 11}}>Verified</span>;
  if (status === 'rejected') return (
    <span className="badge badge-red" style={{fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4}} title={reason}>
      <AlertCircle size={12}/> Rejected
    </span>
  );
  return <span className="badge badge-yellow" style={{fontSize: 11}}>Pending</span>;
}

const CAMP_TYPES: CampType[] = ['CATC', 'NIC', 'SNIC', 'RDC', 'Trekking', 'Sailing', 'Army Attachment', 'Navy Attachment', 'Air Attachment'];
const GRADES: Grade[] = ['A', 'B', 'C', 'Pass'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

const CAMP_COLORS: Record<string, string> = {
  CATC: '#2563eb', NIC: '#7c3aed', SNIC: '#db2777',
  RDC: '#dc2626', Trekking: '#16a34a', Sailing: '#0891b2',
  'Army Attachment': '#92400e', 'Navy Attachment': '#1e3a5f', 'Air Attachment': '#0369a1',
};

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: Omit<CampRecord, 'id' | 'uid' | 'createdAt'>) => Promise<void> }) {
  const [form, setForm] = useState({ campType: 'CATC' as CampType, year: CURRENT_YEAR, location: '', grade: 'A' as Grade, position: '', certificateUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onAdd({ ...form, verificationStatus: 'pending' });
      onClose();
    } catch {
      toast.error('Failed to add camp record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 800, fontSize: 20, color: '#0f172a' }}>Log Camp Attendance</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={20} /></button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Camp Type *</label>
            <select className="form-select" value={form.campType} onChange={(e) => setForm({ ...form, campType: e.target.value as CampType })}>
              {CAMP_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Year *</label>
            <select className="form-select" value={form.year} onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Grade</label>
            <select className="form-select" value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value as Grade })}>
              {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Camp location / place" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Position / Role (Optional)</label>
            <input className="form-input" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Platoon Commander, Best Cadet" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Certificate Link (Optional)</label>
            <input className="form-input" type="url" value={form.certificateUrl} onChange={(e) => setForm({ ...form, certificateUrl: e.target.value })} placeholder="Paste a Google Drive or OneDrive link here..." />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? 'Saving...' : 'Log Camp'}</button>
        </div>
      </div>
    </div>
  );
}

export default function CampsPage() {
  const { user } = useAuth();
  const [camps, setCamps] = useState<CampRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCampHistory(user.uid).then((c) => { setCamps(c); setLoading(false); });
  }, [user]);

  const handleAdd = async (data: Omit<CampRecord, 'id' | 'uid' | 'createdAt'>) => {
    if (!user) return;
    const id = await addCampRecord(user.uid, data);
    setCamps((prev) => [{ ...data, id, uid: user.uid, createdAt: new Date() }, ...prev]);
    toast.success('Camp logged!');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this camp record?')) return;
    await deleteCampRecord(id);
    setCamps((prev) => prev.filter((c) => c.id !== id));
    toast.success('Record removed.');
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Camp History</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{camps.length} camps attended.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Log Camp</button>
      </div>

      {/* Camp type summary chips */}
      {camps.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {[...new Set(camps.map((c) => c.campType))].map((type) => (
            <span key={type} style={{ padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: CAMP_COLORS[type] || '#475569', color: 'white' }}>
              {type} ({camps.filter((c) => c.campType === type).length})
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ height: 80, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
        </div>
      ) : camps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
          <Tent size={56} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>No camps recorded</h3>
          <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Log First Camp</button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {camps.map((camp) => {
              const color = CAMP_COLORS[camp.campType] || '#475569';
              return (
                <div key={camp.id} style={{ display: 'flex', gap: 20, paddingLeft: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 14, border: '3px solid white', boxShadow: `0 0 0 2px ${color}` }} />
                  <div className="card" style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: color, color: 'white' }}>{camp.campType}</span>
                          <span className={`badge badge-${camp.grade === 'A' ? 'green' : camp.grade === 'B' ? 'yellow' : 'gray'}`}>Grade {camp.grade}</span>
                          <StatusBadge status={camp.verificationStatus} reason={camp.rejectionReason} />
                        </div>
                        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 4 }}>{camp.campType} — {camp.year}</h3>
                        {camp.location && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>📍 {camp.location}</p>}
                        {camp.position && <p style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}><Award size={13} style={{ display: 'inline', marginRight: 4 }} />{camp.position}</p>}
                        {camp.certificateUrl && (
                          <a href={camp.certificateUrl} target="_blank" rel="noopener noreferrer" 
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: 6, marginTop: 4 }}>
                            View Certificate
                          </a>
                        )}
                        {camp.verificationStatus === 'rejected' && camp.rejectionReason && (
                          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#991b1b' }}>
                            <strong>Rejection Reason:</strong> {camp.rejectionReason}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDelete(camp.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fca5a5', padding: 4 }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {showModal && <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </AppShell>
  );
}
