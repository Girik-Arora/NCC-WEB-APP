'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTrainingSessions } from '@/lib/db';
import type { TrainingSession, TrainingCategory, Wing } from '@/types';
import {
  BookOpen, Search, Filter, Clock, User,
  Sword, Compass, HeartPulse, Music, Shield,
  Dumbbell, Map, Zap, Brain, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<TrainingCategory, { icon: React.ReactNode; color: string; bg: string }> = {
  'Drill':                   { icon: <Sword size={14} />,       color: '#1d4ed8', bg: '#eff6ff' },
  'Weapon Training':         { icon: <Shield size={14} />,      color: '#dc2626', bg: '#fef2f2' },
  'Map Reading':             { icon: <Map size={14} />,         color: '#15803d', bg: '#f0fdf4' },
  'Leadership':              { icon: <Zap size={14} />,         color: '#d97706', bg: '#fffbeb' },
  'Personality Development': { icon: <Brain size={14} />,       color: '#7c3aed', bg: '#faf5ff' },
  'PT & Sports':             { icon: <Dumbbell size={14} />,    color: '#0891b2', bg: '#ecfeff' },
  'First Aid':               { icon: <HeartPulse size={14} />,  color: '#be185d', bg: '#fdf2f8' },
  'Navigation':              { icon: <Compass size={14} />,     color: '#065f46', bg: '#ecfdf5' },
  'Firing':                  { icon: <Shield size={14} />,      color: '#9a3412', bg: '#fff7ed' },
  'Cultural':                { icon: <Music size={14} />,       color: '#6d28d9', bg: '#f5f3ff' },
  'Defence Awareness':       { icon: <Shield size={14} />,      color: '#374151', bg: '#f9fafb' },
  'Other':                   { icon: <BookOpen size={14} />,    color: '#64748b', bg: '#f8fafc' },
};

const ALL_CATEGORIES: TrainingCategory[] = [
  'Drill', 'Weapon Training', 'Map Reading', 'Leadership',
  'Personality Development', 'PT & Sports', 'First Aid',
  'Navigation', 'Firing', 'Cultural', 'Defence Awareness', 'Other',
];

// ─── Sub-components (outside page fn to prevent focus loss) ──────────────────

function CategoryBadge({ category }: { category: TrainingCategory }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['Other'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: cfg.bg, color: cfg.color,
      border: `1px solid ${cfg.color}22`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {category}
    </span>
  );
}

function SessionCard({ session, expanded, onToggle }: {
  session: TrainingSession;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = CATEGORY_CONFIG[session.category] || CATEGORY_CONFIG['Other'];
  return (
    <div
      style={{
        background: 'var(--surface-0)',
        border: `1px solid ${expanded ? cfg.color + '44' : 'var(--border-light)'}`,
        borderLeft: `3px solid ${cfg.color}`,
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Header row */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', textAlign: 'left',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 9, flexShrink: 0,
          background: cfg.bg, color: cfg.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {cfg.icon}
        </div>

        {/* Main info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 2 }}>
            {session.subject}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
              📅 {session.date}
            </span>
            {session.trainer && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                · 👤 {session.trainer}
              </span>
            )}
            <CategoryBadge category={session.category} />
          </div>
        </div>

        {/* Periods pill */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'var(--bg-secondary)', borderRadius: 8,
          padding: '6px 12px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', lineHeight: 1 }}>
            {session.periods}
          </span>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginTop: 1 }}>
            {session.periods === 1 ? 'period' : 'periods'}
          </span>
        </div>

        {/* Chevron */}
        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 18px 16px 18px',
          borderTop: '1px solid var(--border-light)',
          paddingTop: 14,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {session.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>
                  Description
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>
                  {session.description}
                </p>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Wing</div>
              <div style={{ fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>{session.wing}</div>
            </div>
            {session.year && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Academic Year</div>
                <div style={{ fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>{session.year}</div>
              </div>
            )}
            {session.documentUrl && (
              <div style={{ gridColumn: '1 / -1' }}>
                <a
                  href={session.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 600, color: 'var(--navy-600)',
                    textDecoration: 'none', padding: '5px 12px',
                    background: 'var(--bg-secondary)', borderRadius: 7,
                    border: '1px solid var(--border-light)',
                  }}
                >
                  📄 View Document
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CadetTrainingPage() {
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TrainingCategory | 'All'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getAllTrainingSessions()
      .then((all) => {
        // Filter to cadet's wing + 'All' wing sessions
        const wing = userProfile?.branch;
        const filtered = wing
          ? all.filter(s => s.wing === wing || s.wing === 'All')
          : all;
        setSessions(filtered);
      })
      .finally(() => setLoading(false));
  }, [userProfile]);

  const filtered = useMemo(() => {
    let res = sessions;
    if (categoryFilter !== 'All') res = res.filter(s => s.category === categoryFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(s =>
        s.subject.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.trainer?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q)
      );
    }
    return res;
  }, [sessions, search, categoryFilter]);

  // Stats
  const totalPeriods = sessions.reduce((s, t) => s + (t.periods || 0), 0);
  const categoryCounts = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

  // Group by year/month for timeline display
  const grouped = useMemo(() => {
    const map: Record<string, TrainingSession[]> = {};
    filtered.forEach(s => {
      const key = s.date ? s.date.slice(0, 7) : 'Unknown'; // YYYY-MM
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  function formatMonth(key: string) {
    if (key === 'Unknown') return 'Unknown Date';
    const [y, m] = key.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 28,
            fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '0.3px',
          }}>
            Training Record
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            All NCC training sessions your wing has attended
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Sessions', value: loading ? '—' : sessions.length, color: 'var(--navy-600)' },
            { label: 'Total Periods', value: loading ? '—' : totalPeriods, color: '#7c3aed' },
            { label: 'Categories', value: loading ? '—' : Object.keys(categoryCounts).length, color: '#d97706' },
            { label: 'Top Category', value: loading ? '—' : topCategory, color: '#15803d', small: true },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface-0)', border: '1px solid var(--border-light)',
              borderRadius: 12, padding: '16px 18px', textAlign: 'center',
            }}>
              <div style={{
                fontSize: s.small ? 14 : 26, fontWeight: 800, color: s.color,
                fontFamily: s.small ? 'inherit' : 'Rajdhani, sans-serif',
                lineHeight: s.small ? 1.3 : 1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Category breakdown chart */}
        {!loading && sessions.length > 0 && (
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 14, padding: 20, marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>
              Training by Category
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([cat, count]) => {
                  const cfg = CATEGORY_CONFIG[cat as TrainingCategory] || CATEGORY_CONFIG['Other'];
                  const pct = Math.round((count / sessions.length) * 100);
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-body)', fontWeight: 500 }}>{cat}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{count} sessions · {pct}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 99, background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${pct}%`, borderRadius: 99,
                          background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}99)`,
                          transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                        }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions, topics, trainers..."
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 14,
                height: 40, border: '1.5px solid var(--border-light)',
                borderRadius: 10, fontSize: 13, background: 'var(--surface-0)',
                outline: 'none', color: 'var(--text-body)', boxSizing: 'border-box',
              }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value as any)}
            style={{
              height: 40, padding: '0 14px', borderRadius: 10, fontSize: 13,
              border: '1.5px solid var(--border-light)', background: 'var(--surface-0)',
              color: 'var(--text-body)', cursor: 'pointer',
            }}
          >
            <option value="All">All Categories</option>
            {ALL_CATEGORIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Results info */}
        {!loading && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, fontWeight: 500 }}>
            Showing {filtered.length} of {sessions.length} sessions
            {(search || categoryFilter !== 'All') && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter('All'); }}
                style={{ marginLeft: 10, background: 'none', border: 'none', color: 'var(--navy-600)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Sessions list — grouped by month */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 16, padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>
              {sessions.length === 0 ? 'No training sessions recorded yet' : 'No sessions match your filters'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {sessions.length === 0
                ? 'Training sessions logged by your ANO will appear here'
                : 'Try adjusting your search or category filter'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {grouped.map(([monthKey, monthSessions]) => (
              <div key={monthKey}>
                {/* Month heading */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12,
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    {formatMonth(monthKey)}
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 99,
                  }}>
                    {monthSessions.length} sessions · {monthSessions.reduce((s, t) => s + t.periods, 0)} periods
                  </div>
                </div>

                {/* Session cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {monthSessions.map(session => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      expanded={expandedId === session.id}
                      onToggle={() => setExpandedId(prev => prev === session.id ? null : session.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
