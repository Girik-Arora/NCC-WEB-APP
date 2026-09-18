// ─── src/lib/eligibility.ts ───────────────────────────────────────────────────
// Certificate Eligibility Rule Engine
// Rules based on NCC training requirements

import type {
  CadetProfile,
  CampRecord,
  AttendanceRecord,
  CertEligibility,
} from '@/types';

export function calculateAttendancePct(
  records: AttendanceRecord[]
): number {
  if (records.length === 0) return 0;
  const present = records.filter(
    (r) => r.status === 'present' || r.status === 'on_duty'
  ).length;
  return Math.round((present / records.length) * 100);
}

export function calculateCertEligibility(
  cadet: CadetProfile,
  campRecords: CampRecord[],
  attendancePct: number
): CertEligibility {
  const verifiedCamps = campRecords.filter(
    (c) => c.verificationStatus === 'verified'
  );

  const hasCatc = verifiedCamps.some(
    (c) => c.campType === 'CATC' || c.campType === 'ATC'
  );
  const hasAtc = verifiedCamps.some(
    (c) => c.campType === 'ATC' || c.campType === 'CATC'
  );
  const hasAdditionalCamp = verifiedCamps.some(
    (c) =>
      c.campType === 'NIC' ||
      c.campType === 'SNIC' ||
      c.campType === 'TSC' ||
      c.campType === 'NSC' ||
      c.campType === 'Pre-RDC' ||
      c.campType === 'RDC'
  );

  const isSecondYear = (cadet.semester || 0) >= 3;
  const isThirdYear = (cadet.semester || 0) >= 5;
  const certADone = cadet.certA === true;
  const certBDone = cadet.certB === true;

  const certBAttendanceOk = attendancePct >= 75;
  const certCAttendanceOk = attendancePct >= 75;

  const certBChecks = {
    attendanceOk: certBAttendanceOk,
    catcDone: hasCatc,
    secondYear: isSecondYear,
    certADone,
  };

  const certCChecks = {
    certBDone,
    thirdYear: isThirdYear,
    attendanceOk: certCAttendanceOk,
    atcDone: hasAtc,
    additionalCampDone: hasAdditionalCamp,
  };

  return {
    certB: {
      eligible: Object.values(certBChecks).every(Boolean),
      checks: certBChecks,
      attendancePct,
    },
    certC: {
      eligible: Object.values(certCChecks).every(Boolean),
      checks: certCChecks,
      attendancePct,
    },
  };
}
