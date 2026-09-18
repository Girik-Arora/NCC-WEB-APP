'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetProfile, getCadetSkills, getCadetAchievements, getCampHistory, getCadetEvaluations, getCadetAttendance, getMedicalRecordsByCadet, getAllInventory, getInventoryIssuesByCadet } from '@/lib/db';
import { calculateAttendancePct, calculateCertEligibility } from '@/lib/eligibility';
import type { CadetProfile, Skill, Achievement, CampRecord, SemesterEvaluation, AttendanceRecord } from '@/types';
import { User, Star, Trophy, Tent, Calendar, Shield, HeartPulse, Package, Award, CheckCircle, XCircle, AlertCircle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const BLOOD_GROUP_COLORS: Record<string, string> = {
  'A+': '#dc2626', 'A-': '#dc2626', 'B+': '#d97706', 'B-': '#d97706',
  'AB+': '#7c3aed', 'AB-': '#7c3aed', 'O+': '#15803d', 'O-': '#15803d',
};

export default function CadetDossierPage() {
  const params = useParams();
  const uid = params?.uid as string;
  const [cadet, setCadet] = useState<CadetProfile | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [camps, setCamps] = useState<CampRecord[]>([]);
  const [evals, setEvals] = useState<SemesterEvaluation[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [medical, setMedical] = useState<any[]>([]);
  const [uniformIssues, setUniformIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!uid) return;
    Promise.all([
      getCadetProfile(uid),
      getCadetSkills(uid),
      getCadetAchievements(uid),
      getCampHistory(uid),
      getCadetEvaluations(uid),
      getCadetAttendance(uid),
      getMedicalRecordsByCadet(uid),
      getInventoryIssuesByCadet(uid),
    ]).then(([c, s, a, ca, ev, att, med, inv]) => {
      setCadet(c);
      setSkills(s);
      setAchievements(a);
      setCamps(ca);
      setEvals(ev);
      setAttendance(att);
      setMedical(med);
      setUniformIssues(inv);
    }).finally(() => setLoading(false));
  }, [uid]);

  const attendancePct = calculateAttendancePct(attendance);
  const eligibility = cadet ? calculateCertEligibility(cadet, camps, attendancePct) : null;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'skills', label: `Skills (${skills.length})` },
    { id: 'achievements', label: `Achievements (${achievements.length})` },
    { id: 'camps', label: `Camps (${camps.length})` },
    { id: 'evaluations', label: `Evaluations (${evals.length})` },
    { id: 'medical', label: 'Medical' },
    { id: 'uniform', label: 'Uniform' },
  ];

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/command/cadets" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--navy-600)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Roster
        </Link>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading dossier...</div>
        ) : !cadet ? (
          <div style={{ textAlign: 'center', padding: 60 }}>Cadet not found</div>
        ) : (
          <>
            {/* ── Profile Header ── */}
            <div style={{
              background: 'linear-gradient(135deg, var(--navy-800) 0%, var(--navy-600) 100%)',
              borderRadius: 16, padding: '28px 32px', marginBottom: 20,
              display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap',
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'var(--gold-300)',
                border: '2px solid rgba(255,255,255,0.2)',
                flexShrink: 0,
              }}>
                {cadet.firstName?.charAt(0)}{cadet.lastName?.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Rajdhani, sans-serif', margin: 0 }}>
                    {cadet.firstName} {cadet.lastName}
                  </h1>
                  <span style={{
                    padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: 'var(--gold-600)', color: '#fff',
                  }}>{cadet.nccRank || 'CDT'}</span>
                  <span style={{
                    padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: 'rgba(255,255,255,0.15)', color: '#fff',
                  }}>{cadet.branch}</span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Roll No', value: cadet.rollNumber || '—' },
                    { label: 'Regt No', value: cadet.regimentalNumber || '—' },
                    { label: 'Semester', value: cadet.semester?.toString() || '—' },
                    { label: 'Platoon', value: cadet.platoon || '—' },
                    { label: 'Blood', value: cadet.bloodGroup || '—' },
                  ].map(item => (
                    <div key={item.label}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>{item.label}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eligibility Pills */}
              {eligibility && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  {[
                    { label: 'Cert B', ok: eligibility.certB.eligible },
                    { label: 'Cert C', ok: eligibility.certC.eligible },
                  ].map(e => (
                    <div key={e.label} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 99,
                      background: e.ok ? 'rgba(21,128,61,0.3)' : 'rgba(220,38,38,0.25)',
                      border: `1px solid ${e.ok ? '#15803d' : '#dc2626'}`,
                    }}>
                      {e.ok ? <CheckCircle size={13} color="#4ade80" /> : <XCircle size={13} color="#f87171" />}
                      <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{e.label} {e.ok ? 'Eligible' : 'Not Eligible'}</span>
                    </div>
                  ))}
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, textAlign: 'center' }}>
                    Attendance: {attendancePct}%
                  </div>
                </div>
              )}
            </div>

            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-light)', overflowX: 'auto' }}>
              {tabs.map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === t.id ? 700 : 400,
                  color: activeTab === t.id ? 'var(--navy-600)' : 'var(--text-secondary)',
                  borderBottom: activeTab === t.id ? '2.5px solid var(--navy-600)' : '2.5px solid transparent',
                  whiteSpace: 'nowrap', transition: 'var(--transition-fast)',
                }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── Tab Content ── */}
            {activeTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-heading)' }}>Personal Details</div>
                  {[
                    ['Full Name', `${cadet.firstName} ${cadet.lastName}`],
                    ['Date of Birth', cadet.dateOfBirth || '—'],
                    ['Gender', cadet.gender || '—'],
                    ['Blood Group', cadet.bloodGroup || '—'],
                    ['Phone', cadet.phone || '—'],
                    ['Email', '—'],
                    ['Address', cadet.address || '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: 110, flexShrink: 0 }}>{label}</span>
                      <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-heading)' }}>NCC Details</div>
                  {[
                    ['Roll No', cadet.rollNumber || '—'],
                    ['Regt No', cadet.regimentalNumber || '—'],
                    ['Wing', cadet.branch || '—'],
                    ['NCC Rank', cadet.nccRank || 'CDT'],
                    ['Division', cadet.division || '—'],
                    ['Platoon', cadet.platoon || '—'],
                    ['Enrollment Year', cadet.enrollmentYear?.toString() || '—'],
                    ['Cert A', cadet.certA ? '✅ Obtained' : '—'],
                    ['Cert B', cadet.certB ? '✅ Obtained' : '—'],
                    ['Cert C', cadet.certC ? '✅ Obtained' : '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: 110, flexShrink: 0 }}>{label}</span>
                      <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-heading)' }}>Emergency Contact</div>
                  {[
                    ['Name', cadet.emergencyName || '—'],
                    ['Relation', cadet.emergencyRelation || '—'],
                    ['Phone', cadet.emergencyPhone || '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: 110 }}>{label}</span>
                      <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--text-heading)' }}>Uniform Sizes</div>
                  {[
                    ['Shirt Size', cadet.shirtSize || '—'],
                    ['Trouser Size', cadet.trouserSize || '—'],
                    ['Boot Size', cadet.bootSize || '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-muted)', minWidth: 110 }}>{label}</span>
                      <span style={{ color: 'var(--text-body)', fontWeight: 500 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                {skills.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No skills logged.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {skills.map(s => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.category} · Level {s.level}/5</div>
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: s.verificationStatus === 'verified' ? 'var(--success-bg)' : s.verificationStatus === 'rejected' ? 'var(--danger-bg)' : 'var(--warning-bg)',
                          color: s.verificationStatus === 'verified' ? 'var(--success)' : s.verificationStatus === 'rejected' ? 'var(--danger)' : 'var(--warning)',
                        }}>{s.verificationStatus}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'achievements' && (
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                {achievements.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No achievements logged.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {achievements.map(a => (
                      <div key={a.id} style={{ padding: '12px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{a.date} · {a.category || 'General'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'camps' && (
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                {camps.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No camps logged.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {camps.map(c => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.campType}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.year} · {c.location}</div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'var(--gold-100)', color: 'var(--gold-800)' }}>Grade {c.grade}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'evaluations' && (
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                {evals.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No evaluations recorded.</p> : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {evals.map(ev => (
                      <div key={ev.id} style={{ padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>Semester {ev.semester} — {ev.year}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                          {['discipline', 'leadership', 'drill', 'attendance', 'initiative', 'physicalFitness', 'teamwork', 'communication'].map(field => (
                            <div key={field}>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{field}</div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy-600)' }}>{(ev as any)[field]}/5</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                          Total Score: <strong>{ev.totalScore}/40</strong>
                          {ev.remarks && ` · ${ev.remarks}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'medical' && (
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                <div style={{ marginBottom: 12, fontSize: 13 }}>
                  Medical Issues: <strong>{cadet.medicalIssues ? '⚠️ Yes' : '✅ No'}</strong>
                  {cadet.medicalDetails && <span style={{ color: 'var(--text-muted)' }}> — {cadet.medicalDetails}</span>}
                </div>
                {medical.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No medical records.</p> : (
                  medical.map(m => (
                    <div key={m.id} style={{ padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{m.type} — {m.date}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{m.fitnessStatus || '—'} · {m.details || ''}</div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'uniform' && (
              <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20 }}>
                {uniformIssues.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No uniform issues recorded.</p> : (
                  uniformIssues.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{u.itemName} × {u.quantity}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Issued: {u.issueDate} · By: {u.issuedBy}</div>
                      </div>
                      {u.returnedDate ? (
                        <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 600 }}>Returned {u.returnedDate}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 600 }}>Not Returned</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
