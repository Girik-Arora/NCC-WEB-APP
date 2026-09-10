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
  Timestamp,
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
  UserProfile,
  Wing,
  VerificationStatus,
  PendingVerificationItem,
} from '@/types';

// ─── File Upload ──────────────────────────────────────────────────────────────
// Firebase Storage is not enabled. uploadFile throws so callers show a friendly message.

export const uploadFile = async (
  _file: File,
  _path: string,
  _onProgress?: (progress: number) => void
): Promise<string> => {
  throw new Error('STORAGE_UNAVAILABLE');
};

// ─── Cadet Profile ────────────────────────────────────────────────────────────

export const getCadetProfile = async (uid: string): Promise<CadetProfile | null> => {
  const snap = await getDoc(doc(db, 'cadets', uid));
  return snap.exists() ? (snap.data() as CadetProfile) : null;
};

export const saveCadetProfile = async (uid: string, data: Partial<CadetProfile>): Promise<void> => {
  await setDoc(doc(db, 'cadets', uid), { ...data, uid, updatedAt: serverTimestamp() }, { merge: true });
};

export const updateUserProfile = async (uid: string, data: any): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const getAllCadets = async (): Promise<CadetProfile[]> => {
  const snap = await getDocs(collection(db, 'cadets'));
  return snap.docs.map((d) => d.data() as CadetProfile);
};

