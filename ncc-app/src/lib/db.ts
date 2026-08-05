import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  CadetProfile,
  CadetSkills,
  Skill,
  Achievement,
  CampRecord,
  SemesterEvaluation,
  RecommendedCadet,
  CampRecommendationCriteria,
} from '@/types';

// ─── File Upload ─────────────────────────────────────────────────────────────
// Firebase Storage is not enabled on this project.
// uploadFile throws so callers can show a friendly message.

export const uploadFile = async (
  _file: File,
  _path: string,
  _onProgress?: (progress: number) => void
): Promise<string> => {
  throw new Error('STORAGE_UNAVAILABLE');
};

// ─── Cadet Profile ───────────────────────────────────────────────────────────

export const getCadetProfile = async (uid: string): Promise<CadetProfile | null> => {
  const snap = await getDoc(doc(db, 'cadets', uid));
  return snap.exists() ? (snap.data() as CadetProfile) : null;
};

export const saveCadetProfile = async (uid: string, data: Partial<CadetProfile>): Promise<void> => {
  await setDoc(doc(db, 'cadets', uid), { ...data, uid, updatedAt: serverTimestamp() }, { merge: true });
};

export const getAllCadets = async (): Promise<CadetProfile[]> => {
  const snap = await getDocs(collection(db, 'cadets'));
  return snap.docs.map((d) => d.data() as CadetProfile);
};

// ─── Skills ──────────────────────────────────────────────────────────────────

export const getCadetSkills = async (uid: string): Promise<Skill[]> => {
  const snap = await getDoc(doc(db, 'skills', uid));
  if (!snap.exists()) return [];
  return (snap.data() as CadetSkills).skills || [];
};

export const saveCadetSkills = async (uid: string, skills: Skill[]): Promise<void> => {
  await setDoc(doc(db, 'skills', uid), { uid, skills, updatedAt: serverTimestamp() }, { merge: true });
};

// ─── Achievements ─────────────────────────────────────────────────────────────

export const getCadetAchievements = async (uid: string): Promise<Achievement[]> => {
  const q = query(collection(db, 'achievements'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
};

export const addAchievement = async (uid: string, data: Omit<Achievement, 'id' | 'uid' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'achievements'), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const deleteAchievement = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'achievements', id));
};

// ─── Camp History ─────────────────────────────────────────────────────────────

export const getCampHistory = async (uid: string): Promise<CampRecord[]> => {
  const q = query(collection(db, 'camps'), where('uid', '==', uid), orderBy('year', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampRecord));
};

export const addCampRecord = async (uid: string, data: Omit<CampRecord, 'id' | 'uid' | 'createdAt'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'camps'), {
    ...data,
    uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const deleteCampRecord = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'camps', id));
};

// ─── Semester Evaluations ─────────────────────────────────────────────────────

