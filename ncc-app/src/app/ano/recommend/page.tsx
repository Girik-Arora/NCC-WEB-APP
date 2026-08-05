'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { runCampRecommendation } from '@/lib/db';
import type { RecommendedCadet } from '@/types';
import toast from 'react-hot-toast';
import { Compass, Play, Medal, Star, GraduationCap, ChevronRight, Anchor, Mountain, Shield, Tent } from 'lucide-react';

const CAMP_OPTIONS = [
  {
    type: 'Sailing',
    icon: <Anchor size={24} />,
    color: '#0891b2',
    bg: '#ecfeff',
    description: 'Water-based camp requiring swimming & boat pulling skills',
    criteria: 'Swimming ≥4 · Boat Pulling ≥4 · Discipline ≥4 · Attendance >80%',
  },
  {
    type: 'RDC',
    icon: <Shield size={24} />,
    color: '#dc2626',
    bg: '#fef2f2',
    description: 'Republic Day Camp — top drill and discipline required',
    criteria: 'Drill ≥4 · Parade ≥4 · Discipline ≥4 · Leadership',
  },
  {
    type: 'Trekking',
    icon: <Mountain size={24} />,
    color: '#16a34a',
    bg: '#f0fdf4',
    description: 'Physical endurance camp in challenging terrain',
    criteria: 'Physical Fitness ≥4 · Initiative ≥4 · Teamwork',
  },
  {
    type: 'NIC',
    icon: <Star size={24} />,
    color: '#7c3aed',
    bg: '#faf5ff',
    description: 'National Integration Camp — communication & leadership',
    criteria: 'Communication ≥4 · Leadership ≥4 · Cultural Talent',
  },
  {
    type: 'CATC',
    icon: <Tent size={24} />,
    color: '#d97706',
    bg: '#fffbeb',
    description: 'Combined Annual Training Camp — all-round performance',
    criteria: 'Drill ≥3 · Parade ≥3 · Discipline · Teamwork',
  },
  {
    type: 'SNIC',
    icon: <GraduationCap size={24} />,
    color: '#2563eb',
    bg: '#eff6ff',
    description: 'State National Integration Camp',
    criteria: 'Communication ≥4 · Leadership ≥4 · Teamwork',
  },
];

export default function RecommendPage() {
  const [selectedCamp, setSelectedCamp] = useState('');
  const [seats, setSeats] = useState(5);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<RecommendedCadet[]>([]);
  const [ran, setRan] = useState(false);

  const handleRun = async () => {
    if (!selectedCamp) { toast.error('Please select a camp type.'); return; }
    setRunning(true);
    try {
      const res = await runCampRecommendation(selectedCamp, seats);
      setResults(res);
      setRan(true);
      if (res.length === 0) {
        toast('No eligible cadets found for this camp type.', { icon: '⚠️' });
      } else {
        toast.success(`Found ${res.length} eligible cadet${res.length > 1 ? 's' : ''}!`);
      }
    } catch {
      toast.error('Recommendation failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const campInfo = CAMP_OPTIONS.find((c) => c.type === selectedCamp);

  return (
    <AppShell requiredRole={['ano', 'admin']}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Compass size={20} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Camp Recommendation Engine</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: 14 }}>
          Select a camp type and number of seats. The system will rank eligible cadets using skills, evaluations, and attendance.
        </p>
      </div>

      {/* Camp type selection */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>1. Select Camp Type</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {CAMP_OPTIONS.map((camp) => (
            <button
              key={camp.type}
              onClick={() => { setSelectedCamp(camp.type); setRan(false); setResults([]); }}
              style={{
                padding: '16px', borderRadius: 10, cursor: 'pointer', textAlign: 'left' as const,
                border: `2px solid ${selectedCamp === camp.type ? camp.color : '#e2e8f0'}`,
                background: selectedCamp === camp.type ? camp.bg : 'white',
                transition: 'all 0.2s',
              }}
            >
              <div style={{ color: camp.color, marginBottom: 8 }}>{camp.icon}</div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>{camp.type}</p>
              <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{camp.description}</p>
              {selectedCamp === camp.type && (
                <p style={{ fontSize: 11, color: camp.color, marginTop: 8, fontWeight: 500 }}>
                  Criteria: {camp.criteria}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Seats + Run */}
      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 16 }}>2. Set Number of Seats & Run</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Available Seats</label>
            <input
              className="form-input"
              type="number"
              min={1}
              max={50}
              value={seats}
              onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
              style={{ maxWidth: 160 }}
            />
          </div>
          <button
            className="btn-primary"
            onClick={handleRun}
            disabled={running || !selectedCamp}
            style={{ fontSize: 15, padding: '12px 28px', background: selectedCamp ? '#1e3a5f' : undefined }}
          >
            {running ? (
              <>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Running...
              </>
            ) : (
              <><Play size={18} /> Run Recommendation</>
            )}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>

      {/* Results */}
      {ran && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700, fontSize: 18, color: '#0f172a' }}>
              Results for {selectedCamp} — {seats} seat{seats > 1 ? 's' : ''}
            </h3>
            {results.length > 0 && (
              <span className="badge badge-green">{results.length} cadet{results.length > 1 ? 's' : ''} recommended</span>
            )}
          </div>

          {results.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              background: 'white', borderRadius: 12, border: '1px solid #e2e8f0',
            }}>
              <Compass size={48} style={{ margin: '0 auto 12px', opacity: 0.3, color: '#94a3b8' }} />
              <p style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>No eligible cadets found</p>
              <p style={{ fontSize: 13, color: '#94a3b8' }}>
                Make sure cadets have completed profiles, skills, and evaluations matching the {selectedCamp} criteria.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map((cadet, idx) => {
                const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : 'rank-other';
                const rankColor = idx === 0 ? '#d97706' : idx === 1 ? '#6b7280' : idx === 2 ? '#92400e' : '#94a3b8';
                const scoreColor = cadet.totalScore >= 80 ? '#16a34a' : cadet.totalScore >= 60 ? '#d97706' : '#dc2626';

                return (
                  <div key={cadet.uid} className={`rank-card ${rankClass}`}>
                    {/* Rank number */}
                    <div className={`rank-number ${rankClass}`} style={{
                      background: idx < 3 ? undefined : '#f1f5f9',
                      color: idx < 3 ? rankColor : '#94a3b8',
                    }}>
                      #{cadet.rank}
                    </div>

                    {/* Avatar */}
                    <div className="avatar">
                      {cadet.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{cadet.name}</p>
                        <span className="badge badge-blue" style={{ fontSize: 11 }}>{cadet.branch}</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>Sem {cadet.semester}</span>
                      </div>
                      <p style={{ fontSize: 12, color: '#94a3b8' }}>Roll: {cadet.rollNumber}</p>

                      {/* Skill scores */}
                      {Object.keys(cadet.skillScores).length > 0 && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          {Object.entries(cadet.skillScores).map(([skill, level]) => (
                            <span key={skill} style={{
                              fontSize: 11, padding: '2px 8px', borderRadius: 12,
                              background: level >= 4 ? '#f0fdf4' : '#fef3c7',
                              color: level >= 4 ? '#16a34a' : '#d97706', fontWeight: 500,
                            }}>
                              {skill}: {'★'.repeat(level)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'center' as const, marginLeft: 16 }}>
                      <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                        {cadet.totalScore}
                      </div>
                      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>points</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
