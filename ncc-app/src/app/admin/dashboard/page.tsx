'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllUsers, getAllCadets, getAllSkillsAdmin, getAllAchievementsAdmin, getAllCampsAdmin, getAllEvaluations } from '@/lib/db';
import { Users, Shield, Star, Trophy, Tent, ClipboardList, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    users: 0,
    cadets: 0,
    skills: 0,
    achievements: 0,
    camps: 0,
    evaluations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [users, cadets, skills, achievements, camps, evaluations] = await Promise.all([
          getAllUsers(),
          getAllCadets(),
          getAllSkillsAdmin(),
          getAllAchievementsAdmin(),
          getAllCampsAdmin(),
          getAllEvaluations(),
        ]);
        setStats({
          users: users.length,
          cadets: cadets.length,
          skills: skills.reduce((acc, curr) => acc + curr.skills.length, 0),
          achievements: achievements.length,
          camps: camps.length,
          evaluations: evaluations.length,
        });
      } catch (error) {
        console.error("Failed to load admin stats", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users, icon: <Shield size={20} color="#2563eb" />, bg: '#eff6ff', href: '/admin/users' },
    { label: 'Total Cadets', value: stats.cadets, icon: <Users size={20} color="#16a34a" />, bg: '#f0fdf4', href: '/admin/cadets' },
    { label: 'Skills Logged', value: stats.skills, icon: <Star size={20} color="#d97706" />, bg: '#fffbeb', href: '/admin/skills' },
    { label: 'Achievements', value: stats.achievements, icon: <Trophy size={20} color="#9333ea" />, bg: '#faf5ff', href: '/admin/achievements' },
    { label: 'Camps Attended', value: stats.camps, icon: <Tent size={20} color="#0891b2" />, bg: '#ecfeff', href: '/admin/camps' },
    { label: 'Evaluations', value: stats.evaluations, icon: <ClipboardList size={20} color="#ea580c" />, bg: '#fff7ed', href: '/admin/evaluations' },
  ];

  if (loading) {
    return (
      <AppShell requiredRole="admin">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={{ height: 120, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell requiredRole="admin">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={28} color="#2563eb" /> System Dashboard
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Overview of the entire NCC TCET system.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {statCards.map((s) => (
          <Link href={s.href} key={s.label} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.2s', height: '100%' }} onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                {s.icon}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
