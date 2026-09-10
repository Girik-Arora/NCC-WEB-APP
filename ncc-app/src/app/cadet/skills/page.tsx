'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetSkills, saveCadetSkills, uploadFile } from '@/lib/db';
import type { Skill, SkillLevel, VerificationStatus } from '@/types';
import toast from 'react-hot-toast';
import { Save, Star, X, Check, CloudOff, AlertCircle } from 'lucide-react';

const SKILL_CATEGORIES = [
  { category: 'Water Sports', skills: ['Swimming', 'Sailing', 'Boat Pulling', 'Kayaking'] },
  { category: 'Military', skills: ['Firing', 'Parade', 'Drill', 'Map Reading', 'First Aid', 'Rock Climbing'] },
  { category: 'Sports & Fitness', skills: ['Running', 'Sports', 'Athletics', 'Yoga', 'Endurance'] },
  { category: 'Arts & Culture', skills: ['Singing', 'Dance', 'Debate', 'Photography', 'Theatre', 'Music'] },
  { category: 'Leadership', skills: ['Team Leadership', 'Event Management', 'Communication', 'Cultural Talent'] },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: SkillLevel) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} onClick={() => onChange(i as SkillLevel)}
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 1, fontSize: 20, lineHeight: 1,
            transition: 'transform 0.1s', transform: hover >= i || value >= i ? 'scale(1.15)' : 'scale(1)',
            color: hover >= i || value >= i ? '#f59e0b' : '#e2e8f0' }}>★</button>
      ))}
    </div>
  );
}

function StatusBadge({ status, reason }: { status?: VerificationStatus; reason?: string }) {
  if (status === 'verified') return <span className="badge badge-green" style={{fontSize: 11}}>Verified</span>;
  if (status === 'rejected') return (
    <span className="badge badge-red" style={{fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4}} title={reason}>
      <AlertCircle size={12}/> Rejected
    </span>
  );
  return <span className="badge badge-yellow" style={{fontSize: 11}}>Pending</span>;
}

export default function SkillsPage() {
  const { user } = useAuth();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    getCadetSkills(user.uid).then((s) => { setSkills(s); setLoading(false); });
  }, [user]);

  const getSkill = (name: string) => skills.find((s) => s.name === name);
  const hasSkill = (name: string) => !!getSkill(name);

  const toggleSkill = (name: string, category: string) => {
    if (hasSkill(name)) {
      setSkills((prev) => prev.filter((s) => s.name !== name));
    } else {
      setSkills((prev) => [...prev, { id: `${name}-${Date.now()}`, name, category, level: 3, addedAt: new Date(), verificationStatus: 'pending' }]);
    }
  };

  const updateLevel = (name: string, level: SkillLevel) => {
    setSkills((prev) => prev.map((s) => s.name === name ? { ...s, level } : s));
  };

  const updateUrl = (name: string, url: string) => {
    setSkills((prev) => prev.map((s) => s.name === name ? { ...s, certificateUrl: url } : s));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveCadetSkills(user.uid, skills);
      toast.success(`${skills.length} skills saved!`);
    } catch {
      toast.error('Failed to save skills.');
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = search
    ? SKILL_CATEGORIES.map((cat) => ({ ...cat, skills: cat.skills.filter((s) => s.toLowerCase().includes(search.toLowerCase())) })).filter((cat) => cat.skills.length > 0)
    : SKILL_CATEGORIES;

  if (loading) return <AppShell><div style={{ height: 400, background: '#e2e8f0', borderRadius: 12 }} /></AppShell>;

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Skills</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Select your skills and rate your proficiency. <strong>{skills.length}</strong> selected.</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          <Save size={16} />{saving ? 'Saving...' : 'Save Skills'}
        </button>
      </div>

      <div style={{ marginBottom: 24, maxWidth: 360 }}>
        <input className="form-input" placeholder="Search skills..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {skills.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 12 }}>Selected Skills ({skills.length})</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {skills.map((skill) => (
              <span key={skill.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#1e3a5f', color: 'white', borderRadius: 20, fontSize: 13, fontWeight: 500 }}>
                {skill.name}
                <span style={{ color: '#93c5fd', fontSize: 12 }}>{'★'.repeat(skill.level)}</span>
                <StatusBadge status={skill.verificationStatus} reason={skill.rejectionReason} />
                <button onClick={() => toggleSkill(skill.name, skill.category)} style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filteredCategories.map((cat) => (
          <div key={cat.category} className="card">
            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 16 }}>{cat.category}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cat.skills.map((skillName) => {
                const skill = getSkill(skillName);
                const selected = !!skill;
                return (
                  <div key={skillName} style={{ borderRadius: 10, border: `1.5px solid ${selected ? '#2563eb' : '#e2e8f0'}`, background: selected ? '#eff6ff' : '#f8f9fc', overflow: 'hidden', transition: 'all 0.2s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer' }} onClick={() => toggleSkill(skillName, cat.category)}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, border: `2px solid ${selected ? '#2563eb' : '#cbd5e1'}`, background: selected ? '#2563eb' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
                        {selected && <Check size={14} color="white" />}
                      </div>
                      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: selected ? '#1e3a5f' : '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {skillName}
                        {selected && <StatusBadge status={skill?.verificationStatus} reason={skill?.rejectionReason} />}
                      </span>
                    </div>
                    {selected && (
                      <div style={{ padding: '0 16px 14px 52px' }}>
                        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>Proficiency Level</p>
                        <StarRating value={skill!.level} onChange={(v) => updateLevel(skillName, v)} />
                        
                        <div style={{ marginTop: 12 }}>
                          <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 500 }}>Certificate Link (Optional)</p>
                          <input className="form-input" style={{ padding: '8px 12px', fontSize: 13 }} type="url" value={skill!.certificateUrl || ''} onChange={(e) => updateUrl(skillName, e.target.value)} placeholder="Paste a Google Drive or OneDrive link here..." />
                          {skill!.certificateUrl && (
                            <a href={skill!.certificateUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 12, fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
                              View Certificate ↗
                            </a>
                          )}
                        </div>

                        {skill!.verificationStatus === 'rejected' && skill!.rejectionReason && (
                          <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: '#991b1b' }}>
                            <strong>Rejection Reason:</strong> {skill!.rejectionReason}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
