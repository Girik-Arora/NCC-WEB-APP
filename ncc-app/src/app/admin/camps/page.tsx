'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllCampsAdmin, deleteCampRecord, getAllCadets } from '@/lib/db';
import { CampRecord } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Tent, Trash2, Edit } from 'lucide-react';

interface CampRow extends CampRecord {
  cadetName: string;
}

export default function AdminCampsPage() {
  const [camps, setCamps] = useState<CampRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CampRow | null>(null);
  const [editForm, setEditForm] = useState({ campType: '', year: 2024, location: '', grade: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCamps, allCadets] = await Promise.all([
        getAllCampsAdmin(),
        getAllCadets()
      ]);
      
      const cadetMap = allCadets.reduce((acc, c) => {
        acc[c.uid] = `${c.firstName} ${c.lastName}`;
        return acc;
      }, {} as Record<string, string>);

      const mapped: CampRow[] = allCamps.map(c => ({
        ...c,
        cadetName: cadetMap[c.uid] || 'Unknown Cadet'
      }));
      
      setCamps(mapped.sort((a, b) => b.year - a.year));
    } catch (error) {
      toast.error('Failed to load camps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, type: string) => {
    if (!confirm(`Are you sure you want to delete the camp record for "${type}"?`)) return;
    try {
      await deleteCampRecord(id);
      toast.success('Camp record deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete camp record');
    }
  };

  const handleEdit = (c: CampRow) => {
    setEditing(c);
    setEditForm({ campType: c.campType, year: c.year, location: c.location, grade: c.grade || '' });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateDoc(doc(db, 'camps', editing.id), {
        campType: editForm.campType,
        year: Number(editForm.year),
        location: editForm.location,
        grade: editForm.grade,
      });
      toast.success('Camp record updated');
      setEditing(null);
      loadData();
    } catch (error) {
      toast.error('Failed to update camp record');
    }
  };

  return (
    <AppShell requiredRole="admin">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tent size={24} color="#0891b2" /> Global Camp Records
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Monitor all camps attended by cadets.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>CADET</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>TYPE</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>YEAR</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>LOCATION</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>GRADE</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : camps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No camp records found.</td>
                </tr>
              ) : (
                camps.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: '#0f172a' }}>{c.cadetName}</td>
                    <td style={{ padding: '16px', color: '#0f172a', fontWeight: 600 }}>{c.campType}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{c.year}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{c.location}</td>
                    <td style={{ padding: '16px', color: '#16a34a', fontWeight: 700 }}>{c.grade}</td>
                    <td style={{ padding: '16px', display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => handleEdit(c)}
                        className="btn-ghost" 
                        style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #cbd5e1' }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id, c.campType)}
                        className="btn-danger" 
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Edit Camp Record</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Camp Type</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.campType}
                  onChange={(e) => setEditForm({ ...editForm, campType: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Year</label>
                <input
                  type="number"
                  className="form-input"
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Grade</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.grade}
                  onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