export const getCadetEvaluations = async (uid: string): Promise<SemesterEvaluation[]> => {
  const q = query(collection(db, 'evaluations'), where('cadetUid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SemesterEvaluation));
};

export const getAllEvaluations = async (): Promise<SemesterEvaluation[]> => {
  const snap = await getDocs(collection(db, 'evaluations'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SemesterEvaluation));
};

export const saveEvaluation = async (data: Omit<SemesterEvaluation, 'id' | 'createdAt'>): Promise<string> => {
  // Check if evaluation already exists for this cadet/semester/year
  const q = query(
    collection(db, 'evaluations'),
    where('cadetUid', '==', data.cadetUid),
    where('semester', '==', data.semester),
    where('year', '==', data.year)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
    // Update existing
    const existingId = snap.docs[0].id;
    await updateDoc(doc(db, 'evaluations', existingId), { ...data, updatedAt: serverTimestamp() });
    return existingId;
  }

  const ref = await addDoc(collection(db, 'evaluations'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

// ─── Camp Recommendation Engine ───────────────────────────────────────────────

const CAMP_CRITERIA: Record<string, { skills: Record<string, number>; evalFields: string[]; minAttendance?: number }> = {
  Sailing: {
    skills: { Swimming: 4, 'Boat Pulling': 4 },
    evalFields: ['discipline'],
    minAttendance: 80,
  },
  RDC: {
    skills: { Drill: 4, Parade: 4 },
    evalFields: ['discipline', 'drill', 'leadership'],
  },
  Trekking: {
    skills: {},
    evalFields: ['physicalFitness', 'initiative', 'teamwork'],
  },
  NIC: {
    skills: {},
    evalFields: ['communication', 'leadership'],
  },
  CATC: {
    skills: { Drill: 3, Parade: 3 },
    evalFields: ['discipline', 'teamwork'],
  },
  SNIC: {
    skills: {},
    evalFields: ['communication', 'leadership', 'teamwork'],
  },
};

export const runCampRecommendation = async (
  campType: string,
  seats: number
): Promise<RecommendedCadet[]> => {
  const criteria = CAMP_CRITERIA[campType] || { skills: {}, evalFields: [] };

  // Fetch all data in parallel
  const [cadets, allSkills, allEvals] = await Promise.all([
    getAllCadets(),
    getDocs(collection(db, 'skills')),
    getAllEvaluations(),
  ]);

  const skillsMap: Record<string, Skill[]> = {};
  allSkills.docs.forEach((d) => {
    const data = d.data() as CadetSkills;
    skillsMap[d.id] = data.skills || [];
  });

  const evalsMap: Record<string, SemesterEvaluation | null> = {};
  // Get latest evaluation per cadet
  allEvals.forEach((ev) => {
    if (!evalsMap[ev.cadetUid] || ev.semester > (evalsMap[ev.cadetUid]?.semester || 0)) {
      evalsMap[ev.cadetUid] = ev;
    }
  });

  const results: RecommendedCadet[] = [];

  for (const cadet of cadets) {
    if (!cadet.uid || !cadet.profileComplete) continue;
    if (cadet.medicalIssues) continue;

    const cadetSkills = skillsMap[cadet.uid] || [];
    const latestEval = evalsMap[cadet.uid];

    // Check skill requirements
    const skillScores: Record<string, number> = {};
    let meetsSkillReq = true;
    for (const [skillName, minLevel] of Object.entries(criteria.skills)) {
      const found = cadetSkills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
      const level = found?.level || 0;
      skillScores[skillName] = level;
      if (level < minLevel) {
        meetsSkillReq = false;
        break;
      }
    }
    if (!meetsSkillReq) continue;

    // Check attendance
    if (criteria.minAttendance && latestEval) {
      if (latestEval.attendance * 20 < criteria.minAttendance) continue;
    }

    // Calculate weighted score
    let skillTotal = 0;
    cadetSkills.forEach((s) => { skillTotal += s.level; });

    let evalTotal = 0;
    let evalCount = 0;
    if (latestEval) {
      criteria.evalFields.forEach((field) => {
        evalTotal += (latestEval as Record<string, number>)[field] || 0;
        evalCount++;
      });
    }

    const skillScore = cadetSkills.length > 0 ? (skillTotal / (cadetSkills.length * 5)) * 50 : 0;
    const evalScore = evalCount > 0 ? (evalTotal / (evalCount * 5)) * 50 : 25;
    const totalScore = Math.round(skillScore + evalScore);

    results.push({
      uid: cadet.uid,
      name: `${cadet.firstName} ${cadet.lastName}`,
      rollNumber: cadet.rollNumber,
      branch: cadet.branch,
      semester: cadet.semester,
      totalScore,
      skillScores,
      evalScore: latestEval ? Math.round((evalTotal / (Math.max(evalCount, 1) * 5)) * 100) : 0,
      rank: 0,
    });
  }

  // Sort by score and assign rank
  results.sort((a, b) => b.totalScore - a.totalScore);
  results.forEach((r, i) => { r.rank = i + 1; });

  return results.slice(0, seats);
};
