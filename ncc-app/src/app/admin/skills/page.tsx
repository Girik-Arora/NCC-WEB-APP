'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllSkillsAdmin, saveCadetSkills, getAllCadets } from '@/lib/db';
import { CadetSkills, Skill, CadetProfile } from '@/types';
import toast from 'react-hot-toast';
import { Star, Trash2, Edit } from 'lucide-react';

interface SkillRow extends Skill {
  cadetUid: string;
  cadetName: string;
}

export default function AdminSkillsPage() {
  const [skillsList, setSkillsList] = useState<SkillRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SkillRow | null>(null);
  const [editForm, setEditForm] = useState({ name: '', category: 'Technical', level: 1 });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allSkills, allCadets] = await Promise.all([
        getAllSkillsAdmin(),
        getAllCadets()
      ]);
      
      const cadetMap = allCadets.reduce((acc, c) => {
        acc[c.uid] = `${c.firstName} ${c.lastName}`;
        return acc;
      }, {} as Record<string, string>);

      const flattened: SkillRow[] = [];
      allSkills.forEach(cs => {
        if (cs.skills) {
          cs.skills.forEach(s => {
            flattened.push({
              ...s,
              cadetUid: cs.uid,
              cadetName: cadetMap[cs.uid] || 'Unknown Cadet'
            });
          });
        }
      });
      
      setSkillsList(flattened.sort((a, b) => b.level - a.level));
    } catch (error) {
      toast.error('Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (uid: string, skillId: string, skillName: string) => {
    if (!confirm(`Are you sure you want to delete the skill "${skillName}"?`)) return;
    try {
      // Find the specific CadetSkills doc
      const allSkills = await getAllSkillsAdmin();
      const userSkillsDoc = allSkills.find(s => s.uid === uid);
      if (userSkillsDoc && userSkillsDoc.skills) {
        const filtered = userSkillsDoc.skills.filter(s => s.id !== skillId);
        await saveCadetSkills(uid, filtered);
        toast.success('Skill deleted');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to delete skill');
    }
  };

  const handleEdit = (s: SkillRow) => {
    setEditing(s);
    setEditForm({ name: s.name, category: s.category, level: s.level });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const allSkills = await getAllSkillsAdmin();
      const userSkillsDoc = allSkills.find(doc => doc.uid === editing.cadetUid);
      if (userSkillsDoc && userSkillsDoc.skills) {
        const updated = userSkillsDoc.skills.map(skill => 
          skill.id === editing.id 
            ? { ...skill, name: editForm.name, category: editForm.category as any, level: Number(editForm.level) } 
            : skill
        );
        await saveCadetSkills(editing.cadetUid, updated);
        toast.success('Skill updated');
        setEditing(null);
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update skill');
    }
  };

  return (
    <AppShell requiredRole="admin">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star size={24} color="#d97706" /> Global Skills Log
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Monitor all skills logged by cadets system-wide.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>CADET</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>SKILL NAME</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>CATEGORY</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>LEVEL</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : skillsList.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No skills logged yet.</td>
                </tr>
              ) : (
                skillsList.map((s) => (
                  <tr key={`${s.cadetUid}-${s.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: '#0f172a' }}>{s.cadetName}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{s.name}</td>
                    <td style={{ padding: '16px' }}>
                      <span className="badge badge-gray" style={{ fontSize: 11 }}>{s.category}</span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} style={{ fontSize: 14, color: i <= s.level ? '#f59e0b' : '#e2e8f0' }}>★</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px', display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => handleEdit(s)}
                        className="btn-ghost" 
                        style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #cbd5e1' }}
                      >
                        <Edit size={14} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(s.cadetUid, s.id, s.name)}
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
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Edit Skill</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Skill Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  <option value="Technical">Technical</option>
                  <option value="Physical">Physical</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Level (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="form-input"
                  value={editForm.level}
                  onChange={(e) => setEditForm({ ...editForm, level: Number(e.target.value) })}
                  required
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
