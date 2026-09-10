// ─── Roles ───────────────────────────────────────────────────────────────────

export type UserRole = 'cadet' | 'mod_cadet' | 'ano' | 'admin';
export type Wing = 'Army' | 'Navy' | 'Air Force';

// ─── NCC Rank Hierarchy ───────────────────────────────────────────────────────

export const ARMY_MOD_RANKS = ['CSUO', 'CUO', 'CSM', 'CQMS', 'SGT'] as const;
export const ARMY_CADET_RANKS = ['CPL', 'L/CPL', 'CDT'] as const;
export const NAVY_MOD_RANKS = ['SCC', 'CC', 'PO CDT'] as const;
export const NAVY_CADET_RANKS = ['LC', 'NC I', 'NC II', 'CDT'] as const;
export const AIRFORCE_MOD_RANKS = ['CSUO', 'CUO', 'CWO', 'SGT'] as const;
export const AIRFORCE_CADET_RANKS = ['CPL', 'LFC', 'FC', 'CDT'] as const;

export const RANK_LABELS: Record<string, string> = {
  // Army
  CSUO: 'Cadet Senior Under Officer (CSUO)',
  CUO: 'Cadet Under Officer (CUO)',
  CSM: 'Company Sergeant Major (CSM)',
  CQMS: 'Company Quartermaster Sergeant (CQMS)',
  SGT: 'Sergeant (SGT)',
  CPL: 'Corporal (CPL)',
  'L/CPL': 'Lance Corporal (L/CPL)',
  CDT: 'Cadet (CDT)',
  // Navy
  SCC: 'Senior Cadet Captain (SCC)',
  CC: 'Cadet Captain (CC)',
  'PO CDT': 'Petty Officer Cadet (PO CDT)',
  LC: 'Leading Cadet (LC)',
  'NC I': 'Naval Cadet I (NC I)',
  'NC II': 'Naval Cadet II (NC II)',
  // Air Force
  CWO: 'Cadet Warrant Officer (CWO)',
  LFC: 'Leading Flight Cadet (LFC)',
  FC: 'Flight Cadet (FC)',
};

export const RANKS_BY_WING: Record<Wing, { mod: readonly string[]; cadet: readonly string[] }> = {
  Army: { mod: ARMY_MOD_RANKS, cadet: ARMY_CADET_RANKS },
  Navy: { mod: NAVY_MOD_RANKS, cadet: NAVY_CADET_RANKS },
  'Air Force': { mod: AIRFORCE_MOD_RANKS, cadet: AIRFORCE_CADET_RANKS },
};

export const getRoleFromRank = (wing: Wing, rank: string): 'cadet' | 'mod_cadet' => {
  const { mod } = RANKS_BY_WING[wing];
  return (mod as readonly string[]).includes(rank) ? 'mod_cadet' : 'cadet';
};

// ─── Verification ─────────────────────────────────────────────────────────────

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

// ─── User Profile ────────────────────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  // ANO officer rank (Lieutenant, Captain, etc.)
  rank?: string;
  // NCC cadet rank (CSUO, SGT, CPL, etc.) — for cadets and mod_cadets
  nccRank?: string;
  // Wing/domain membership
  branch?: Wing;
  createdAt: Date;
}

// ─── Cadet Profile ────────────────────────────────────────────────────────────

export interface CadetProfile {
  uid: string;
  // Personal Details
  firstName: string;
  lastName: string;
  rollNumber: string;
  branch: Wing;
  nccRank?: string;
  college: string;
  semester: number;
  bloodGroup: string;
  dateOfBirth: string;
  gender: string;
  // Contact
  phone: string;
  address: string;
  city: string;
  state: string;
  // Emergency Contact
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  // Medical
  medicalIssues: boolean;
  medicalDetails?: string;
  // Meta
  profileComplete: boolean;
  availability: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  certificateUrl?: string;
  certificateName?: string;
  addedAt: Date;
  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface CadetSkills {
  uid: string;
  skills: Skill[];
  updatedAt: Date;
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  uid: string;
  title: string;
  description: string;
  date: string;
  photoUrl?: string;
  certificateUrl?: string;
  createdAt: Date;
  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}

// ─── Camp Records ─────────────────────────────────────────────────────────────

export type CampType = 'CATC' | 'NIC' | 'SNIC' | 'RDC' | 'Trekking' | 'Sailing' | 'Army Attachment' | 'Navy Attachment' | 'Air Attachment';
export type Grade = 'A' | 'B' | 'C' | 'Pass';

export interface CampRecord {
  id: string;
  uid: string;
  campType: CampType;
  year: number;
  location: string;
  grade: Grade;
  position?: string;
  certificateUrl?: string;
  createdAt: Date;
  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}

// ─── Evaluations ──────────────────────────────────────────────────────────────

export interface SemesterEvaluation {
  id: string;
  cadetUid: string;
  anoUid: string;
  semester: number;
  year: number;
  // Ratings 1-5
  discipline: number;
  leadership: number;
  drill: number;
  attendance: number;
  initiative: number;
  physicalFitness: number;
  teamwork: number;
  communication: number;
  // Computed
  totalScore: number;
  remarks?: string;
  createdAt: Date;
}

// ─── Camp Recommendation ──────────────────────────────────────────────────────

export interface CampRecommendationCriteria {
  campType: string;
  seats: number;
  filters: {
    minSkillLevels: Record<string, number>;
    minAttendance?: number;
    noMedicalIssues?: boolean;
    minEvalScores?: Record<string, number>;
  };
}

export interface RecommendedCadet {
  uid: string;
  name: string;
  rollNumber: string;
  branch: string;
  semester: number;
  totalScore: number;
  skillScores: Record<string, number>;
  evalScore: number;
  rank: number;
}

// ─── Verification Queue Item ──────────────────────────────────────────────────

export interface PendingVerificationItem {
  type: 'skill' | 'achievement' | 'camp';
  itemId: string;       // doc id or skill id within the skills doc
  cadetUid: string;
  cadetName: string;
  cadetBranch: Wing;
  title: string;        // skill name / achievement title / camp type
  details: string;      // level / description / grade
  submittedAt: Date;
}
