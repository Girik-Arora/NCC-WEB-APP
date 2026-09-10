'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getCadetsByWing, getEvaluationsByWing, getCadetSkills } from '@/lib/db';
import type { CadetProfile, SemesterEvaluation, Skill, Wing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BarChart2, Users, Star, Tent, TrendingUp } from 'lucide-react';

const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];

export default function AnalyticsPage() {
  const { userProfile } = useAuth();
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [evaluations, setEvaluations] = useState<SemesterEvaluation[]>([]);
  const [allSkills, setAllSkills] = useState<{ uid: string; skills: Skill[] }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const branch = userProfile?.branch as Wing | undefined;
      if (!branch) return;
      const [c, e] = await Promise.all([getCadetsByWing(branch), getEvaluationsByWing(branch)]);
      setCadets(c);
      setEvaluations(e);

      // Fetch skills for all cadets
      const skillsData = await Promise.all(
        c.map(async (cadet) => ({ uid: cadet.uid, skills: await getCadetSkills(cadet.uid) }))
      );
      setAllSkills(skillsData);
      setLoading(false);
    };
    if (userProfile !== null) load();
  }, [userProfile]);

  // Branch distribution
  const branchData = cadets.reduce((acc, c) => {
    const b = c.branch || 'Unknown';
    const existing = acc.find((a) => a.name === b);
    if (existing) existing.value++;
    else acc.push({ name: b, value: 1 });
    return acc;
  }, [] as { name: string; value: number }[]);

  // Average eval scores by field
  const evalFieldAvgs = (() => {
    if (evaluations.length === 0) return [];
    const fields = ['discipline', 'leadership', 'drill', 'attendance', 'initiative', 'physicalFitness', 'teamwork', 'communication'];
    const labels: Record<string, string> = {
      discipline: 'Discipline', leadership: 'Leadership', drill: 'Drill',
      attendance: 'Attendance', initiative: 'Initiative', physicalFitness: 'Physical',
      teamwork: 'Teamwork', communication: 'Comm.',
    };
    return fields.map((f) => ({
      field: labels[f],
      avg: parseFloat((evaluations.reduce((s, e) => s + (e as unknown as Record<string, number>)[f], 0) / evaluations.length).toFixed(2)),
    }));
  })();

  // Top skills across all cadets
  const skillFrequency = allSkills
    .flatMap((s) => s.skills)
    .reduce((acc, s) => {
      acc[s.name] = (acc[s.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const topSkills = Object.entries(skillFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  // Semester distribution
  const semData = cadets.reduce((acc, c) => {
    const s = `Sem ${c.semester || '?'}`;
    const ex = acc.find((a) => a.sem === s);
    if (ex) ex.count++;
    else acc.push({ sem: s, count: 1 });
    return acc;
  }, [] as { sem: string; count: number }[]).sort((a, b) => a.sem.localeCompare(b.sem));

  // Eval score trend (by semester - group latest eval per cadet)
  const evalTrend = (() => {
    const bySem: Record<number, number[]> = {};
    evaluations.forEach((e) => {
      if (!bySem[e.semester]) bySem[e.semester] = [];
      const total = [e.discipline, e.leadership, e.drill, e.attendance, e.initiative, e.physicalFitness, e.teamwork, e.communication]
        .reduce((a, b) => a + b, 0) / 8 * 20;
      bySem[e.semester].push(total);
    });
    return Object.entries(bySem).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([sem, scores]) => ({
      sem: `Sem ${sem}`,
      avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
  })();

  const statCards = [
    { label: 'Total Cadets', value: cadets.length, icon: <Users size={20} color="#2563eb" />, bg: '#eff6ff' },
    { label: 'Evaluations Done', value: evaluations.length, icon: <TrendingUp size={20} color="#16a34a" />, bg: '#f0fdf4' },
    { label: 'Total Skills Logged', value: allSkills.reduce((s, a) => s + a.skills.length, 0), icon: <Star size={20} color="#d97706" />, bg: '#fffbeb' },
    { label: 'Available Cadets', value: cadets.filter((c) => c.availability).length, icon: <Tent size={20} color="#7c3aed" />, bg: '#faf5ff' },
  ];

  if (loading) {
    return (
      <AppShell requiredRole={['ano', 'admin']}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: 300, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
      </AppShell>
    );
  }

  return (
    <AppShell requiredRole={['ano', 'admin']}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
          {userProfile?.branch} Wing Analytics
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Performance trends, skill distribution, and cadet statistics.</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ width: 40, height: 40, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Branch distribution */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Cadets by Branch</h3>
          {branchData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={branchData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}>
                  {branchData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', fontSize: 13 }}>No data yet.</p>}
        </div>

        {/* Semester distribution */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Cadets by Semester</h3>
          {semData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={semData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sem" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} name="Cadets" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', fontSize: 13 }}>No data yet.</p>}
        </div>

        {/* Average evaluation by field */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Average Evaluation Scores</h3>
          {evalFieldAvgs.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={evalFieldAvgs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="field" tick={{ fontSize: 12, fill: '#475569' }} width={70} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
                <Bar dataKey="avg" fill="#1e3a5f" radius={[0, 4, 4, 0]} name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', fontSize: 13 }}>No evaluations yet.</p>}
        </div>

        {/* Eval score trend */}
        <div className="card">
          <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Evaluation Score Trend</h3>
          {evalTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={evalTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="sem" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v) => [`${v}%`, 'Avg Score']} />
                <Line type="monotone" dataKey="avg" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p style={{ color: '#94a3b8', fontSize: 13 }}>Need evaluations across multiple semesters.</p>}
        </div>
      </div>

      {/* Top skills */}
      <div className="card">
        <h3 style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 20 }}>Top Skills Across All Cadets</h3>
        {topSkills.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topSkills}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Bar dataKey="count" name="Cadets" radius={[4, 4, 0, 0]}>
                {topSkills.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <p style={{ color: '#94a3b8', fontSize: 13 }}>No skill data yet.</p>}
      </div>
    </AppShell>
  );
}