/** Fetch cadets filtered to a specific wing — for domain-scoped ANO views */
export const getCadetsByWing = async (branch: Wing): Promise<CadetProfile[]> => {
  const q = query(collection(db, 'cadets'), where('branch', '==', branch));
  const snap = await getDocs(q);
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

/** Returns only verified skills for a cadet — for ANO views */
export const getCadetVerifiedSkills = async (uid: string): Promise<Skill[]> => {
  const skills = await getCadetSkills(uid);
  return skills.filter((s) => s.verificationStatus === 'verified');
};

// ─── Achievements ─────────────────────────────────────────────────────────────

export const getCadetAchievements = async (uid: string): Promise<Achievement[]> => {
  const q = query(collection(db, 'achievements'), where('uid', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
};

export const getCadetVerifiedAchievements = async (uid: string): Promise<Achievement[]> => {
  const q = query(
    collection(db, 'achievements'),
    where('uid', '==', uid),
    where('verificationStatus', '==', 'verified'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
};

export const addAchievement = async (uid: string, data: Omit<Achievement, 'id' | 'uid' | 'createdAt' | 'verificationStatus' | 'verifiedBy' | 'verifiedAt' | 'rejectionReason'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'achievements'), {
    ...data,
    uid,
    verificationStatus: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateAchievement = async (id: string, data: Partial<Achievement>): Promise<void> => {
  await updateDoc(doc(db, 'achievements', id), data);
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

export const getCadetVerifiedCamps = async (uid: string): Promise<CampRecord[]> => {
  const q = query(
    collection(db, 'camps'),
    where('uid', '==', uid),
    where('verificationStatus', '==', 'verified'),
    orderBy('year', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampRecord));
};

export const addCampRecord = async (uid: string, data: Omit<CampRecord, 'id' | 'uid' | 'createdAt' | 'verificationStatus' | 'verifiedBy' | 'verifiedAt' | 'rejectionReason'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'camps'), {
    ...data,
    uid,
    verificationStatus: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
};

export const updateCampRecord = async (id: string, data: Partial<CampRecord>): Promise<void> => {
  await updateDoc(doc(db, 'camps', id), data);
};

export const deleteCampRecord = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'camps', id));
};

// ─── Verification Engine ──────────────────────────────────────────────────────

/**
 * Verify or reject a skill within a cadet's skills document.
 * Skills are stored as an array inside a single doc per cadet.
 */
export const verifySkill = async (
  cadetUid: string,
  skillId: string,
  status: VerificationStatus,
  verifiedByName: string,
  rejectionReason?: string
): Promise<void> => {
  const skills = await getCadetSkills(cadetUid);
  const updated = skills.map((s) =>
    s.id === skillId
      ? {
          ...s,
          verificationStatus: status,
          verifiedBy: verifiedByName,
          verifiedAt: new Date().toISOString(),
          ...(rejectionReason ? { rejectionReason } : { rejectionReason: '' }),
        }
      : s
  );
  await saveCadetSkills(cadetUid, updated);
};

/**
 * Resubmit a rejected skill (reset to pending, clear rejection reason).
 */
export const resubmitSkill = async (cadetUid: string, skillId: string): Promise<void> => {
  const skills = await getCadetSkills(cadetUid);
  const updated = skills.map((s) =>
    s.id === skillId
      ? { ...s, verificationStatus: 'pending' as VerificationStatus, rejectionReason: '', verifiedBy: undefined, verifiedAt: undefined }
      : s
  );
  await saveCadetSkills(cadetUid, updated);
};

/**
 * Verify or reject an achievement document.
 */
export const verifyAchievement = async (
  id: string,
  status: VerificationStatus,
  verifiedByName: string,
  rejectionReason?: string
): Promise<void> => {
  await updateDoc(doc(db, 'achievements', id), {
    verificationStatus: status,
    verifiedBy: verifiedByName,
    verifiedAt: serverTimestamp(),
    ...(rejectionReason !== undefined ? { rejectionReason } : {}),
  });
};

/**
 * Verify or reject a camp record document.
 */
export const verifyCampRecord = async (
  id: string,
  status: VerificationStatus,
  verifiedByName: string,
  rejectionReason?: string
): Promise<void> => {
  await updateDoc(doc(db, 'camps', id), {
    verificationStatus: status,
    verifiedBy: verifiedByName,
    verifiedAt: serverTimestamp(),
    ...(rejectionReason !== undefined ? { rejectionReason } : {}),
  });
};

/**
 * Get all pending verification items for cadets in a given wing.
 * Used by mod_cadet verify dashboard.
 */
export const getPendingVerifications = async (
  branch: Wing,
  allCadetProfiles: CadetProfile[]
): Promise<PendingVerificationItem[]> => {
  const wingCadets = allCadetProfiles.filter((c) => c.branch === branch);
  const items: PendingVerificationItem[] = [];

  await Promise.all(
    wingCadets.map(async (cadet) => {
      const cadetName = `${cadet.firstName} ${cadet.lastName}`;

      // Pending skills
      const skills = await getCadetSkills(cadet.uid);
      skills
        .filter((s) => s.verificationStatus === 'pending')
        .forEach((s) =>
          items.push({
            type: 'skill',
            itemId: s.id,
            cadetUid: cadet.uid,
            cadetName,
            cadetBranch: cadet.branch,
            title: s.name,
            details: `Level ${s.level} — ${s.category}`,
            submittedAt: s.addedAt as unknown as Date,
          })
        );

      // Pending achievements
      const q1 = query(
        collection(db, 'achievements'),
        where('uid', '==', cadet.uid),
        where('verificationStatus', '==', 'pending')
      );
      const ach = await getDocs(q1);
      ach.docs.forEach((d) => {
        const a = d.data() as Achievement;
        items.push({
          type: 'achievement',
          itemId: d.id,
          cadetUid: cadet.uid,
          cadetName,
          cadetBranch: cadet.branch,
          title: a.title,
          details: a.description,
          submittedAt: a.createdAt as unknown as Date,
        });
      });

      // Pending camps
      const q2 = query(
        collection(db, 'camps'),
        where('uid', '==', cadet.uid),
        where('verificationStatus', '==', 'pending')
      );
      const camps = await getDocs(q2);
      camps.docs.forEach((d) => {
        const c = d.data() as CampRecord;
        items.push({
          type: 'camp',
          itemId: d.id,
          cadetUid: cadet.uid,
          cadetName,
          cadetBranch: cadet.branch,
          title: c.campType,
          details: `${c.year} · ${c.location} · Grade ${c.grade}`,
          submittedAt: c.createdAt as unknown as Date,
        });
      });
    })
  );

  return items.sort((a, b) => {
    const at = a.submittedAt instanceof Date ? a.submittedAt.getTime() : 0;
    const bt = b.submittedAt instanceof Date ? b.submittedAt.getTime() : 0;
    return bt - at;
  });
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

export const getEvaluationsByWing = async (branch: Wing): Promise<SemesterEvaluation[]> => {
  // Evaluations don't store branch directly; we join via cadet profiles
  const cadets = await getCadetsByWing(branch);
  const cadetUids = new Set(cadets.map((c) => c.uid));
  const all = await getAllEvaluations();
  return all.filter((e) => cadetUids.has(e.cadetUid));
};

export const saveEvaluation = async (data: Omit<SemesterEvaluation, 'id' | 'createdAt'>): Promise<string> => {
  const q = query(
    collection(db, 'evaluations'),
    where('cadetUid', '==', data.cadetUid),
    where('semester', '==', data.semester),
    where('year', '==', data.year)
  );
  const snap = await getDocs(q);

  if (!snap.empty) {
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

export const deleteEvaluation = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'evaluations', id));
};

// ─── Camp Recommendation Engine ───────────────────────────────────────────────

const CAMP_CRITERIA: Record<string, { skills: Record<string, number>; evalFields: string[]; minAttendance?: number }> = {
  Sailing: { skills: { Swimming: 4, 'Boat Pulling': 4 }, evalFields: ['discipline'], minAttendance: 80 },
  RDC: { skills: { Drill: 4, Parade: 4 }, evalFields: ['discipline', 'drill', 'leadership'] },
  Trekking: { skills: {}, evalFields: ['physicalFitness', 'initiative', 'teamwork'] },
  NIC: { skills: {}, evalFields: ['communication', 'leadership'] },
  CATC: { skills: { Drill: 3, Parade: 3 }, evalFields: ['discipline', 'teamwork'] },
  SNIC: { skills: {}, evalFields: ['communication', 'leadership', 'teamwork'] },
};

export const runCampRecommendation = async (
  campType: string,
  seats: number,
  branch?: Wing  // optional wing filter for ANO scoping
): Promise<RecommendedCadet[]> => {
  const criteria = CAMP_CRITERIA[campType] || { skills: {}, evalFields: [] };

  const cadets = branch ? await getCadetsByWing(branch) : await getAllCadets();
  const [allSkillsDocs, allEvals] = await Promise.all([
    getDocs(collection(db, 'skills')),
    branch ? getEvaluationsByWing(branch) : getAllEvaluations(),
  ]);

  // Only use verified skills for recommendation
  const skillsMap: Record<string, Skill[]> = {};
  allSkillsDocs.docs.forEach((d) => {
    const data = d.data() as CadetSkills;
    skillsMap[d.id] = (data.skills || []).filter((s) => s.verificationStatus === 'verified');
  });

  const evalsMap: Record<string, SemesterEvaluation | null> = {};
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

    const skillScores: Record<string, number> = {};
    let meetsSkillReq = true;
    for (const [skillName, minLevel] of Object.entries(criteria.skills)) {
      const found = cadetSkills.find((s) => s.name.toLowerCase() === skillName.toLowerCase());
      const level = found?.level || 0;
      skillScores[skillName] = level;
      if (level < minLevel) { meetsSkillReq = false; break; }
    }
    if (!meetsSkillReq) continue;

    if (criteria.minAttendance && latestEval) {
      if (latestEval.attendance * 20 < criteria.minAttendance) continue;
    }

    let skillTotal = 0;
    cadetSkills.forEach((s) => { skillTotal += s.level; });

    let evalTotal = 0; let evalCount = 0;
    if (latestEval) {
      criteria.evalFields.forEach((field) => {
        evalTotal += (latestEval as unknown as Record<string, number>)[field] || 0;
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

  results.sort((a, b) => b.totalScore - a.totalScore);
  results.forEach((r, i) => { r.rank = i + 1; });
  return results.slice(0, seats);
};

// ─── Admin Tools ──────────────────────────────────────────────────────────────

export const getAllUsers = async (): Promise<UserProfile[]> => {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs.map((d) => d.data() as UserProfile);
};

export const updateUserRole = async (uid: string, role: string): Promise<void> => {
  await updateDoc(doc(db, 'users', uid), { role });
};

export const updateUserBranch = async (uid: string, branch: Wing): Promise<void> => {
  await Promise.all([
    updateDoc(doc(db, 'users', uid), { branch }),
    setDoc(doc(db, 'cadets', uid), { branch }, { merge: true }),
  ]);
};

export const updateUserNccRank = async (uid: string, nccRank: string): Promise<void> => {
  await Promise.all([
    updateDoc(doc(db, 'users', uid), { nccRank }),
    setDoc(doc(db, 'cadets', uid), { nccRank }, { merge: true }),
  ]);
};

export const deleteUserDoc = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'users', uid));
  try { await deleteDoc(doc(db, 'cadets', uid)); } catch (e) {}
  try { await deleteDoc(doc(db, 'skills', uid)); } catch (e) {}
};

export const deleteCadetDoc = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, 'cadets', uid));
};

export const getAllAchievementsAdmin = async (): Promise<Achievement[]> => {
  const snap = await getDocs(collection(db, 'achievements'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Achievement));
};

export const getAllCampsAdmin = async (): Promise<CampRecord[]> => {
  const snap = await getDocs(collection(db, 'camps'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampRecord));
};

export const getAllSkillsAdmin = async (): Promise<CadetSkills[]> => {
  const snap = await getDocs(collection(db, 'skills'));
  return snap.docs.map((d) => d.data() as CadetSkills);
};

export const deleteEvaluationAdmin = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'evaluations', id));
};

