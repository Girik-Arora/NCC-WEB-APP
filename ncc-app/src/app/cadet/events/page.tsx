'use client';

import { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEvents } from '@/lib/db';
import type { NccEvent, EventCategory } from '@/types';
import { MapPin, Search, Users, Calendar, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

// ─── Category config ──────────────────────────────────────────────────────────

const CAT_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  'Republic Day':      { color: '#dc2626', bg: '#fef2f2', emoji: '🇮🇳' },
  'Independence Day':  { color: '#15803d', bg: '#f0fdf4', emoji: '🇮🇳' },
  'NCC Day':           { color: '#0369a1', bg: '#f0f9ff', emoji: '🪖' },
  'Social Service':    { color: '#7c3aed', bg: '#faf5ff', emoji: '🤝' },
  'Tree Plantation':   { color: '#15803d', bg: '#f0fdf4', emoji: '🌱' },
  'Environment':       { color: '#65a30d', bg: '#f7fee7', emoji: '🌿' },
  'Sports':            { color: '#d97706', bg: '#fffbeb', emoji: '⚽' },
  'Cultural':          { color: '#be185d', bg: '#fdf2f8', emoji: '🎭' },
  'Seminar':           { color: '#0891b2', bg: '#ecfeff', emoji: '📢' },
  'Defence Activity':  { color: '#374151', bg: '#f9fafb', emoji: '🛡️' },
  'Blood Donation':    { color: '#dc2626', bg: '#fef2f2', emoji: '🩸' },
  'Cyclothon':         { color: '#0369a1', bg: '#f0f9ff', emoji: '🚴' },
  'Marathon':          { color: '#d97706', bg: '#fffbeb', emoji: '🏃' },
  'Community Service': { color: '#059669', bg: '#ecfdf5', emoji: '🏘️' },
  'Firing Practice':   { color: '#9a3412', bg: '#fff7ed', emoji: '🎯' },
  'Other':             { color: '#6b7280', bg: '#f9fafb', emoji: '📋' },
};

const ALL_CATEGORIES: EventCategory[] = [
  'Republic Day', 'Independence Day', 'NCC Day', 'Social Service', 'Tree Plantation',
  'Environment', 'Sports', 'Cultural', 'Seminar', 'Defence Activity',
  'Blood Donation', 'Cyclothon', 'Marathon', 'Community Service', 'Firing Practice', 'Other',
];

function getCfg(cat: string) {
  return CAT_CONFIG[cat] || CAT_CONFIG['Other'];
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) >= new Date(new Date().toDateString());
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Sub-components (outside page fn) ────────────────────────────────────────

