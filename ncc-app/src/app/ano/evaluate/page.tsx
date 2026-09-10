'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { getCadetsByWing, getCadetEvaluations, saveEvaluation } from '@/lib/db';
import type { CadetProfile, SemesterEvaluation, Wing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Save, ChevronDown, User } from 'lucide-react';

const EVAL_FIELDS = [
  { key: 'discipline', label: 'Discipline', desc: 'Adherence to rules and codes of conduct' },
  { key: 'leadership', label: 'Leadership', desc: 'Ability to lead, guide, and inspire others' },
  { key: 'drill', label: 'Drill', desc: 'Performance in parade and drill exercises' },
  { key: 'attendance', label: 'Attendance', desc: 'Regularity in NCC activities and parades' },
  { key: 'initiative', label: 'Initiative', desc: 'Proactiveness and self-motivation' },
  { key: 'physicalFitness', label: 'Physical Fitness', desc: 'Overall physical health and fitness level' },
  { key: 'teamwork', label: 'Teamwork', desc: 'Collaboration and cooperation with fellow cadets' },
  { key: 'communication', label: 'Communication', desc: 'Clarity and effectiveness of communication' },
] as const;

type EvalKey = typeof EVAL_FIELDS[number]['key'];

const CURRENT_YEAR = new Date().getFullYear();
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR + 1];

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const labels = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
  const [hover, setHover] = useState(0);
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: 2,
              fontSize: 28, lineHeight: 1,
              color: (hover || value) >= i ? '#f59e0b' : '#e2e8f0',
              transition: 'all 0.1s',
              transform: hover >= i ? 'scale(1.15)' : 'scale(1)',
            }}>★</button>
        ))}
        <span style={{
          fontSize: 13, fontWeight: 600, marginLeft: 8,
          color: value >= 4 ? '#16a34a' : value >= 3 ? '#d97706' : value >= 1 ? '#dc2626' : '#94a3b8',
        }}>
          {hover ? labels[hover] : (value ? labels[value] : 'Not rated')}
        </span>
      </div>
    </div>
  );
}