/** Admin: verify or reject any item across all wings */
export const adminVerifySkill = async (cadetUid: string, skillId: string, status: VerificationStatus, reason?: string): Promise<void> => {
  await verifySkill(cadetUid, skillId, status, 'Admin', reason);
};

export const adminVerifyAchievement = async (id: string, status: VerificationStatus, reason?: string): Promise<void> => {
  await verifyAchievement(id, status, 'Admin', reason);
};

export const adminVerifyCampRecord = async (id: string, status: VerificationStatus, reason?: string): Promise<void> => {
  await verifyCampRecord(id, status, 'Admin', reason);
};

/** Admin: get all pending verifications across ALL wings */
export const getAllPendingVerifications = async (): Promise<PendingVerificationItem[]> => {
  const allCadets = await getAllCadets();
  const items: PendingVerificationItem[] = [];

  await Promise.all(
    allCadets.map(async (cadet) => {
      const cadetName = `${cadet.firstName} ${cadet.lastName}`;

      const skills = await getCadetSkills(cadet.uid);
      skills.filter((s) => s.verificationStatus === 'pending').forEach((s) =>
        items.push({
          type: 'skill', itemId: s.id, cadetUid: cadet.uid,
          cadetName, cadetBranch: cadet.branch,
          title: s.name, details: `Level ${s.level} — ${s.category}`,
          submittedAt: s.addedAt as unknown as Date,
        })
      );

      const q1 = query(collection(db, 'achievements'), where('uid', '==', cadet.uid), where('verificationStatus', '==', 'pending'));
      const ach = await getDocs(q1);
      ach.docs.forEach((d) => {
        const a = d.data() as Achievement;
        items.push({
          type: 'achievement', itemId: d.id, cadetUid: cadet.uid,
          cadetName, cadetBranch: cadet.branch,
          title: a.title, details: a.description,
          submittedAt: a.createdAt as unknown as Date,
        });
      });

      const q2 = query(collection(db, 'camps'), where('uid', '==', cadet.uid), where('verificationStatus', '==', 'pending'));
      const camps = await getDocs(q2);
      camps.docs.forEach((d) => {
        const c = d.data() as CampRecord;
        items.push({
          type: 'camp', itemId: d.id, cadetUid: cadet.uid,
          cadetName, cadetBranch: cadet.branch,
          title: c.campType, details: `${c.year} · ${c.location} · Grade ${c.grade}`,
          submittedAt: c.createdAt as unknown as Date,
        });
      });
    })
  );

  return items.sort((a, b) => {
    const at = a.submittedAt instanceof Date ? a.submittedAt.getTime() : 0;
    const bt = b.submittedAt instanceof Date ? b.submittedAt.getTime() : 0;
    return bt - at;
  });
};