function EventCard({ event, expanded, onToggle }: {
  event: NccEvent;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = getCfg(event.category);
  const upcoming = isUpcoming(event.date);

  return (
    <div style={{
      background: 'var(--surface-0)',
      border: `1px solid ${expanded ? cfg.color + '55' : 'var(--border-light)'}`,
      borderTop: `3px solid ${cfg.color}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      boxShadow: expanded ? `0 4px 20px ${cfg.color}18` : 'none',
    }}>
      {/* Header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: 14,
          padding: '16px 18px', textAlign: 'left',
        }}
      >
        {/* Emoji icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: cfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {cfg.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + upcoming badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 15, fontWeight: 700, color: 'var(--text-heading)',
            }}>
              {event.name}
            </span>
            {upcoming && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a',
              }}>
                UPCOMING
              </span>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={11} /> {formatDate(event.date)}{event.endDate && event.endDate !== event.date ? ` – ${formatDate(event.endDate)}` : ''}
            </span>
            {event.venue && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={11} /> {event.venue}
              </span>
            )}
            {event.participantCount && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Users size={11} /> {event.participantCount} participants
              </span>
            )}
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 99,
              background: cfg.bg, color: cfg.color,
            }}>
              {event.category}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <div style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div style={{
          padding: '0 18px 18px 18px',
          borderTop: '1px solid var(--border-light)',
          paddingTop: 16,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {event.objectives && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5 }}>Objectives</div>
                <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>{event.objectives}</p>
              </div>
            )}
            {event.description && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5 }}>Description</div>
                <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: 0 }}>{event.description}</p>
              </div>
            )}
            {event.organizer && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Organizer</div>
                <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{event.organizer}</div>
              </div>
            )}
            {event.coordinator && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>NCC Coordinator</div>
                <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{event.coordinator}</div>
              </div>
            )}
            {event.facultyPresent && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Faculty Present</div>
                <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{event.facultyPresent}</div>
              </div>
            )}
            {event.nccOfficers && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>NCC Officers</div>
                <div style={{ fontSize: 13, color: 'var(--text-body)' }}>{event.nccOfficers}</div>
              </div>
            )}
            {(event.poMapping || event.sdgMapping) && (
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {event.poMapping && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                    PO: {event.poMapping}
                  </span>
                )}
                {event.sdgMapping && (
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99, background: '#f0fdf4', color: '#15803d', fontWeight: 600 }}>
                    SDG: {event.sdgMapping}
                  </span>
                )}
              </div>
            )}
            {event.reportUrl && (
              <div style={{ gridColumn: '1 / -1' }}>
                <a
                  href={event.reportUrl}
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
                  <ExternalLink size={12} /> View Event Report
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

export default function CadetEventsPage() {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<NccEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | 'All'>('All');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getAllEvents().then(setEvents).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let res = events;
    if (categoryFilter !== 'All') res = res.filter(e => e.category === categoryFilter);
    if (timeFilter === 'upcoming') res = res.filter(e => isUpcoming(e.date));
    if (timeFilter === 'past') res = res.filter(e => !isUpcoming(e.date));
    if (search.trim()) {
      const q = search.toLowerCase();
      res = res.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q) ||
        e.objectives?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    return res;
  }, [events, search, categoryFilter, timeFilter]);

  // Stats
  const upcoming = events.filter(e => isUpcoming(e.date));
  const totalParticipants = events.reduce((s, e) => s + (e.participantCount || 0), 0);
  const categoryCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  // Group by year
  const grouped = useMemo(() => {
    const map: Record<string, NccEvent[]> = {};
    filtered.forEach(e => {
      const year = e.date ? e.date.slice(0, 4) : 'Unknown';
      if (!map[year]) map[year] = [];
      map[year].push(e);
    });
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 28,
            fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '0.3px',
          }}>
            Events & Activities
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            NCC events, social service drives, and unit activities
          </p>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Events', value: loading ? '—' : events.length, color: 'var(--navy-600)' },
            { label: 'Upcoming', value: loading ? '—' : upcoming.length, color: '#d97706' },
            { label: 'Total Participants', value: loading ? '—' : totalParticipants || '—', color: '#7c3aed' },
            { label: 'Categories', value: loading ? '—' : Object.keys(categoryCounts).length, color: '#15803d' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface-0)', border: '1px solid var(--border-light)',
              borderRadius: 12, padding: '16px 18px', textAlign: 'center',
            }}>
              <div style={{
                fontSize: 26, fontWeight: 800, color: s.color,
                fontFamily: 'Rajdhani, sans-serif', lineHeight: 1,
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Category heatmap */}
        {!loading && events.length > 0 && (
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 14, padding: 20, marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>
              Events by Category
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                  const cfg = getCfg(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(categoryFilter === cat as any ? 'All' : cat as any)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
                        background: categoryFilter === cat ? cfg.bg : 'var(--bg-secondary)',
                        color: categoryFilter === cat ? cfg.color : 'var(--text-muted)',
                        border: `1.5px solid ${categoryFilter === cat ? cfg.color + '55' : 'var(--border-light)'}`,
                        fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                      }}
                    >
                      <span>{cfg.emoji}</span>
                      {cat}
                      <span style={{
                        background: categoryFilter === cat ? cfg.color : 'var(--border-light)',
                        color: categoryFilter === cat ? '#fff' : 'var(--text-muted)',
                        borderRadius: 99, padding: '0 6px', fontSize: 10, fontWeight: 700,
                        minWidth: 18, textAlign: 'center',
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, venues, objectives..."
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 14,
                height: 40, border: '1.5px solid var(--border-light)',
                borderRadius: 10, fontSize: 13, background: 'var(--surface-0)',
                outline: 'none', color: 'var(--text-body)', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Time filter tabs */}
          <div style={{
            display: 'flex', border: '1.5px solid var(--border-light)',
            borderRadius: 10, overflow: 'hidden', height: 40,
          }}>
            {([['all', 'All'], ['upcoming', '📅 Upcoming'], ['past', '📁 Past']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTimeFilter(val)}
                style={{
                  padding: '0 14px', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: timeFilter === val ? 'var(--navy-600)' : 'var(--surface-0)',
                  color: timeFilter === val ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Results info */}
        {!loading && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, fontWeight: 500 }}>
            Showing {filtered.length} of {events.length} events
            {(search || categoryFilter !== 'All' || timeFilter !== 'all') && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter('All'); setTimeFilter('all'); }}
                style={{ marginLeft: 10, background: 'none', border: 'none', color: 'var(--navy-600)', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Events list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} className="skeleton" style={{ height: 84, borderRadius: 14 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 16, padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>
              {events.length === 0 ? 'No events recorded yet' : 'No events match your filters'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {events.length === 0
                ? 'Events and activities logged by the ANO will appear here'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {grouped.map(([year, yearEvents]) => (
              <div key={year}>
                {/* Year heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    {year}
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
                  <div style={{
                    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)', padding: '2px 8px', borderRadius: 99,
                  }}>
                    {yearEvents.length} events
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {yearEvents.map(event => (
                    <EventCard
                      key={event.id}
                      event={event}
                      expanded={expandedId === event.id}
                      onToggle={() => setExpandedId(prev => prev === event.id ? null : event.id!)}
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
