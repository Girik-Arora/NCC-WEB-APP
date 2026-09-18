// ─── Roles ───────────────────────────────────────────────────────────────────

export type UserRole = 'cadet' | 'mod_cadet' | 'ano' | 'oic' | 'admin' | 'clerk' | 'alumni';
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

// ─── Lifecycle Status ─────────────────────────────────────────────────────────

export type LifecycleStatus = 'applicant' | 'selected' | 'enrolled' | 'active' | 'promoted' | 'certified_b' | 'certified_c' | 'discharged' | 'alumni';

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

// ─── Cadet Profile (Extended) ─────────────────────────────────────────────────

export interface CadetProfile {
  uid: string;
  // Personal Details
  firstName: string;
  lastName: string;
  rollNumber: string;
  regimentalNumber?: string;    // NCC official regimental/index number
  branch: Wing;
  nccRank?: string;
  college: string;
  department?: string;          // Engineering branch
  semester: number;
  enrollmentYear?: number;      // Year cadet joined NCC
  academicYear?: string;        // e.g. "2024-25"
  course?: string;              // e.g. "B.E. Computer Engineering"
  division?: string;            // e.g. "SD" or "SW"
  platoon?: string;             // e.g. "Alpha Platoon"
  // Lifecycle
  lifecycleStatus?: LifecycleStatus;
  certA?: boolean;
  certB?: boolean;
  certC?: boolean;
  // Personal
  bloodGroup: string;
  dateOfBirth: string;
  gender: string;
  nationality?: string;
  religion?: string;
  // Contact
  phone: string;
  address: string;
  city: string;
  state: string;
  // Parent / Guardian
  parentName?: string;
  parentRelation?: string;
  parentPhone?: string;
  parentOccupation?: string;
  // Emergency Contact
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  // Medical
  medicalIssues: boolean;
  medicalDetails?: string;
  // Uniform Sizes
  shirtSize?: string;
  trouserSize?: string;
  bootSize?: string;
  // Training
  trainingHoursCompleted?: number;
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
  level: SkillLevel | number;
  description?: string;
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

export type AchievementCategory =
  | 'Certificate A' | 'Certificate B' | 'Certificate C'
  | 'Shooting' | 'Sports' | 'Adventure' | 'National' | 'State'
  | 'Institutional Award' | 'Best Cadet' | 'Defence Selection' | 'General';

export interface Achievement {
  id: string;
  uid: string;
  title: string;
  description: string;
  category?: string;
  date?: string;
  position?: string;
  photoUrl?: string;
  documentUrl?: string;
  certificateUrl?: string;
  createdAt: Date;
  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
}

// ─── Camp Records ─────────────────────────────────────────────────────────────

export type CampType =
  | 'CATC' | 'ATC' | 'WATC' | 'BLC' | 'NIC' | 'SNIC' | 'RDC' | 'Pre-RDC'
  | 'TSC' | 'NSC' | 'EBSB' | 'YEP' | 'Vayu Sainik'
  | 'Trekking' | 'Sailing' | 'Scuba' | 'Cyclothon' | 'Marathon' | 'Rock Climbing' | 'Para Basic'
  | 'Army Attachment' | 'Navy Attachment' | 'Air Attachment'
  | 'Adventure Camp' | 'Social Service Camp' | 'Other';

export type Grade = 'A' | 'B' | 'C' | 'Pass' | 'Not Graded';

export interface CampRecord {
  id: string;
  uid: string;
  campType: CampType;
  campEventId?: string;      // Reference to camp_events collection
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

// ─── Camp Events (Unit-Level) ─────────────────────────────────────────────────

export type CampEventStatus = 'upcoming' | 'nomination_open' | 'in_progress' | 'completed' | 'cancelled';

export interface CampEvent {
  id: string;
  name?: string;
  campType: CampType;
  code?: string;              // e.g. "CATC-405"
  location: string;
  startDate: string;
  endDate: string;
  venue?: string;
  wing?: Wing | 'All';
  seats?: number;
  status?: CampEventStatus;
  nominationDeadline?: string;
  commandingOfficer?: string;
  organizingUnit?: string;
  reportingOfficer?: string;
  reportUrl?: string;
  // Vacancies
  armyVacancies?: number;
  navyVacancies?: number;
  maleVacancies?: number;
  femaleVacancies?: number;
  // Participants
  selectedCadetUids?: string[];
  reserveCadetUids?: string[];
  // Documents
  documentUrl?: string;
  photoUrls?: string[];
  remarks?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Parade / Attendance Session ──────────────────────────────────────────────

export type ParadeType =
  | 'Institutional Training' | 'Parade' | 'PT' | 'Drill'
  | 'NCC Lecture' | 'Defence Career Lecture' | 'SSB Guidance'
  | 'Sports Session' | 'Social Service' | 'Community Activity'
  | 'Republic Day' | 'Independence Day' | 'Other';

export interface ParadeSession {
  id: string;
  date: string;             // ISO date string YYYY-MM-DD
  paradeType: ParadeType;
  wing: Wing | 'All';
  title?: string;
  instructor?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  subjectsCovered?: string;
  remarks?: string;
  createdBy: string;
  createdAt: Date;
  // Computed (denormalized)
  totalPresent?: number;
  totalAbsent?: number;
  totalOnDuty?: number;
  totalMedical?: number;
  totalLeave?: number;
}

export type AttendanceStatus = 'present' | 'absent' | 'on_duty' | 'medical' | 'leave';

export interface AttendanceRecord {
  id: string;
  paradeId: string;
  cadetUid: string;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: string;
  markedAt: Date;
}

// ─── Training ─────────────────────────────────────────────────────────────────

export type TrainingCategory =
  | 'Drill' | 'Weapon Training' | 'Map Reading' | 'Leadership'
  | 'Personality Development' | 'PT & Sports' | 'First Aid'
  | 'Navigation' | 'Firing' | 'Cultural' | 'Defence Awareness' | 'Other';

export interface TrainingSession {
  id: string;
  date: string;
  category: TrainingCategory;
  subject: string;
  description?: string;
  trainer?: string;
  wing: Wing | 'All';
  periods: number;           // number of training periods
  year?: number;
  documentUrl?: string;
  createdBy: string;
  createdAt: Date;
}

// ─── Events & Activities ──────────────────────────────────────────────────────

export type EventCategory =
  | 'Republic Day' | 'Independence Day' | 'NCC Day'
  | 'Social Service' | 'Tree Plantation' | 'Environment'
  | 'Sports' | 'Cultural' | 'Seminar' | 'Defence Activity'
  | 'Blood Donation' | 'Cyclothon' | 'Marathon'
  | 'Community Service' | 'Firing Practice' | 'Other';

export interface NccEvent {
  id: string;
  name: string;
  category: EventCategory;
  date: string;
  endDate?: string;
  venue?: string;
  organizer?: string;
  coordinator?: string;
  objectives?: string;
  description?: string;
  // Participants
  participantUids?: string[];
  participantCount?: number;
  facultyPresent?: string;
  nccOfficers?: string;
  // Academic alignment
  poMapping?: string;        // e.g. "PO6, PO10"
  sdgMapping?: string;       // e.g. "SDG 4, SDG 13"
  // Attachments
  documentUrls?: string[];
  photoUrls?: string[];
  reportUrl?: string;
  // Meta
  reportGenerated?: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Announcements ────────────────────────────────────────────────────────────

export type AnnouncementPriority = 'urgent' | 'important' | 'training' | 'event' | 'general';

export type AnnouncementTarget =
  | 'all' | 'army' | 'navy' | 'air_force'
  | 'sd' | 'sw' | 'cadets_only' | 'senior_cadets'
  | 'officers' | 'specific';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  target: AnnouncementTarget;
  targetUids?: string[];       // For 'specific' targeting
  wing?: Wing;                 // For wing-specific
  expiresAt?: Date;
  pinned?: boolean;
  attachmentUrl?: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentCategory =
  | 'Correspondence' | 'Event Report' | 'Annual Report' | 'Training Report'
  | 'Camp Report' | 'Inspection Report' | 'Administrative'
  | 'Enrolment' | 'Promotion' | 'Discharge' | 'Certificate' | 'Medical'
  | 'Uniform' | 'Inventory' | 'Finance' | 'Other';

export type DocumentSubCategory =
  | 'Letter Received' | 'Letter Sent' | 'NCC Directorate' | 'Battalion'
  | 'TCET Administration' | 'Government' | 'General';

export interface NccDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  subCategory?: DocumentSubCategory | string;
  description?: string;
  driveUrl?: string;            // Google Drive link
  fileUrl?: string;             // Direct URL
  referenceNumber?: string;
  date?: string;
  relatedCadetUid?: string;
  relatedEventId?: string;
  tags?: string[];
  uploadedBy: string;
  uploadedByName: string;
  createdAt: Date;
}

// ─── Inventory ────────────────────────────────────────────────────────────────

export type InventoryCategory =
  | 'Uniform' | 'Equipment' | 'Weapon (Training)' | 'Navigation'
  | 'Sports' | 'Naval' | 'Camp Gear' | 'IT' | 'Documents' | 'Other';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  description?: string;
  totalQuantity: number;
  availableQuantity: number;
  unit?: string;               // 'pcs', 'sets', 'pairs'
  location?: string;           // Storage location
  condition?: 'Good' | 'Fair' | 'Poor' | 'Condemned' | string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryIssue {
  id: string;
  itemId: string;
  itemName: string;
  cadetUid: string;
  cadetName: string;
  quantity: number;
  issueDate: string;
  returnDate?: string;
  returnedDate?: string;
  condition?: string;
  issuedBy: string;
  returnedTo?: string;
  remarks?: string;
  createdAt: Date;
}

// ─── Medical Records ──────────────────────────────────────────────────────────

export type FitnessStatus = 'Fit' | 'Temporarily Unfit' | 'Permanently Unfit' | 'Under Review';

export interface MedicalRecord {
  id: string;
  cadetUid: string;
  type: 'Annual Medical' | 'Camp Clearance' | 'Incident Report' | 'Allergy' | 'General';
  date: string;
  fitnessStatus?: FitnessStatus;
  campClearance?: boolean;
  details?: string;
  allergies?: string;
  bloodGroup?: string;
  height?: number;             // cm
  weight?: number;             // kg
  documentUrl?: string;
  recordedBy: string;
  createdAt: Date;
}

// ─── Promotions ───────────────────────────────────────────────────────────────

export type PromotionStatus = 'pending' | 'approved' | 'rejected';

export interface PromotionRecord {
  id: string;
  cadetUid: string;
  cadetName: string;
  fromRank: string;
  toRank: string;
  effectiveDate?: string;
  orderNumber?: string;
  remarks?: string;
  status: PromotionStatus;
  // Eligibility checks (snapshot at time of recommendation)
  minServiceMet?: boolean;
  attendanceMet?: boolean;
  certificateMet?: boolean;
  recommendedBy?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

// ─── Enrollment Applications ──────────────────────────────────────────────────

export type ApplicationStatus =
  | 'new' | 'shortlisted' | 'physical_test' | 'medical_test'
  | 'interview' | 'selected' | 'enrolled' | 'rejected' | 'waitlisted';

export interface EnrollmentApplication {
  id: string;
  // Personal
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  email: string;
  phone: string;
  address: string;
  // Academic
  rollNumber: string;
  department: string;
  semester: number;
  college: string;
  // Wing
  wingPreference: Wing;
  secondPreference?: Wing;
  // Medical
  medicalIssues: boolean;
  medicalDetails?: string;
  // Parent
  parentName: string;
  parentRelation: string;
  parentPhone: string;
  // Documents
  photoUrl?: string;
  idProofUrl?: string;
  // Status
  status: ApplicationStatus;
  statusHistory?: { status: ApplicationStatus; date: string; remarks?: string }[];
  meritScore?: number;
  remarks?: string;
  reviewedBy?: string;
  // Meta
  createdAt: Date;
  updatedAt: Date;
}

// ─── Finance ──────────────────────────────────────────────────────────────────

export type FinanceCategory =
  | 'Camp Expenditure' | 'Refreshment' | 'Travel' | 'Procurement'
  | 'Washing Allowance' | 'Reimbursement' | 'Vendor Payment' | 'Other';

export interface FinanceRecord {
  id: string;
  type: 'income' | 'expense';
  category: FinanceCategory;
  description: string;
  amount: number;
  date: string;
  sanctionedBy?: string;
  billUrl?: string;
  relatedEventId?: string;
  relatedCampId?: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  remarks?: string;
  createdBy: string;
  createdAt: Date;
}

// ─── Alumni ───────────────────────────────────────────────────────────────────

export interface AlumniProfile {
  uid: string;
  // Basic (copied from cadet at discharge)
  firstName: string;
  lastName: string;
  regimentalNumber?: string;
  batch?: string;             // e.g. "2020-23"
  nccRank?: string;
  wing?: Wing;
  college: string;
  certA?: boolean;
  certB?: boolean;
  certC?: boolean;
  // Current info
  currentProfession?: string;
  organization?: string;
  defenceService?: boolean;
  defenceArm?: string;        // 'Army' | 'Navy' | 'Air Force' | 'Police' etc.
  higherStudies?: string;
  linkedIn?: string;
  phone?: string;
  email?: string;
  // Contributions
  contributions?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Audit Log ────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'CREATE' | 'UPDATE' | 'DELETE' | 'VERIFY' | 'REJECT'
  | 'PROMOTE' | 'ENROLL' | 'DISCHARGE' | 'LOGIN' | 'PUBLISH';

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  module: string;              // e.g. 'Attendance', 'Promotion', 'Announcement'
  targetId?: string;
  targetDescription?: string;
  details?: string;
  createdAt: Date;
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
  itemId: string;
  cadetUid: string;
  cadetName: string;
  cadetBranch: Wing;
  title: string;
  details: string;
  submittedAt: Date;
}

// ─── Certificate Eligibility ──────────────────────────────────────────────────

export interface CertEligibility {
  certB: {
    eligible: boolean;
    checks: {
      attendanceOk: boolean;
      catcDone: boolean;
      secondYear: boolean;
      certADone: boolean;
    };
    attendancePct: number;
  };
  certC: {
    eligible: boolean;
    checks: {
      certBDone: boolean;
      thirdYear: boolean;
      attendanceOk: boolean;
      atcDone: boolean;
      additionalCampDone: boolean;
    };
    attendancePct: number;
  };
}

// ─── Role Helpers ──────────────────────────────────────────────────────────────

export const COMMAND_ROLES: UserRole[] = ['ano', 'oic', 'admin', 'clerk'];
export const OFFICER_ROLES: UserRole[] = ['ano', 'oic', 'admin'];
export const SENIOR_ROLES: UserRole[] = ['ano', 'oic', 'admin', 'mod_cadet'];

export const ROLE_LABELS: Record<UserRole, string> = {
  cadet: 'Cadet',
  mod_cadet: 'Senior Cadet',
  ano: 'Associate NCC Officer',
  oic: 'Officer-in-Command / Mentor',
  admin: 'System Administrator',
  clerk: 'Admin Clerk',
  alumni: 'Alumni',
};
