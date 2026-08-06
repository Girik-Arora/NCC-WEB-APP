'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetProfile, getCadetSkills, getCadetAchievements, getCampHistory, getCadetEvaluations } from '@/lib/db';
import type { CadetProfile, Skill, Achievement, CampRecord, SemesterEvaluation } from '@/types';
import Link from 'next/link';
import {
  User, Star, Trophy, Tent, Calendar, ArrowRight,
  TrendingUp, Medal, CheckCircle, AlertCircle, Activity,
  Zap, Target, Award,
} from 'lucide-react';

const BRANCH_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  'Army':      { bg: '#f0fdf4', color: '#15803d', label: 'ARMY' },
  'Navy':      { bg: '#eff6ff', color: '#1d4ed8', label: 'NAVY' },
  'Air Force': { bg: '#f0f9ff', color: '#0369a1', label: 'AIR FORCE' },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

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
          getCadetAchievements(user.uid).catch(() => []),
          getCampHistory(user.uid).catch(() => []),
          getCadetEvaluations(user.uid).catch(() => []),
        ]);
        setProfile(p);
        setSkills(s);
        setAchievements(a);
        setCamps(c);
        setEvaluations(e);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
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

  const branchInfo = profile?.branch ? BRANCH_COLORS[profile.branch] ?? null : null;

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="skeleton" style={{ height: 100 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="skeleton" style={{ height: 320 }} />
          <div className="skeleton" style={{ height: 320 }} />
        </div>
      </AppShell>
    );
  }

  const stats = [
    {
      label: 'Skills', value: skills.length, icon: <Star size={20} />,
      href: '/cadet/skills',
      iconBg: '#eff6ff', iconColor: '#2563eb',
      accent: '#bfdbfe',
    },
    {
      label: 'Achievements', value: achievements.length, icon: <Trophy size={20} />,
      href: '/cadet/achievements',
      iconBg: '#fffbeb', iconColor: '#d97706',
      accent: '#fde68a',
    },
    {
      label: 'Camps', value: camps.length, icon: <Tent size={20} />,
      href: '/cadet/camps',
      iconBg: '#f0fdf4', iconColor: '#16a34a',
      accent: '#bbf7d0',
    },
    {
      label: 'Eval Score', value: avgEvalScore ? `${avgEvalScore}%` : '—', icon: <TrendingUp size={20} />,
      href: '#',
      iconBg: '#faf5ff', iconColor: '#7c3aed',
      accent: '#e9d5ff',
    },
  ];

  const evalItems = latestEval ? [
    { label: 'Discipline',     val: latestEval.discipline },
    { label: 'Leadership',     val: latestEval.leadership },
    { label: 'Drill',          val: latestEval.drill },
    { label: 'Attendance',     val: latestEval.attendance },
    { label: 'Physical Fitness', val: latestEval.physicalFitness },
    { label: 'Communication',  val: latestEval.communication },
  ] : [];

  return (
    <AppShell>
      {/* ── Page Header ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            {getGreeting()},
          </p>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 30, fontWeight: 700, color: 'var(--text-heading)',
            letterSpacing: '0.3px', marginBottom: 4,
          }}>
            {userProfile?.displayName?.split(' ')[0] || 'Cadet'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {profile?.college ? `${profile.college}` : 'Welcome to your NCC portal'}
          </p>
        </div>

        {/* Branch + profile pill */}
        {profile && branchInfo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 12, padding: '10px 16px',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <div style={{
              background: branchInfo.bg, color: branchInfo.color,
              borderRadius: 8, padding: '4px 10px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
            }}>
              {branchInfo.label}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>Sem {profile.semester}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{profile.rollNumber || 'No Roll No.'}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Profile Incomplete Alert ── */}
      {!profile?.profileComplete && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertCircle size={18} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, color: 'var(--warning)', fontSize: 14 }}>Profile Incomplete</p>
            <p style={{ color: '#92400e', fontSize: 13, marginTop: 2 }}>
              Complete your profile to appear in camp recommendations and evaluations.
            </p>
          </div>
          <Link href="/cadet/profile">
            <button className="btn-primary" style={{ fontSize: 13, padding: '8px 16px', whiteSpace: 'nowrap' }}>
              Complete Now
            </button>
          </Link>
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ borderTop: `3px solid ${stat.accent}` }}>
              <div className="stat-icon" style={{ background: stat.iconBg, color: stat.iconColor }}>
                {stat.icon}
              </div>
              <div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20 }}>

        {/* ── Latest Evaluation ── */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={17} color="#2563eb" />
              </div>
              <h3>Latest Evaluation</h3>
            </div>
            {latestEval && (
              <span className="badge badge-blue">Sem {latestEval.semester} / {latestEval.year}</span>
            )}
          </div>

          {latestEval ? (
            <>
              {/* Overall score */}
              <div style={{
                background: 'var(--bg-primary)', borderRadius: 10,
                padding: '14px 18px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Overall Score</p>
                  <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--navy-600)', fontFamily: "'Rajdhani', sans-serif", lineHeight: 1.1 }}>
                    {avgEvalScore}%
                  </p>
                </div>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: `conic-gradient(var(--navy-500) ${(avgEvalScore ?? 0) * 3.6}deg, var(--bg-secondary) 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--surface-0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={20} color="var(--navy-600)" />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {evalItems.map((item) => {
                  const pct = (item.val / 5) * 100;
                  const color = item.val >= 4 ? 'var(--success)' : item.val >= 3 ? 'var(--warning)' : 'var(--danger)';
                  return (
                    <div key={item.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color }}>{item.val}/5</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <Medal size={44} style={{ marginBottom: 12, opacity: 0.25 }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No Evaluations Yet</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Your ANO will evaluate you each semester</p>
            </div>
          )}
        </div>

        {/* ── Right Column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Zap size={17} color="#7c3aed" />
                </div>
                <h3>Quick Actions</h3>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { href: '/cadet/achievements', icon: <Trophy size={16} />, label: 'Add Achievement', iconBg: '#fffbeb', iconColor: '#d97706' },
                { href: '/cadet/camps', icon: <Tent size={16} />, label: 'Log a Camp', iconBg: '#f0fdf4', iconColor: '#16a34a' },
                { href: '/cadet/skills', icon: <Star size={16} />, label: 'Update Skills', iconBg: '#eff6ff', iconColor: '#2563eb' },
                { href: '/cadet/profile', icon: <User size={16} />, label: 'Edit Profile', iconBg: '#f5f3ff', iconColor: '#7c3aed' },
                { href: '/cadet/availability', icon: <Calendar size={16} />, label: 'Set Availability', iconBg: '#fff7ed', iconColor: '#c2410c' },
              ].map((action) => (
                <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
                  <div className="action-card">
                    <div className="action-icon" style={{ background: action.iconBg, color: action.iconColor }}>
                      {action.icon}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-heading)', flex: 1 }}>
                      {action.label}
                    </span>
                    <ArrowRight size={14} color="var(--text-muted)" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Camps */}
          {camps.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award size={17} color="#16a34a" />
                  </div>
                  <h3>Recent Camps</h3>
                </div>
                <Link href="/cadet/camps" style={{ fontSize: 12, color: 'var(--navy-500)', fontWeight: 600, textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {camps.slice(0, 3).map((camp, i) => {
                  const gradeColor = camp.grade === 'A' ? '#16a34a' : camp.grade === 'B' ? '#d97706' : '#64748b';
                  return (
                    <div key={camp.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 0',
                      borderBottom: i < Math.min(camps.length, 3) - 1 ? '1px solid var(--border-light)' : 'none',
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Tent size={16} color="#16a34a" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{camp.campType}</p>
                        <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{camp.year} · {camp.location}</p>
                      </div>
                      <span style={{
                        background: `${gradeColor}15`, color: gradeColor,
                        border: `1px solid ${gradeColor}33`,
                        borderRadius: 6, padding: '3px 9px',
                        fontSize: 12, fontWeight: 700
                      }}>
                        Grade {camp.grade}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
