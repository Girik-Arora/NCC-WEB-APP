'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetAchievements, addAchievement, deleteAchievement, getCadetSkills, saveCadetSkills } from '@/lib/db';
import type { Achievement, Skill } from '@/types';
import { Trophy, Star, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ACHIEVEMENT_CATEGORIES = ['Republic Day', 'Independence Day', 'Sports', 'Cultural', 'Trekking', 'Social Service', 'Academic', 'Camp', 'Defence', 'Other'];
const SKILL_CATEGORIES = ['Drill', 'Weapon Training', 'Swimming', 'Navigation', 'First Aid', 'Parade', 'Sports', 'Music', 'IT', 'Language', 'Leadership', 'Other'];

export default function CadetAchievementsPage() {
  const { userProfile } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'achievements' | 'skills'>('achievements');
  const [showAchForm, setShowAchForm] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [achForm, setAchForm] = useState({ title: '', category: 'Sports', date: '', description: '', position: '', documentUrl: '' });
  const [skillForm, setSkillForm] = useState({ name: '', category: 'Drill', level: 3, description: '', documentUrl: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!userProfile?.uid) return;
    const [ach, sk] = await Promise.all([getCadetAchievements(userProfile.uid), getCadetSkills(userProfile.uid)]);
    setAchievements(ach);
    setSkills(sk);
    setLoading(false);
  };
  useEffect(() => { load(); }, [userProfile]);

  const handleAddAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achForm.title.trim()) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      await addAchievement(userProfile!.uid, achForm as any);
      toast.success('Achievement submitted for verification!');
      setShowAchForm(false);
      setAchForm({ title: '', category: 'Sports', date: '', description: '', position: '', documentUrl: '' });
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillForm.name.trim()) { toast.error('Skill name required'); return; }
    setSaving(true);
    try {
      const newSkill: Skill = {
        id: `sk_${Date.now()}`,
        ...skillForm,
        verificationStatus: 'pending',
        addedAt: new Date() as any,
      };
      await saveCadetSkills(userProfile!.uid, [...skills, newSkill]);
      toast.success('Skill added — pending verification');
      setShowSkillForm(false);
      setSkillForm({ name: '', category: 'Drill', level: 3, description: '', documentUrl: '' });
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleDeleteAch = async (id: string) => {
    await deleteAchievement(id);
    toast.success('Removed');
    load();
  };

  const VERIFY_COLORS = { pending: { color: '#b45309', bg: '#fffbeb' }, verified: { color: '#15803d', bg: '#f0fdf4' }, rejected: { color: '#dc2626', bg: '#fef2f2' } };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Achievements & Skills</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Build your cadet portfolio — submit for ANO verification</p>
          </div>
          <button onClick={() => tab === 'achievements' ? setShowAchForm(true) : setShowSkillForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'var(--navy-600)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            <Plus size={14} /> Add {tab === 'achievements' ? 'Achievement' : 'Skill'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
          {(['achievements', 'skills'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 700 : 400, color: tab === t ? 'var(--navy-600)' : 'var(--text-secondary)', borderBottom: tab === t ? '2.5px solid var(--navy-600)' : '2.5px solid transparent', textTransform: 'capitalize' }}>
              {t === 'achievements' ? `🏆 Achievements (${achievements.length})` : `⭐ Skills (${skills.length})`}
            </button>
          ))}
        </div>

        {loading ? <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading…</div> : (
          tab === 'achievements' ? (
            achievements.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No achievements yet. Add your first one!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {achievements.map(a => {
                  const vcfg = VERIFY_COLORS[a.verificationStatus] || VERIFY_COLORS.pending;
                  return (
                    <div key={a.id} style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{a.title}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: vcfg.bg, color: vcfg.color, textTransform: 'uppercase' }}>{a.verificationStatus}</span>
                          {a.category && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>{a.category}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {a.date && `📅 ${a.date}`} {a.position && `· 🏅 ${a.position}`}
                        </div>
                        {a.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{a.description}</div>}
                        {a.documentUrl && <a href={a.documentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--navy-600)', marginTop: 4, display: 'inline-block' }}>📎 View Document</a>}
                        {a.verificationStatus === 'rejected' && a.rejectionReason && <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>Reason: {a.rejectionReason}</div>}
                      </div>
                      <button onClick={() => handleDeleteAch(a.id!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}><Trash2 size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No skills added yet. Add your first skill!</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {skills.map(s => {
                  const vcfg = VERIFY_COLORS[s.verificationStatus] || VERIFY_COLORS.pending;
                  return (
                    <div key={s.id} style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)' }}>{s.name}</div>
                        <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, background: vcfg.bg, color: vcfg.color, alignSelf: 'flex-start' }}>{s.verificationStatus}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{s.category}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {[1,2,3,4,5].map(n => (
                          <div key={n} style={{ flex: 1, height: 6, borderRadius: 99, background: n <= s.level ? 'var(--navy-600)' : 'var(--bg-secondary)' }} />
                        ))}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>Level {s.level}/5</div>
                    </div>
                  );
                })}
              </div>
            )
          )
        )}

        {/* Achievement Form Modal */}
        {showAchForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowAchForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>🏆 Add Achievement</h2>
              <form onSubmit={handleAddAchievement}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Title *</label><input value={achForm.title} onChange={e => setAchForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. First Place in Inter-NCC Swimming" style={inputStyle} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                      <select value={achForm.category} onChange={e => setAchForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                        {ACHIEVEMENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Date</label><input type="date" value={achForm.date} onChange={e => setAchForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></div>
                  </div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Position / Award</label><input value={achForm.position} onChange={e => setAchForm(f => ({ ...f, position: e.target.value }))} placeholder="e.g. Gold Medal, 1st Rank, Certificate of Merit" style={inputStyle} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label><textarea value={achForm.description} onChange={e => setAchForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Document URL (Drive/Certificate)</label><input value={achForm.documentUrl} onChange={e => setAchForm(f => ({ ...f, documentUrl: e.target.value }))} placeholder="https://drive.google.com/..." style={inputStyle} /></div>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Skill Form Modal */}
        {showSkillForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 440, boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
              <button onClick={() => setShowSkillForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>⭐ Add Skill</h2>
              <form onSubmit={handleAddSkill}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Skill Name *</label><input value={skillForm.name} onChange={e => setSkillForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Close Order Drill" style={inputStyle} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                      <select value={skillForm.category} onChange={e => setSkillForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                        {SKILL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Proficiency Level (1-5)</label>
                      <input type="number" min={1} max={5} value={skillForm.level} onChange={e => setSkillForm(f => ({ ...f, level: parseInt(e.target.value) }))} style={inputStyle} />
                    </div>
                  </div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label><textarea value={skillForm.description} onChange={e => setSkillForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Proof URL (Drive)</label><input value={skillForm.documentUrl} onChange={e => setSkillForm(f => ({ ...f, documentUrl: e.target.value }))} style={inputStyle} /></div>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Add Skill'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
