'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import {
  getCadetProfile,
  getCadetSkills,
  getCadetAchievements,
  getCampHistory,
  getCadetEvaluations,
  getCadetAttendance,
} from '@/lib/db';
import { calculateAttendancePct, calculateCertEligibility } from '@/lib/eligibility';
import type { CadetProfile, Skill, Achievement, CampRecord, SemesterEvaluation, AttendanceRecord } from '@/types';
import {
  Award, Star, Tent, Trophy, Calendar, TrendingUp,
  CheckCircle, XCircle, Shield, Target, Zap, Medal,
  ChevronRight, AlertCircle, BarChart2,
} from 'lucide-react';
import Link from 'next/link';

// ─── Score calculation ────────────────────────────────────────────────────────

function calcScore(
  skills: Skill[],
  achievements: Achievement[],
  camps: CampRecord[],
  evaluations: SemesterEvaluation[],
  attendancePct: number
): { total: number; breakdown: Record<string, { score: number; max: number; label: string }> } {
  // Attendance: 25 pts
  const attScore = Math.round((Math.min(attendancePct, 100) / 100) * 25);

  // Evaluations: 30 pts (latest avg)
  const latestEval = evaluations[0];
  const evalFields: (keyof SemesterEvaluation)[] = [
    'discipline', 'leadership', 'drill', 'attendance',
    'initiative', 'physicalFitness', 'teamwork', 'communication',
  ];
  let evalScore = 0;
  if (latestEval) {
    const avg = evalFields.reduce((s, f) => s + ((latestEval[f] as number) || 0), 0) / evalFields.length;
    evalScore = Math.round((avg / 5) * 30);
  }

  // Skills: 20 pts (verified ones count more)
  const verifiedSkills = skills.filter(s => s.verificationStatus === 'verified').length;
  const totalSkills = skills.length;
  const skillScore = Math.min(
    Math.round((verifiedSkills * 1.5 + totalSkills * 0.5) * 1.5),
    20
  );

  // Camps: 15 pts
  const verifiedCamps = camps.filter(c => c.verificationStatus === 'verified').length;
  const campScore = Math.min(verifiedCamps * 5, 15);

  // Achievements: 10 pts
  const verifiedAch = achievements.filter(a => a.verificationStatus === 'verified').length;
  const achScore = Math.min(verifiedAch * 3, 10);

  const total = attScore + evalScore + skillScore + campScore + achScore;

  return {
    total,
    breakdown: {
      attendance: { score: attScore, max: 25, label: 'Attendance' },
      evaluation: { score: evalScore, max: 30, label: 'ANO Evaluation' },
      skills:     { score: skillScore, max: 20, label: 'Skills' },
      camps:      { score: campScore, max: 15, label: 'Camps' },
      achievements: { score: achScore, max: 10, label: 'Achievements' },
    },
  };
}

function getRank(score: number) {
  if (score >= 90) return { label: 'Outstanding', color: '#15803d', bg: '#f0fdf4', badge: '🏅' };
  if (score >= 75) return { label: 'Excellent',    color: '#2563eb', bg: '#eff6ff', badge: '⭐' };
  if (score >= 60) return { label: 'Good',         color: '#d97706', bg: '#fffbeb', badge: '🎖️' };
  if (score >= 40) return { label: 'Average',      color: '#9333ea', bg: '#faf5ff', badge: '📋' };
  return                  { label: 'Developing',   color: '#6b7280', bg: '#f9fafb', badge: '📈' };
}

// ─── Sub-components (must stay outside for React identity stability) ──────────

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const rank = getRank(score);

  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="var(--border-light)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={radius} fill="none"
          stroke={rank.color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 30, fontWeight: 900, color: rank.color, fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>/ 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = (score / max) * 100;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}/{max}</span>
      </div>
      <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 99,
          background: `linear-gradient(90deg, ${color}, ${color}bb)`,
          transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

function CertCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
      borderRadius: 10, border: `1.5px solid ${ok ? '#bbf7d0' : 'var(--border-light)'}`,
      background: ok ? '#f0fdf4' : 'var(--bg-secondary)',
    }}>
      {ok
        ? <CheckCircle size={16} color="#15803d" />
        : <XCircle size={16} color="var(--text-muted)" />}
      <span style={{ fontSize: 13, fontWeight: 600, color: ok ? '#15803d' : 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScorecardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CadetProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [camps, setCamps] = useState<CampRecord[]>([]);
  const [evaluations, setEvaluations] = useState<SemesterEvaluation[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getCadetProfile(user.uid),
      getCadetSkills(user.uid),
      getCadetAchievements(user.uid).catch(() => []),
      getCampHistory(user.uid).catch(() => []),
      getCadetEvaluations(user.uid).catch(() => []),
      getCadetAttendance(user.uid).catch(() => []),
    ]).then(([p, s, a, c, ev, att]) => {
      setProfile(p);
      setSkills(s);
      setAchievements(a as Achievement[]);
      setCamps(c);
      setEvaluations(ev);
      setAttendance(att);
    }).finally(() => setLoading(false));
  }, [user]);

  const attendancePct = calculateAttendancePct(attendance);
  const eligibility = profile ? calculateCertEligibility(profile, camps, attendancePct) : null;
  const latestEval = evaluations[0];
  const { total: score, breakdown } = loading
    ? { total: 0, breakdown: {} as any }
    : calcScore(skills, achievements, camps, evaluations, attendancePct);

  const rank = getRank(score);

  const COLORS = {
    attendance:   '#2563eb',
    evaluation:   '#7c3aed',
    skills:       '#d97706',
    camps:        '#15803d',
    achievements: '#db2777',
  };

  const evalFields: { key: keyof SemesterEvaluation; label: string }[] = [
    { key: 'discipline',     label: 'Discipline' },
    { key: 'leadership',     label: 'Leadership' },
    { key: 'drill',          label: 'Drill' },
    { key: 'attendance',     label: 'Attendance' },
    { key: 'initiative',     label: 'Initiative' },
    { key: 'physicalFitness',label: 'Physical Fitness' },
    { key: 'teamwork',       label: 'Teamwork' },
    { key: 'communication',  label: 'Communication' },
  ];

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)}
        </div>
        <div className="skeleton" style={{ height: 300 }} />
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif", fontSize: 28,
          fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '0.3px',
        }}>
          My Scorecard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Your NCC performance at a glance — updated live from your records
        </p>
      </div>

      {/* ── Hero: Overall Score ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 24,
        display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: 'var(--shadow-xl)',
      }}>
        <ScoreRing score={score} />

        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.1)', borderRadius: 99,
            padding: '4px 14px', marginBottom: 12,
          }}>
            <span style={{ fontSize: 18 }}>{rank.badge}</span>
            <span style={{ color: 'var(--gold-300)', fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>
              {rank.label}
            </span>
          </div>
          <h2 style={{
            color: '#fff', fontSize: 22, fontWeight: 800,
            fontFamily: 'Rajdhani, sans-serif', marginBottom: 6,
          }}>
            {profile?.firstName || 'Cadet'} {profile?.lastName || ''}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, marginBottom: 16 }}>
            {profile?.nccRank || 'CDT'} · {profile?.branch || '—'} · Sem {profile?.semester || '—'}
          </p>

          {/* Mini stat pills */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: '📊', label: `${attendancePct}% Attendance` },
              { icon: '⭐', label: `${skills.filter(s => s.verificationStatus === 'verified').length} Skills` },
              { icon: '🏕️', label: `${camps.filter(c => c.verificationStatus === 'verified').length} Camps` },
              { icon: '🏆', label: `${achievements.filter(a => a.verificationStatus === 'verified').length} Achievements` },
            ].map(pill => (
              <div key={pill.label} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.1)', borderRadius: 99,
                padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#fff',
              }}>
                <span>{pill.icon}</span> {pill.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Score Breakdown ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* Breakdown bars */}
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--navy-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={18} color="var(--navy-600)" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>Score Breakdown</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {Object.entries(breakdown).map(([key, { score: s, max, label }]) => (
              <BreakdownBar
                key={key}
                label={label}
                score={s}
                max={max}
                color={COLORS[key as keyof typeof COLORS]}
              />
            ))}
          </div>
        </div>

        {/* Certificate Eligibility */}
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={18} color="#d97706" />
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>Certificate Eligibility</h3>
          </div>

          {eligibility ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Cert A */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Certificate A
                </div>
                <CertCheck ok={!!profile?.certA} label={profile?.certA ? 'Obtained ✓' : 'Not yet obtained'} />
              </div>

              {/* Cert B */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Certificate B
                </div>
                <CertCheck ok={!!profile?.certB} label={profile?.certB ? 'Obtained ✓' : `${eligibility.certB.eligible ? 'Eligible — not yet taken' : 'Not yet eligible'}`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                  <CertCheck ok={eligibility.certB.checks.certADone}      label="Cert A done" />
                  <CertCheck ok={eligibility.certB.checks.attendanceOk}   label={`≥75% Attendance (${attendancePct}%)`} />
                  <CertCheck ok={eligibility.certB.checks.catcDone}        label="CATC / ATC completed" />
                  <CertCheck ok={eligibility.certB.checks.secondYear}      label="2nd year or above" />
                </div>
              </div>

              {/* Cert C */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
                  Certificate C
                </div>
                <CertCheck ok={!!profile?.certC} label={profile?.certC ? 'Obtained ✓' : `${eligibility.certC.eligible ? 'Eligible — not yet taken' : 'Not yet eligible'}`} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                  <CertCheck ok={eligibility.certC.checks.certBDone}          label="Cert B done" />
                  <CertCheck ok={eligibility.certC.checks.attendanceOk}       label={`≥75% Attendance (${attendancePct}%)`} />
                  <CertCheck ok={eligibility.certC.checks.atcDone}            label="ATC / CATC completed" />
                  <CertCheck ok={eligibility.certC.checks.additionalCampDone} label="NIC / RDC / other camp" />
                  <CertCheck ok={eligibility.certC.checks.thirdYear}          label="3rd year or above" />
                </div>
              </div>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Complete your profile to see eligibility.</p>
          )}
        </div>
      </div>

      {/* ── Latest Evaluation Detail ── */}
      {latestEval && (
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={18} color="#7c3aed" />
              </div>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>ANO Evaluation</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Semester {latestEval.semester} · {latestEval.year}</p>
              </div>
            </div>
            <div style={{
              fontSize: 28, fontWeight: 900, color: '#7c3aed',
              fontFamily: 'Rajdhani, sans-serif',
            }}>
              {Math.round(
                (evalFields.reduce((s, f) => s + ((latestEval[f.key] as number) || 0), 0) / evalFields.length / 5) * 100
              )}%
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {evalFields.map(({ key, label }) => {
              const val = (latestEval[key] as number) || 0;
              const pct = (val / 5) * 100;
              const color = val >= 4 ? '#15803d' : val >= 3 ? '#d97706' : '#dc2626';
              return (
                <div key={key} style={{
                  textAlign: 'center', padding: '14px 10px',
                  background: 'var(--bg-secondary)', borderRadius: 10,
                  borderBottom: `3px solid ${color}`,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'Rajdhani, sans-serif' }}>
                    {val}<span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/5</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
                  <div style={{ marginTop: 6, height: 4, borderRadius: 99, background: 'var(--border-light)' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
                  </div>
                </div>
              );
            })}
          </div>
          {latestEval.remarks && (
            <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--bg-primary)', borderRadius: 10, fontSize: 13, color: 'var(--text-body)', fontStyle: 'italic' }}>
              <strong style={{ fontStyle: 'normal' }}>Remarks:</strong> {latestEval.remarks}
            </div>
          )}
        </div>
      )}

      {/* ── Bottom cards row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 24 }}>

        {/* Attendance */}
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Calendar size={16} color="#2563eb" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>Attendance</span>
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: attendancePct >= 75 ? '#15803d' : '#dc2626', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
            {attendancePct}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 12 }}>
            {attendance.filter(r => r.status === 'present' || r.status === 'on_duty').length} present / {attendance.length} total
          </div>
          <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${attendancePct}%`, borderRadius: 99,
              background: `linear-gradient(90deg, ${attendancePct >= 75 ? '#16a34a' : '#dc2626'}, ${attendancePct >= 75 ? '#4ade80' : '#f87171'})`,
            }} />
          </div>
          <p style={{ fontSize: 11, color: attendancePct >= 75 ? '#15803d' : '#dc2626', marginTop: 8, fontWeight: 600 }}>
            {attendancePct >= 75 ? '✓ Meets minimum requirement' : '✗ Below 75% minimum'}
          </p>
          <Link href="/cadet/attendance" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, color: 'var(--navy-600)', fontWeight: 600, textDecoration: 'none' }}>
            View details <ChevronRight size={13} />
          </Link>
        </div>

        {/* Skills */}
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Star size={16} color="#d97706" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>Skills</span>
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, color: 'var(--text-heading)', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
            {skills.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, marginBottom: 12 }}>
            {skills.filter(s => s.verificationStatus === 'verified').length} verified · {skills.filter(s => s.verificationStatus === 'pending').length} pending
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
            {skills.slice(0, 5).map(s => (
              <span key={s.id} style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: s.verificationStatus === 'verified' ? '#f0fdf4' : 'var(--bg-secondary)',
                color: s.verificationStatus === 'verified' ? '#15803d' : 'var(--text-muted)',
                border: `1px solid ${s.verificationStatus === 'verified' ? '#bbf7d0' : 'var(--border-light)'}`,
              }}>
                {s.name}
              </span>
            ))}
            {skills.length > 5 && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                +{skills.length - 5} more
              </span>
            )}
          </div>
          <Link href="/cadet/skills" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--navy-600)', fontWeight: 600, textDecoration: 'none' }}>
            Manage skills <ChevronRight size={13} />
          </Link>
        </div>

        {/* Camps & Achievements */}
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 16, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Tent size={16} color="#15803d" />
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>Camps & Achievements</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#15803d', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>{camps.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Camps</div>
            </div>
            <div style={{ width: 1, background: 'var(--border-light)' }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#db2777', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>{achievements.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Achievements</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
            {camps.slice(0, 2).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-body)' }}>
                <span>{c.campType} · {c.year}</span>
                <span style={{
                  padding: '1px 7px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                  background: c.verificationStatus === 'verified' ? '#f0fdf4' : 'var(--bg-secondary)',
                  color: c.verificationStatus === 'verified' ? '#15803d' : 'var(--text-muted)',
                }}>Grade {c.grade}</span>
              </div>
            ))}
          </div>
          <Link href="/cadet/camps" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--navy-600)', fontWeight: 600, textDecoration: 'none' }}>
            View all camps <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Empty state if everything is zero ── */}
      {!loading && skills.length === 0 && camps.length === 0 && achievements.length === 0 && evaluations.length === 0 && (
        <div style={{
          background: 'var(--surface-0)', border: '1px solid var(--border-light)',
          borderRadius: 16, padding: '48px 24px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>
            Your scorecard is empty
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Start adding skills, camps, and achievements to build your NCC score
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/cadet/skills">
              <button style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--navy-600)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Add Skills
              </button>
            </Link>
            <Link href="/cadet/camps">
              <button style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border-light)', background: 'var(--surface-0)', color: 'var(--text-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Log Camps
              </button>
            </Link>
            <Link href="/cadet/achievements">
              <button style={{ padding: '10px 20px', borderRadius: 10, border: '1.5px solid var(--border-light)', background: 'var(--surface-0)', color: 'var(--text-body)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Add Achievements
              </button>
            </Link>
          </div>
        </div>
      )}
    </AppShell>
  );
}
