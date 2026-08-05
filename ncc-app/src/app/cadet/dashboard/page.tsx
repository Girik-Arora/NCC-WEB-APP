'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetProfile, getCadetSkills, getCadetAchievements, getCampHistory, getCadetEvaluations } from '@/lib/db';
import type { CadetProfile, Skill, Achievement, CampRecord, SemesterEvaluation } from '@/types';
import Link from 'next/link';
import { User, Star, Trophy, Tent, Calendar, ArrowRight, TrendingUp, Medal, CheckCircle, AlertCircle } from 'lucide-react';

export default function CadetDashboard() {
  const { user, userProfile } = useAuth();
  const [profile, setProfile] = useState<CadetProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [camps, setCamps] = useState<CampRecord[]>([]);
  const [evaluations, setEvaluations] = useState<SemesterEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const [p, s, a, c, e] = await Promise.all([
          getCadetProfile(user.uid),
          getCadetSkills(user.uid),
          getCadetAchievements(user.uid).catch(() => []), // Fallback if index missing
          getCampHistory(user.uid).catch(() => []), // Fallback if index missing
          getCadetEvaluations(user.uid).catch(() => []), // Fallback if index missing
        ]);
        setProfile(p);
        setSkills(s);
        setAchievements(a);
        setCamps(c);
        setEvaluations(e);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const latestEval = evaluations[0];
  const avgEvalScore = latestEval
    ? Math.round(([latestEval.discipline, latestEval.leadership, latestEval.drill, latestEval.attendance, latestEval.initiative, latestEval.physicalFitness, latestEval.teamwork, latestEval.communication].reduce((a, b) => a + b, 0) / 8) * 20)
    : null;

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const stats = [
    { label: 'Skills', value: skills.length, icon: <Star size={22} color="#2563eb" />, href: '/cadet/skills', color: '#eff6ff', border: '#bfdbfe' },
    { label: 'Achievements', value: achievements.length, icon: <Trophy size={22} color="#d97706" />, href: '/cadet/achievements', color: '#fffbeb', border: '#fde68a' },
    { label: 'Camps Attended', value: camps.length, icon: <Tent size={22} color="#16a34a" />, href: '/cadet/camps', color: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Eval Score', value: avgEvalScore ? `${avgEvalScore}%` : 'N/A', icon: <TrendingUp size={22} color="#7c3aed" />, href: '#', color: '#faf5ff', border: '#e9d5ff' },
  ];

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ flex: 1, height: 100, borderRadius: 12, background: '#e2e8f0', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 4 }}>{greetingTime()},</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
          {userProfile?.displayName?.split(' ')[0] || 'Cadet'} 👋
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          {profile?.profileComplete ? 'Your profile is complete and ready.' : 'Complete your profile to get started.'}
        </p>
      </div>

      {/* Profile incomplete warning */}
      {!profile?.profileComplete && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
          padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <AlertCircle size={20} color="#d97706" />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 600, color: '#92400e', fontSize: 14 }}>Profile Incomplete</p>
            <p style={{ color: '#b45309', fontSize: 13 }}>Complete your profile to appear in camp recommendations and evaluations.</p>
          </div>
          <Link href="/cadet/profile">
            <button className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>Complete Now</button>
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ borderTop: `3px solid ${stat.border}` }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10, background: stat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stat.icon}
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Latest Evaluation */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Latest Evaluation</h3>
            {latestEval && (
              <span className="badge badge-blue">Sem {latestEval.semester} / {latestEval.year}</span>
            )}
          </div>
          {latestEval ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'discipline', label: 'Discipline', val: latestEval.discipline },
                { key: 'leadership', label: 'Leadership', val: latestEval.leadership },
                { key: 'drill', label: 'Drill', val: latestEval.drill },
                { key: 'attendance', label: 'Attendance', val: latestEval.attendance },
                { key: 'physicalFitness', label: 'Physical Fitness', val: latestEval.physicalFitness },
                { key: 'communication', label: 'Communication', val: latestEval.communication },
              ].map((item) => (
                <div key={item.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: item.val >= 4 ? '#16a34a' : item.val >= 3 ? '#d97706' : '#dc2626' }}>
                      {item.val}/5
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(item.val / 5) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
              <Medal size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>No evaluations yet</p>
              <p style={{ fontSize: 12 }}>Your ANO will evaluate you each semester</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { href: '/cadet/achievements', icon: <Trophy size={18} />, label: 'Add Achievement', desc: 'Upload a new certificate or award' },
                { href: '/cadet/camps', icon: <Tent size={18} />, label: 'Log Camp', desc: 'Record a camp you attended' },
                { href: '/cadet/skills', icon: <Star size={18} />, label: 'Update Skills', desc: 'Add or update your skill levels' },
                { href: '/cadet/profile', icon: <User size={18} />, label: 'Edit Profile', desc: 'Update personal details' },
              ].map((action) => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px', borderRadius: 8, border: '1px solid #f1f5f9',
                    transition: 'all 0.2s', cursor: 'pointer',
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#f8f9fc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#f1f5f9'; }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, background: '#f1f5f9',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1e3a5f',
                    }}>{action.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{action.label}</p>
                      <p style={{ fontSize: 12, color: '#64748b' }}>{action.desc}</p>
                    </div>
                    <ArrowRight size={16} color="#94a3b8" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Camps */}
          {camps.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 12 }}>Recent Camps</h3>
              {camps.slice(0, 3).map((camp) => (
                <div key={camp.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
                  borderBottom: '1px solid #f1f5f9',
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: camp.grade === 'A' ? '#16a34a' : camp.grade === 'B' ? '#d97706' : '#64748b',
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{camp.campType}</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>{camp.year} · Grade {camp.grade}</p>
                  </div>
                  <CheckCircle size={16} color="#16a34a" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
