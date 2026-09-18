'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getMedicalRecordsByCadet, getCadetProfile } from '@/lib/db';
import type { MedicalRecord, CadetProfile, FitnessStatus } from '@/types';
import { HeartPulse, AlertTriangle, CheckCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { color: string; bg: string; emoji: string }> = {
  'Annual Medical':   { color: '#0369a1', bg: '#f0f9ff', emoji: '🩺' },
  'Camp Clearance':   { color: '#15803d', bg: '#f0fdf4', emoji: '✅' },
  'Incident Report':  { color: '#dc2626', bg: '#fef2f2', emoji: '🚨' },
  'Allergy':          { color: '#d97706', bg: '#fffbeb', emoji: '⚠️' },
  'General':          { color: '#6b7280', bg: '#f9fafb', emoji: '📋' },
};

const FITNESS_CONFIG: Record<FitnessStatus, { color: string; bg: string; label: string }> = {
  'Fit':                 { color: '#15803d', bg: '#f0fdf4', label: 'Fit for Duty' },
  'Temporarily Unfit':   { color: '#d97706', bg: '#fffbeb', label: 'Temporarily Unfit' },
  'Permanently Unfit':   { color: '#dc2626', bg: '#fef2f2', label: 'Permanently Unfit' },
  'Under Review':        { color: '#7c3aed', bg: '#faf5ff', label: 'Under Review' },
};

function getCfg(type: string) {
  return TYPE_CONFIG[type] || TYPE_CONFIG['General'];
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Sub-components (outside page to prevent focus-loss) ─────────────────────

function RecordCard({ record, expanded, onToggle }: {
  record: MedicalRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = getCfg(record.type);
  const fitCfg = record.fitnessStatus ? FITNESS_CONFIG[record.fitnessStatus] : null;

  return (
    <div style={{
      background: 'var(--surface-0)',
      border: `1px solid ${expanded ? cfg.color + '55' : 'var(--border-light)'}`,
      borderLeft: `3px solid ${cfg.color}`,
      borderRadius: 12,
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '14px 18px', textAlign: 'left',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: cfg.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, flexShrink: 0,
        }}>
          {cfg.emoji}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 3 }}>
            {record.type}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>📅 {formatDate(record.date)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👤 Dr. {record.recordedBy}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          {record.campClearance && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
              background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0',
            }}>
              Camp Cleared ✓
            </span>
          )}
          {fitCfg && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 99,
              background: fitCfg.bg, color: fitCfg.color,
            }}>
              {fitCfg.label}
            </span>
          )}
          {expanded ? <ChevronUp size={15} color="var(--text-muted)" /> : <ChevronDown size={15} color="var(--text-muted)" />}
        </div>
      </button>

      {expanded && (
        <div style={{
          padding: '14px 18px 16px', borderTop: '1px solid var(--border-light)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {record.height && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>Height</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{record.height} cm</div>
              </div>
            )}
            {record.weight && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>Weight</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)' }}>{record.weight} kg</div>
              </div>
            )}
            {record.bloodGroup && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 3 }}>Blood Group</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#dc2626' }}>{record.bloodGroup}</div>
              </div>
            )}
            {record.details && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5 }}>Clinical Notes</div>
                <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: 0, padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                  {record.details}
                </p>
              </div>
            )}
            {record.allergies && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 5 }}>⚠️ Known Allergies</div>
                <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6, margin: 0, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                  {record.allergies}
                </p>
              </div>
            )}
            {record.documentUrl && (
              <div style={{ gridColumn: '1 / -1' }}>
                <a href={record.documentUrl} target="_blank" rel="noopener noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 600, color: 'var(--navy-600)',
                  textDecoration: 'none', padding: '5px 12px',
                  background: 'var(--bg-secondary)', borderRadius: 7,
                  border: '1px solid var(--border-light)',
                }}>
                  <FileText size={12} /> View Medical Document
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

