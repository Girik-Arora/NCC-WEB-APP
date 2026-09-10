'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllAchievementsAdmin, deleteAchievement, getAllCadets } from '@/lib/db';
import { Achievement } from '@/types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Trophy, Trash2, Edit } from 'lucide-react';

interface AchievementRow extends Achievement {
  cadetName: string;
}

export default function AdminAchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AchievementRow | null>(null);
  const [editForm, setEditForm] = useState({ title: '', date: '', description: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allAchievements, allCadets] = await Promise.all([
        getAllAchievementsAdmin(),
        getAllCadets()
      ]);
      
      const cadetMap = allCadets.reduce((acc, c) => {
        acc[c.uid] = `${c.firstName} ${c.lastName}`;
        return acc;
      }, {} as Record<string, string>);

      const mapped: AchievementRow[] = allAchievements.map(a => ({
        ...a,
        cadetName: cadetMap[a.uid] || 'Unknown Cadet'
      }));
      
      setAchievements(mapped);
    } catch (error) {
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the achievement "${title}"?`)) return;
    try {
      await deleteAchievement(id);
      toast.success('Achievement deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete achievement');
    }
  };

  const handleEdit = (a: AchievementRow) => {
    setEditing(a);
    setEditForm({ title: a.title, date: a.date, description: a.description || '' });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await updateDoc(doc(db, 'achievements', editing.id), {
        title: editForm.title,
        date: editForm.date,
        description: editForm.description,
      });
      toast.success('Achievement updated');
      setEditing(null);
      loadData();
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <AppShell requiredRole="admin">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Trophy size={24} color="#9333ea" /> Global Achievements
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Monitor all achievements across the system.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>CADET</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>TITLE</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>DATE</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : achievements.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No achievements logged yet.</td>
                </tr>
              ) : (
                achievements.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: '#0f172a' }}>{a.cadetName}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{a.title}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{a.date}</td>
                    <td style={{ padding: '16px', display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => handleEdit(a)}
                        className="btn-ghost" 
                        style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #cbd5e1' }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(a.id, a.title)}
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
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Edit Achievement</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