function EvaluateContent() {
  const { user, userProfile } = useAuth();
  const searchParams = useSearchParams();
  const preselectedCadet = searchParams.get('cadet');
  const anoBranch = user?.uid ? userProfile?.branch as Wing | undefined : undefined;

  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [selectedCadet, setSelectedCadet] = useState(preselectedCadet || '');
  const [semester, setSemester] = useState(1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [remarks, setRemarks] = useState('');
  const [ratings, setRatings] = useState<Record<EvalKey, number>>({
    discipline: 0, leadership: 0, drill: 0, attendance: 0,
    initiative: 0, physicalFitness: 0, teamwork: 0, communication: 0,
  });
  const [saving, setSaving] = useState(false);
  const [prevEval, setPrevEval] = useState<SemesterEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!anoBranch) return;
    getCadetsByWing(anoBranch).then((c) => { setCadets(c); setLoading(false); });
  }, [anoBranch]);

  useEffect(() => {
    if (!selectedCadet) return;
    getCadetEvaluations(selectedCadet).then((evals) => {
      const match = evals.find((e) => e.semester === semester && e.year === year);
      if (match) {
        setPrevEval(match);
        setRatings({
          discipline: match.discipline, leadership: match.leadership, drill: match.drill,
          attendance: match.attendance, initiative: match.initiative,
          physicalFitness: match.physicalFitness, teamwork: match.teamwork,
          communication: match.communication,
        });
        setRemarks(match.remarks || '');
      } else {
        setPrevEval(null);
        setRatings({ discipline: 0, leadership: 0, drill: 0, attendance: 0, initiative: 0, physicalFitness: 0, teamwork: 0, communication: 0 });
        setRemarks('');
      }
    });
  }, [selectedCadet, semester, year]);

  const totalScore = Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / 8 * 20);
  const allRated = Object.values(ratings).every((v) => v > 0);

  const handleSave = async () => {
    if (!user || !selectedCadet) { toast.error('Please select a cadet.'); return; }
    if (!allRated) { toast.error('Please rate all fields.'); return; }
    setSaving(true);
    try {
      await saveEvaluation({
        cadetUid: selectedCadet,
        anoUid: user.uid,
        semester,
        year,
        remarks,
        totalScore,
        ...ratings,
      });
      toast.success('Evaluation saved!');
    } catch {
      toast.error('Failed to save evaluation.');
    } finally {
      setSaving(false);
    }
  };

  const selectedProfile = cadets.find((c) => c.uid === selectedCadet);

  return (
    <AppShell requiredRole={['ano', 'admin']}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            {anoBranch ? `${anoBranch} Wing ` : ''}Semester Evaluation
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Rate cadet performance across 8 dimensions. ~5 minutes per cadet.</p>
        </div>
        {allRated && (
          <div style={{ textAlign: 'center' as const }}>
            <div style={{
              fontSize: 36, fontWeight: 800, color: totalScore >= 80 ? '#16a34a' : totalScore >= 60 ? '#d97706' : '#dc2626',
            }}>
              {totalScore}%
            </div>
            <p style={{ fontSize: 12, color: '#64748b' }}>Overall Score</p>
          </div>
        )}
      </div>

      {/* Cadet + Semester selector */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Select Cadet *</label>
            {loading ? (
              <div style={{ height: 42, background: '#e2e8f0', borderRadius: 8 }} />
            ) : (
              <select className="form-select" value={selectedCadet} onChange={(e) => {
                const uid = e.target.value;
                setSelectedCadet(uid);
                const cadet = cadets.find((c) => c.uid === uid);
                if (cadet?.semester) {
                  setSemester(cadet.semester);
                }
              }}>
                <option value="">— Choose a cadet —</option>
                {cadets.map((c) => (
                  <option key={c.uid} value={c.uid}>{c.firstName} {c.lastName} ({c.rollNumber})</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Semester</label>
            <select className="form-select" value={semester} onChange={(e) => setSemester(parseInt(e.target.value))}>
              {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Year</label>
            <select className="form-select" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Selected cadet preview */}
        {selectedProfile && (
          <div style={{
            marginTop: 16, padding: '12px 16px', background: '#f8f9fc',
            borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div className="avatar">
              {`${selectedProfile.firstName?.[0] || ''}${selectedProfile.lastName?.[0] || ''}`.toUpperCase()}
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>
                {selectedProfile.firstName} {selectedProfile.lastName}
              </p>
              <p style={{ fontSize: 12, color: '#64748b' }}>
                {selectedProfile.branch} · Sem {selectedProfile.semester} · {selectedProfile.college}
              </p>
            </div>
            {prevEval && (
              <span className="badge badge-yellow" style={{ marginLeft: 'auto' }}>
                Existing evaluation found — editing
              </span>
            )}
          </div>
        )}
      </div>

      {/* Rating fields */}
      {selectedCadet && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {EVAL_FIELDS.map((field) => (
            <div key={field.key} className="card" style={{
              padding: '18px 24px',
              borderLeft: `4px solid ${ratings[field.key] >= 4 ? '#16a34a' : ratings[field.key] >= 3 ? '#d97706' : ratings[field.key] >= 1 ? '#dc2626' : '#e2e8f0'}`,
              transition: 'border-color 0.3s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{field.label}</p>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{field.desc}</p>
                </div>
                {prevEval && (
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    Previous: <strong style={{ color: '#475569' }}>{(prevEval as unknown as Record<string, number>)[field.key]}/5</strong>
                  </span>
                )}
              </div>
              <StarInput value={ratings[field.key]} onChange={(v) => setRatings((prev) => ({ ...prev, [field.key]: v }))} />
            </div>
          ))}

          {/* Remarks */}
          <div className="card">
            <label className="form-label">Remarks (Optional)</label>
            <textarea
              className="form-input"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any additional comments about this cadet's performance..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      )}

      {selectedCadet && (
        <button className="btn-primary" onClick={handleSave} disabled={saving || !allRated} style={{ fontSize: 15, padding: '12px 28px' }}>
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Evaluation'}
        </button>
      )}

      {!selectedCadet && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          <User size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: 16, color: '#64748b' }}>Select a cadet above to begin evaluation.</p>
        </div>
      )}
    </AppShell>
  );
}

export default function EvaluatePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40 }}>Loading...</div>}>
      <EvaluateContent />
    </Suspense>
  );
}
