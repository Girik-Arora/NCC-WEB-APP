'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetProfile, getCadetAttendance, getAllParades, getCampHistory } from '@/lib/db';
import { calculateCertEligibility } from '@/lib/eligibility';
import type { CertEligibility } from '@/types';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function CadetCertificatePage() {
  const { userProfile } = useAuth();
  const [eligibility, setEligibility] = useState<CertEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendancePct, setAttendancePct] = useState(0);

  useEffect(() => {
    if (!userProfile?.uid) return;
    async function compute() {
      const [cadet, attendance, parades, campHistory] = await Promise.all([
        getCadetProfile(userProfile!.uid),
        getCadetAttendance(userProfile!.uid),
        getAllParades(),
        getCampHistory(userProfile!.uid),
      ]);
      const total = parades.length;
      const present = attendance.filter(r => r.status === 'present' || r.status === 'on_duty').length;
      const pct = total > 0 ? Math.round((present / total) * 100) : 0;
      setAttendancePct(pct);
      if (cadet) setEligibility(calculateCertEligibility(cadet, campHistory, pct));
      setLoading(false);
    }
    compute().catch(() => setLoading(false));
  }, [userProfile]);



  const CertCard = ({ cert, label, color, bg, data }: { cert: 'A' | 'B' | 'C'; label: string; color: string; bg: string; data: any }) => (
    <div style={{ background: bg, border: `2px solid ${color}40`, borderRadius: 16, padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'Rajdhani, sans-serif' }}>NCC 'B' Certificate</div>
          {cert === 'B' && <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'Rajdhani, sans-serif' }}>NCC '{cert}' Certificate</div>}
        </div>
        {data?.eligible ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '6px 14px' }}>
            <CheckCircle size={16} color="#15803d" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#15803d' }}>ELIGIBLE</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 99, padding: '6px 14px' }}>
            <XCircle size={16} color="#dc2626" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626' }}>NOT YET</span>
          </div>
        )}
      </div>
      {data?.checks && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(data.checks).map(([key, passed]) => {
            const labels: Record<string, string> = {
              attendanceOk: `Attendance ≥ 75% (Current: ${attendancePct}%)`,
              catcDone: 'CATC camp completed',
              secondYear: 'In 2nd year or above',
              certADone: 'Certificate A cleared',
              certBDone: 'Certificate B cleared',
              thirdYear: 'In 3rd year or above',
              atcDone: 'ATC camp completed',
              additionalCampDone: 'Additional camp (RDC/TSC) done',
            };
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {passed ? <CheckCircle size={15} color="#15803d" /> : <AlertCircle size={15} color="#b45309" />}
                <span style={{ fontSize: 13, color: passed ? '#374151' : '#9ca3af', fontWeight: passed ? 500 : 400 }}>{labels[key] || key}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Certificate Eligibility</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Your NCC B/C certificate readiness based on current records</p>
        </div>

        {/* Attendance Banner */}
        <div style={{ background: 'linear-gradient(135deg, var(--navy-800), var(--navy-600))', borderRadius: 14, padding: '20px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, color: attendancePct >= 75 ? '#4ade80' : '#f87171', lineHeight: 1 }}>{attendancePct}%</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Overall Attendance</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ height: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(attendancePct, 100)}%`, background: attendancePct >= 75 ? '#4ade80' : '#f87171', borderRadius: 99, transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 5 }}>
              <span>0%</span>
              <span style={{ color: '#facc15', fontWeight: 700 }}>75% required</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Calculating eligibility…</div>
        ) : eligibility ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CertCard cert="B" label="NCC 'B' Certificate" color="#0369a1" bg="#f0f9ff" data={eligibility.certB} />
            <CertCard cert="C" label="NCC 'C' Certificate" color="#7c3aed" bg="#faf5ff" data={eligibility.certC} />
            <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '14px 18px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              💡 <strong>Note:</strong> Eligibility is computed automatically from your attendance records and camp history. Contact your ANO if you believe the records are incomplete. All camp records must be verified by the ANO to count.
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            Could not compute eligibility. Ensure your profile is complete with semester information.
          </div>
        )}
      </div>
    </AppShell>
  );
}
