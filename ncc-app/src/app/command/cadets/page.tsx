'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCadets } from '@/lib/db';
import type { CadetProfile, Wing } from '@/types';
import { ROLE_LABELS } from '@/types';
import { Users, Search, Filter, ChevronRight, AlertCircle, Shield, Anchor, Wind } from 'lucide-react';
import Link from 'next/link';

const WING_ICONS: Record<string, React.ReactNode> = {
  'Army': <Shield size={14} />,
  'Navy': <Anchor size={14} />,
  'Air Force': <Wind size={14} />,
};

const LIFECYCLE_COLORS: Record<string, string> = {
  active: '#15803d',
  enrolled: '#0369a1',
  certified_b: '#7c3aed',
  certified_c: '#d97706',
  discharged: '#6b7280',
  alumni: '#9ca3af',
};

export default function CommandCadetsPage() {
  const { userProfile } = useAuth();
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [wingFilter, setWingFilter] = useState<Wing | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    getAllCadets().then(setCadets).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let res = cadets;
    if (wingFilter !== 'All') res = res.filter(c => c.branch === wingFilter);
    if (statusFilter !== 'All') res = res.filter(c => (c.lifecycleStatus || 'active') === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(c =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.rollNumber?.toLowerCase().includes(q) ||
        c.regimentalNumber?.toLowerCase().includes(q) ||
        c.nccRank?.toLowerCase().includes(q)
      );
    }
    return res;
  }, [cadets, search, wingFilter, statusFilter]);

  const armyCount = cadets.filter(c => c.branch === 'Army').length;
  const navyCount = cadets.filter(c => c.branch === 'Navy').length;
  const afCount   = cadets.filter(c => c.branch === 'Air Force').length;

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk', 'mod_cadet']}>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'Rajdhani, sans-serif' }}>
              Cadet Roster
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
              {cadets.length} cadets · Army {armyCount} · Navy {navyCount} · Air Force {afCount}
            </p>
          </div>
        </div>

        {/* Wing Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {(['All', 'Army', 'Navy', 'Air Force'] as const).map(w => (
            <button
              key={w}
              onClick={() => setWingFilter(w as any)}
              style={{
                padding: '7px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                border: '1.5px solid',
                borderColor: wingFilter === w ? 'var(--navy-600)' : 'var(--border-light)',
                background: wingFilter === w ? 'var(--navy-600)' : 'var(--surface-0)',
                color: wingFilter === w ? '#fff' : 'var(--text-body)',
                cursor: 'pointer', transition: 'var(--transition-fast)',
                display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {WING_ICONS[w] || null} {w === 'All' ? `All Wings (${cadets.length})` : `${w} (${w === 'Army' ? armyCount : w === 'Navy' ? navyCount : afCount})`}
            </button>
          ))}
        </div>

        {/* Filters Row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, roll no, regimental no, rank..."
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 14,
                height: 40, border: '1.5px solid var(--border-light)',
                borderRadius: 10, fontSize: 13, background: 'var(--surface-0)',
                outline: 'none', color: 'var(--text-body)', boxSizing: 'border-box',
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13,
              border: '1.5px solid var(--border-light)', background: 'var(--surface-0)',
              color: 'var(--text-body)', cursor: 'pointer',
            }}
          >
            <option value="All">All Status</option>
            <option value="applicant">Applicant</option>
            <option value="selected">Selected</option>
            <option value="enrolled">Enrolled</option>
            <option value="active">Active</option>
            <option value="certified_b">Cert B</option>
            <option value="certified_c">Cert C</option>
            <option value="discharged">Discharged</option>
            <option value="alumni">Alumni</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading cadets...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <AlertCircle size={32} color="var(--text-muted)" style={{ marginBottom: 10 }} />
            <p style={{ color: 'var(--text-muted)' }}>No cadets found matching your filters</p>
          </div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                    {['Name', 'Roll No', 'Wing', 'Rank', 'Semester', 'Status', 'Profile'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '12px 16px', fontSize: 11,
                        fontWeight: 700, color: 'var(--text-secondary)',
                        letterSpacing: 0.8, textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cadet, idx) => {
                    const status = cadet.lifecycleStatus || 'active';
                    const statusColor = LIFECYCLE_COLORS[status] || '#6b7280';
                    return (
                      <tr key={cadet.uid} style={{
                        borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-light)' : 'none',
                        transition: 'background 0.12s',
                      }}
                        className="table-row-hover"
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-heading)' }}>
                            {cadet.firstName} {cadet.lastName}
                          </div>
                          {cadet.regimentalNumber && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Regt: {cadet.regimentalNumber}</div>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>
                          {cadet.rollNumber || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: cadet.branch === 'Army' ? '#15803d20' : cadet.branch === 'Navy' ? '#0369a120' : '#7c3aed20',
                            color: cadet.branch === 'Army' ? '#15803d' : cadet.branch === 'Navy' ? '#0369a1' : '#7c3aed',
                          }}>
                            {WING_ICONS[cadet.branch]} {cadet.branch}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>
                          {cadet.nccRank || 'CDT'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)', textAlign: 'center' }}>
                          {cadet.semester || '—'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: `${statusColor}18`, color: statusColor,
                            textTransform: 'capitalize',
                          }}>
                            {status.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <Link href={`/command/cadets/${cadet.uid}`} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 12, color: 'var(--navy-600)', fontWeight: 600,
                            textDecoration: 'none',
                          }}>
                            Dossier <ChevronRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {filtered.length} of {cadets.length} cadets
            </div>
          </div>
        )}
      </div>
      <style>{`.table-row-hover:hover { background: var(--bg-secondary); }`}</style>
    </AppShell>
  );
}
