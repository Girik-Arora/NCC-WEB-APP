'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getCadetsByWing, getCadetVerifiedSkills, getCadetAchievements, getCampHistory } from '@/lib/db';
import type { CadetProfile, Skill, Wing } from '@/types';
import Link from 'next/link';
import { Search, User, Star, Tent, GraduationCap, ChevronRight, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface CadetWithSkills extends CadetProfile {
  skills: Skill[];
  campCount: number;
  achievementCount: number;
}

export default function CadetsPage() {
  const { userProfile } = useAuth();
  const [cadets, setCadets] = useState<CadetWithSkills[]>([]);
  const [filtered, setFiltered] = useState<CadetWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('All');
  const [semFilter, setSemFilter] = useState('All');

  const anoBranch = userProfile?.branch as Wing | undefined;

  useEffect(() => {
    const load = async () => {
      if (!anoBranch) return;
      // Only show cadets from the ANO's wing
      const profiles = await getCadetsByWing(anoBranch);
      const enriched = await Promise.all(
        profiles.map(async (p) => {
          const [skills, achievements, camps] = await Promise.all([
            getCadetVerifiedSkills(p.uid),  // only verified skills
            getCadetAchievements(p.uid),
            getCampHistory(p.uid),
          ]);
          return { ...p, skills, campCount: camps.length, achievementCount: achievements.length };
        })
      );
      setCadets(enriched);
      setFiltered(enriched);
      setLoading(false);
    };
    if (userProfile !== null) load();
  }, [userProfile, anoBranch]);

  useEffect(() => {
    let result = cadets;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.rollNumber?.toLowerCase().includes(q) ||
          c.skills.some((s) => s.name.toLowerCase().includes(q))
      );
    }
    if (branchFilter !== 'All') result = result.filter((c) => c.branch === branchFilter);
    if (semFilter !== 'All') result = result.filter((c) => c.semester === parseInt(semFilter));
    setFiltered(result);
  }, [search, branchFilter, semFilter, cadets]);

  const initials = (c: CadetProfile) =>
    `${c.firstName?.[0] || ''}${c.lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <AppShell requiredRole={['ano', 'admin']}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
          {anoBranch} Wing Cadets
        </h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{cadets.length} cadets in your wing with verified submissions.</p>
      </div>

      {/* Search and filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 280 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            className="form-input"
            placeholder="Search by name, roll number, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 38 }}
          />
        </div>
        <select className="form-select" style={{ width: 140 }} value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
          <option value="All">All Branches</option>
          <option value="Army">Army</option>
          <option value="Navy">Navy</option>
          <option value="Air Force">Air Force</option>
        </select>
        <select className="form-select" style={{ width: 140 }} value={semFilter} onChange={(e) => setSemFilter(e.target.value)}>
          <option value="All">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => <option key={s} value={s}>Sem {s}</option>)}
        </select>
      </div>

      {/* Results count */}
      {search || branchFilter !== 'All' || semFilter !== 'All' ? (
        <p style={{ color: '#64748b', fontSize: 13, marginBottom: 16 }}>
          Showing {filtered.length} of {cadets.length} cadets
        </p>
      ) : null}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} style={{ height: 80, background: '#e2e8f0', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
          <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <User size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>No cadets found</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Cadet</th>
                <th>Branch / Semester</th>
                <th>Skills</th>
                <th>Camps</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cadet) => (
                <tr key={cadet.uid}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{initials(cadet)}</div>
                      <div>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                          {cadet.firstName} {cadet.lastName}
                        </p>
                        <p style={{ fontSize: 12, color: '#94a3b8' }}>{cadet.rollNumber || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-blue" style={{ marginRight: 6 }}>{cadet.branch || '—'}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Sem {cadet.semester}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} color="#f59e0b" />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{cadet.skills.length}</span>
                      {cadet.skills.length > 0 && (
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          ({cadet.skills.slice(0, 2).map((s) => s.name).join(', ')}{cadet.skills.length > 2 ? '...' : ''})
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tent size={14} color="#16a34a" />
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{cadet.campCount}</span>
                    </div>
                  </td>
                  <td>
                    {cadet.availability ? (
                      <span className="badge badge-green">Available</span>
                    ) : (
                      <span className="badge badge-gray">Unavailable</span>
                    )}
                    {!cadet.profileComplete && (
                      <span className="badge badge-yellow" style={{ marginLeft: 6 }}>Incomplete</span>
                    )}
                  </td>
                  <td>
                    <Link href={`/ano/cadets/${cadet.uid}`}>
                      <button className="btn-ghost">
                        View <ChevronRight size={14} />
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
