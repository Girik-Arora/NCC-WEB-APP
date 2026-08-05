export type UserRole = 'cadet' | 'ano' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
}

export interface CadetProfile {
  uid: string;
  // Personal Details
  firstName: string;
  lastName: string;
  rollNumber: string;
  branch: string; // Army, Navy, Air Force
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

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export interface Skill {
  id: string;
  name: string;
  category: string;
  level: SkillLevel;
  certificateUrl?: string;
  certificateName?: string;
  addedAt: Date;
}

export interface CadetSkills {
  uid: string;
  skills: Skill[];
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  uid: string;
  title: string;
  description: string;
  date: string;
  photoUrl?: string;
  certificateUrl?: string;
  createdAt: Date;
}

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
}

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
