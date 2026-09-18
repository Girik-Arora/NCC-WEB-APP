'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { getCadetProfile, getCadetSkills, getCadetAchievements, getCampHistory, getCadetEvaluations } from '@/lib/db';
import type { CadetProfile, Skill, Achievement, CampRecord, SemesterEvaluation } from '@/types';
import Link from 'next/link';
import { ArrowLeft, User, Star, Trophy, Tent, FileText, CheckCircle, Heart, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const CAMP_COLORS: Record<string, string> = {
  CATC: '#2563eb', NIC: '#7c3aed', SNIC: '#db2777',
  RDC: '#dc2626', Trekking: '#16a34a', Sailing: '#0891b2',
  'Army Attachment': '#92400e', 'Navy Attachment': '#1e3a5f', 'Air Attachment': '#0369a1',
};

export default function CadetDetailPage() {
  const { uid } = useParams() as { uid: string };
  const { userProfile } = useAuth();
  const [profile, setProfile] = useState<CadetProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [camps, setCamps] = useState<CampRecord[]>([]);
  const [evaluations, setEvaluations] = useState<SemesterEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'skills' | 'camps' | 'evaluations' | 'achievements'>('overview');

  useEffect(() => {
    const load = async () => {
      const [p, s, a, c, e] = await Promise.all([
        getCadetProfile(uid),
        getCadetSkills(uid),
        getCadetAchievements(uid),
        getCampHistory(uid),
        getCadetEvaluations(uid),
      ]);
      setProfile(p);
      setSkills(s);
      setAchievements(a);
      setCamps(c);
      setEvaluations(e);
      setLoading(false);
    };
    load();
  }, [uid]);

  const initials = profile
    ? `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`.toUpperCase()
    : '?';

  const latestEval = evaluations[0];

  if (loading) {
    return (
      <AppShell requiredRole={['ano', 'admin', 'mod_cadet']}>
        <div style={{ height: 400, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </AppShell>
    );
  }

  if (!profile) {
    return <AppShell requiredRole={['ano', 'admin', 'mod_cadet']}><p>Cadet not found.</p></AppShell>;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills', label: `Skills (${skills.length})` },
    { id: 'achievements', label: `Achievements (${achievements.length})` },
    { id: 'camps', label: `Camps (${camps.length})` },
    { id: 'evaluations', label: `Evaluations (${evaluations.length})` },
  ] as const;

  type TabId = typeof tabs[number]['id'];

  const canEvaluate = userProfile?.role === 'ano' || userProfile?.role === 'admin';
  const backUrl = userProfile?.role === 'mod_cadet' ? '/mod-cadet/roster' : '/ano/cadets';

  return (
    <AppShell requiredRole={['ano', 'admin', 'mod_cadet']}>
      {/* Back */}
      <Link href={backUrl} style={{ textDecoration: 'none' }}>
        <button className="btn-ghost" style={{ marginBottom: 20 }}>
          <ArrowLeft size={16} /> {userProfile?.role === 'mod_cadet' ? 'Back to Platoon Roster' : 'Back to Cadets'}
        </button>
      </Link>

      {/* Profile header */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div className="avatar avatar-xl">{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>
                {profile.firstName} {profile.lastName}
              </h1>
              <span className="badge badge-blue">{profile.branch}</span>
              {profile.availability ? (
                <span className="badge badge-green">Available</span>
              ) : (
                <span className="badge badge-gray">Unavailable</span>
              )}
              {profile.medicalIssues && <span className="badge badge-red">Medical Note</span>}
            </div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', color: '#64748b', fontSize: 13 }}>
              <span>Roll: <strong style={{ color: '#0f172a' }}>{profile.rollNumber}</strong></span>
              <span>Semester: <strong style={{ color: '#0f172a' }}>{profile.semester}</strong></span>
              <span>Blood Group: <strong style={{ color: '#0f172a' }}>{profile.bloodGroup}</strong></span>
              <span>College: <strong style={{ color: '#0f172a' }}>{profile.college}</strong></span>
            </div>
          </div>
          {canEvaluate && (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href={`/ano/evaluate?cadet=${uid}`}>
                <button className="btn-primary" style={{ fontSize: 13 }}>Evaluate</button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            style={{
              padding: '8px 18px', borderRadius: 7, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
              background: tab === t.id ? 'white' : 'transparent',
              color: tab === t.id ? '#1e3a5f' : '#64748b',
              boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Contact */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Phone size={16} color="#1e3a5f" /> Contact
            </h3>
            {[
              { label: 'Phone', value: profile.phone },
              { label: 'Address', value: profile.address },
              { label: 'City', value: profile.city },
              { label: 'State', value: profile.state },
            ].map((item) => item.value ? (
              <div key={item.label} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#94a3b8', minWidth: 60 }}>{item.label}</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{item.value}</span>
              </div>
            ) : null)}
          </div>

          {/* Emergency */}
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
              Emergency Contact
            </h3>
            {[
              { label: 'Name', value: profile.emergencyName },
              { label: 'Relation', value: profile.emergencyRelation },
              { label: 'Phone', value: profile.emergencyPhone },
            ].map((item) => item.value ? (
              <div key={item.label} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 13 }}>
                <span style={{ color: '#94a3b8', minWidth: 60 }}>{item.label}</span>
                <span style={{ color: '#0f172a', fontWeight: 500 }}>{item.value}</span>
              </div>
            ) : null)}
          </div>

          {/* Latest Eval */}
          {latestEval && (
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 14 }}>
                Latest Evaluation — Sem {latestEval.semester} / {latestEval.year}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { label: 'Discipline', val: latestEval.discipline },
                  { label: 'Leadership', val: latestEval.leadership },
                  { label: 'Drill', val: latestEval.drill },
                  { label: 'Attendance', val: latestEval.attendance },
                  { label: 'Initiative', val: latestEval.initiative },
                  { label: 'Physical', val: latestEval.physicalFitness },
                  { label: 'Teamwork', val: latestEval.teamwork },
                  { label: 'Communication', val: latestEval.communication },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center' as const, padding: '12px 8px', background: '#f8f9fc', borderRadius: 8 }}>
                    <p style={{ fontSize: 22, fontWeight: 800, color: item.val >= 4 ? '#16a34a' : item.val >= 3 ? '#d97706' : '#dc2626' }}>
                      {item.val}<span style={{ fontSize: 14, color: '#94a3b8' }}>/5</span>
                    </p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skills */}
      {tab === 'skills' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {skills.length === 0 ? (
            <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>No skills added yet.</p>
          ) : skills.map((s) => (
            <div key={s.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{s.name}</p>
                {s.certificateUrl && <CheckCircle size={14} color="#16a34a" />}
              </div>
              <span className="badge badge-gray" style={{ fontSize: 11, marginBottom: 8, display: 'block', width: 'fit-content' }}>{s.category}</span>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} style={{ fontSize: 16, color: i <= s.level ? '#f59e0b' : '#e2e8f0' }}>★</span>
                ))}
              </div>
              {s.certificateUrl && (
                <a href={s.certificateUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, fontSize: 12, fontWeight: 600, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '4px 10px', borderRadius: 6 }}>
                  <FileText size={12} /> View Document
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Achievements */}
      {tab === 'achievements' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {achievements.length === 0 ? (
            <p style={{ color: '#94a3b8', gridColumn: '1/-1' }}>No achievements recorded.</p>
          ) : achievements.map((a) => (
            <div key={a.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #c8960c, #f59e0b)' }} />
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fffbeb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trophy size={16} color="#d97706" />
                </div>
                <div>
                  <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', lineHeight: 1.3 }}>{a.title}</h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{a.date}</p>
                </div>
              </div>
              {a.description && <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 12 }}>{a.description}</p>}
              {a.certificateUrl && (
                <a href={a.certificateUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#2563eb', textDecoration: 'none', background: '#eff6ff', padding: '6px 12px', borderRadius: 6 }}>
                  <FileText size={14} /> View Document
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Camps */}
      {tab === 'camps' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {camps.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No camps logged yet.</p>
          ) : camps.map((camp) => (
            <div key={camp.id} className="card" style={{ borderLeft: `4px solid ${CAMP_COLORS[camp.campType] || '#475569'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{camp.campType}</span>
                    <span className={`badge badge-${camp.grade === 'A' ? 'green' : camp.grade === 'B' ? 'yellow' : 'gray'}`}>Grade {camp.grade}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{camp.year} {camp.location && `· ${camp.location}`}</p>
                  {camp.position && <p style={{ fontSize: 13, color: '#475569', marginTop: 4 }}>Position: {camp.position}</p>}
                </div>
                {camp.certificateUrl && (
                  <a href={camp.certificateUrl} target="_blank" rel="noreferrer" className="btn-ghost" style={{ fontSize: 12 }}>
                    <FileText size={14} /> Certificate
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Evaluations */}
      {tab === 'evaluations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {evaluations.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No evaluations yet.</p>
          ) : evaluations.map((ev) => (
            <div key={ev.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontWeight: 700, color: '#0f172a' }}>Semester {ev.semester} — {ev.year}</h3>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#1e3a5f' }}>
                  {Math.round(([ev.discipline, ev.leadership, ev.drill, ev.attendance, ev.initiative, ev.physicalFitness, ev.teamwork, ev.communication].reduce((a, b) => a + b, 0) / 8) * 20)}%
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                {[
                  { label: 'Discipline', val: ev.discipline },
                  { label: 'Leadership', val: ev.leadership },
                  { label: 'Drill', val: ev.drill },
                  { label: 'Attendance', val: ev.attendance },
                  { label: 'Initiative', val: ev.initiative },
                  { label: 'Physical', val: ev.physicalFitness },
                  { label: 'Teamwork', val: ev.teamwork },
                  { label: 'Communication', val: ev.communication },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center' as const, padding: 10, background: '#f8f9fc', borderRadius: 8 }}>
                    <p style={{ fontSize: 18, fontWeight: 800, color: item.val >= 4 ? '#16a34a' : item.val >= 3 ? '#d97706' : '#dc2626' }}>{item.val}/5</p>
                    <p style={{ fontSize: 11, color: '#64748b' }}>{item.label}</p>
                  </div>
                ))}
              </div>
              {ev.remarks && <p style={{ marginTop: 12, fontSize: 13, color: '#475569', fontStyle: 'italic' }}>"{ev.remarks}"</p>}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
