'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getCadetsByWing, getCadetSkills } from '@/lib/db';
import type { CadetProfile, Skill, Wing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Search, Star, ChevronRight, Zap } from 'lucide-react';

interface CadetWithSkills extends CadetProfile {
  skills: Skill[];
}

const QUICK_SEARCHES = [
  'Swimming', 'Sailing', 'Boat Pulling', 'Firing', 'Drill', 'Parade',
  'Photography', 'First Aid', 'Map Reading', 'Singing', 'Dance', 'Debate',
];

export default function SearchPage() {
  const { userProfile } = useAuth();
  const [cadets, setCadets] = useState<CadetWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CadetWithSkills[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const load = async () => {
      const branch = userProfile?.branch as Wing | undefined;
      if (!branch) return;
      const profiles = await getCadetsByWing(branch);
      const enriched = await Promise.all(
        profiles.map(async (p) => ({ ...p, skills: await getCadetSkills(p.uid) }))
      );
      setCadets(enriched);
      setLoading(false);
    };
    if (userProfile !== null) load();
  }, [userProfile]);

  const handleSearch = (q: string) => {
    const term = q.toLowerCase().trim();
    if (!term) { setResults([]); setSearched(false); return; }
    const res = cadets.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(term) ||
        c.rollNumber?.toLowerCase().includes(term) ||
        c.branch?.toLowerCase().includes(term) ||
        c.college?.toLowerCase().includes(term) ||
        c.skills.some((s) => s.name.toLowerCase().includes(term))
    );
    setResults(res);
    setSearched(true);
  };

  const initials = (c: CadetProfile) =>
    `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase() || '?';

  const highlightSkills = (skills: Skill[], q: string) =>
    skills.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell requiredRole={['ano', 'admin']}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
          Search {userProfile?.branch} Wing Cadets
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
          Instantly search by name, skill, branch, college, or roll number.
        </p>
      </div>

      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 600 }}>
        <Search size={20} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input
          className="form-input"
          placeholder='Search e.g. "Swimming", "Rahul", "Navy"...'
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          style={{ paddingLeft: 44, fontSize: 16, padding: '14px 14px 14px 44px' }}
          autoFocus
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 18 }}>
            ×
          </button>
        )}
      </div>

      {/* Quick searches */}
      {!searched && !loading && (
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Zap size={13} /> Quick searches
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_SEARCHES.map((q) => (
              <button key={q} onClick={() => { setQuery(q); handleSearch(q); }}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                  border: '1.5px solid #e2e8f0', background: 'white', cursor: 'pointer',
                  color: '#475569', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#475569'; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTop: '3px solid #1e3a5f', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p>Loading cadets...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Results */}
      {searched && (
        <div>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
            {results.length === 0 ? 'No results found.' : `${results.length} cadet${results.length > 1 ? 's' : ''} found for "${query}"`}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {results.map((cadet) => {
              const matchedSkills = highlightSkills(cadet.skills, query);
              return (
                <div key={cadet.uid} className="card" style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div className="avatar">{initials(cadet)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                          {cadet.firstName} {cadet.lastName}
                        </p>
                        <span className="badge badge-blue">{cadet.branch}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Sem {cadet.semester}</span>
                        {cadet.availability ? (
                          <span className="badge badge-green">Available</span>
                        ) : (
                          <span className="badge badge-gray">Unavailable</span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: '#64748b' }}>
                        {cadet.rollNumber} · {cadet.college || '—'}
                      </p>

                      {/* All skills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                        {cadet.skills.map((s) => {
                          const isMatch = s.name.toLowerCase().includes(query.toLowerCase());
                          return (
                            <span key={s.id} style={{
                              fontSize: 12, padding: '3px 10px', borderRadius: 12, fontWeight: 500,
                              background: isMatch ? '#1e3a5f' : '#f1f5f9',
                              color: isMatch ? 'white' : '#64748b',
                            }}>
                              {s.name} {'★'.repeat(s.level)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <Link href={`/ano/cadets/${cadet.uid}`}>
                      <button className="btn-ghost">
                        View <ChevronRight size={14} />
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
