'use client';

import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Archive, Award, Users, FileText, ChevronRight } from 'lucide-react';

export default function AlumniDashboardPage() {
  const { userProfile } = useAuth();

  return (
    <AppShell requiredRole={['alumni', 'admin']}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)', marginBottom: 4 }}>
            Welcome back, {userProfile?.displayName?.split(' ')[0] || 'Alumnus'}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            Your legacy with NCC TCET continues. Explore your history and stay connected.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
          {/* My History Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, background: 'var(--info-bg)', borderRadius: 12 }}>
                <Archive size={24} color="var(--info)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>My NCC History</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>View your past records and camps</p>
              </div>
            </div>
            <Link href="/cadet/profile" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc' }}>
                View Full Profile <ChevronRight size={16} />
              </button>
            </Link>
          </div>

          {/* Certificates Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, background: 'var(--warning-bg)', borderRadius: 12 }}>
                <Award size={24} color="var(--warning)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Certificates & Awards</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Access your achievements</p>
              </div>
            </div>
            <button className="btn-ghost" disabled style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', opacity: 0.6 }}>
              Coming Soon <ChevronRight size={16} />
            </button>
          </div>

          {/* Alumni Network Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, background: 'var(--success-bg)', borderRadius: 12 }}>
                <Users size={24} color="var(--success)" />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>Alumni Network</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Connect with former cadets</p>
              </div>
            </div>
            <button className="btn-ghost" disabled style={{ width: '100%', justifyContent: 'space-between', padding: '12px 16px', background: '#f8fafc', opacity: 0.6 }}>
              Coming Soon <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Feature Spotlight */}
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--navy-600) 0%, var(--navy-800) 100%)', color: '#fff', border: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
            <div style={{ padding: 16, background: 'rgba(255,255,255,0.1)', borderRadius: 16 }}>
              <FileText size={32} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#fff' }}>Alumni Documentation Portal</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, lineHeight: 1.6, marginBottom: 16, maxWidth: 600 }}>
                We are building a dedicated portal for alumni to request official transcripts, verify their service records for employment, and stay updated with the latest NCC TCET news.
              </p>
              <div style={{ display: 'inline-flex', padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>
                IN DEVELOPMENT
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