export default function CadetMedicalPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [profile, setProfile] = useState<CadetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getMedicalRecordsByCadet(user.uid),
      getCadetProfile(user.uid),
    ]).then(([recs, p]) => {
      setRecords(recs);
      setProfile(p);
    }).finally(() => setLoading(false));
  }, [user]);

  const latestFitness = records.find(r => r.fitnessStatus)?.fitnessStatus;
  const latestFitCfg = latestFitness ? FITNESS_CONFIG[latestFitness] : null;
  const campClearances = records.filter(r => r.campClearance).length;
  const hasAllergy = records.some(r => r.allergies);

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 28,
            fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '0.3px',
          }}>
            Medical Records
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Your NCC medical history, fitness status, and camp clearances
          </p>
        </div>

        {/* Stats / Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--navy-600)', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
              {loading ? '—' : records.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Records</div>
          </div>
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#15803d', fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
              {loading ? '—' : campClearances}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Camp Clearances</div>
          </div>
          <div style={{
            gridColumn: 'span 2',
            background: latestFitCfg ? latestFitCfg.bg : 'var(--surface-0)',
            border: `1px solid ${latestFitCfg ? latestFitCfg.color + '44' : 'var(--border-light)'}`,
            borderRadius: 12, padding: '16px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {latestFitCfg
              ? <CheckCircle size={28} color={latestFitCfg.color} />
              : <HeartPulse size={28} color="var(--text-muted)" />}
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: latestFitCfg ? latestFitCfg.color : 'var(--text-muted)' }}>
                {latestFitCfg ? latestFitCfg.label : loading ? 'Loading…' : 'No fitness record'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Current fitness status</div>
            </div>
          </div>
        </div>

        {/* Profile medical info from cadet profile */}
        {!loading && profile && (profile.bloodGroup || profile.medicalIssues) && (
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 14, padding: 20, marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 14 }}>
              Profile Summary
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {profile.bloodGroup && (
                <div style={{ padding: '10px 16px', background: '#fef2f2', borderRadius: 10, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🩸</span>
                  <div>
                    <div style={{ fontSize: 11, color: '#9f1239', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Blood Group</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#dc2626', fontFamily: 'Rajdhani, sans-serif' }}>{profile.bloodGroup}</div>
                  </div>
                </div>
              )}
              <div style={{
                padding: '10px 16px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
                background: profile.medicalIssues ? '#fff7ed' : '#f0fdf4',
                border: `1px solid ${profile.medicalIssues ? '#fed7aa' : '#bbf7d0'}`,
              }}>
                {profile.medicalIssues
                  ? <AlertTriangle size={18} color="#d97706" />
                  : <CheckCircle size={18} color="#15803d" />}
                <div>
                  <div style={{ fontSize: 11, color: profile.medicalIssues ? '#92400e' : '#14532d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Medical Issues
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: profile.medicalIssues ? '#d97706' : '#15803d' }}>
                    {profile.medicalIssues ? 'Reported' : 'None Reported'}
                  </div>
                </div>
              </div>
              {profile.medicalDetails && (
                <div style={{ flex: 1, padding: '10px 16px', background: '#fff7ed', borderRadius: 10, border: '1px solid #fed7aa', minWidth: 200 }}>
                  <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Details</div>
                  <div style={{ fontSize: 13, color: '#78350f' }}>{profile.medicalDetails}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Records list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loading ? (
            [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)
          ) : records.length === 0 ? (
            <div style={{
              background: 'var(--surface-0)', border: '1px solid var(--border-light)',
              borderRadius: 16, padding: '60px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🩺</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>
                No medical records yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                Medical records added by the unit medical officer will appear here
              </p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>
                Medical History ({records.length} records)
              </div>
              {records.map(rec => (
                <RecordCard
                  key={rec.id}
                  record={rec}
                  expanded={expandedId === rec.id}
                  onToggle={() => setExpandedId(prev => prev === rec.id ? null : rec.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
