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
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type {
  CadetProfile,
  CadetSkills,
  Skill,
  Achievement,
  CampRecord,
  CampEvent,
  SemesterEvaluation,
  RecommendedCadet,
  UserProfile,
  Wing,
  VerificationStatus,
  PendingVerificationItem,
  ParadeSession,
  AttendanceRecord,
  AttendanceStatus,
  TrainingSession,
  NccEvent,
  Announcement,
  AnnouncementTarget,
  NccDocument,
  InventoryItem,
  InventoryIssue,
  MedicalRecord,
  PromotionRecord,
  EnrollmentApplication,
  ApplicationStatus,
  FinanceRecord,
  AlumniProfile,
  AuditLog,
  AuditAction,
  UserRole,
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

// ─── Audit Logging ────────────────────────────────────────────────────────────

export const writeAuditLog = async (
  actorUid: string,
  actorName: string,
  actorRole: UserRole,
  action: AuditAction,
  module: string,
  targetId?: string,
  targetDescription?: string,
  details?: string
): Promise<void> => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      actorUid, actorName, actorRole, action, module,
      targetId, targetDescription, details,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // Non-critical — don't block main operations
    console.warn('Audit log failed:', e);
  }
};

export const getRecentAuditLogs = async (limitCount = 50): Promise<AuditLog[]> => {
  const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AuditLog));
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

export const getCadetsByLifecycle = async (status: string): Promise<CadetProfile[]> => {
  const q = query(collection(db, 'cadets'), where('lifecycleStatus', '==', status));
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

// ─── Camp Events (Unit-Level) ──────────────────────────────────────────────────

export const getAllCampEvents = async (): Promise<CampEvent[]> => {
  const q = query(collection(db, 'camp_events'), orderBy('startDate', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as CampEvent));
};

export const getCampEvent = async (id: string): Promise<CampEvent | null> => {
  const snap = await getDoc(doc(db, 'camp_events', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as CampEvent) : null;
};

export const addCampEvent = async (data: Omit<CampEvent, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'camp_events'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
};

export const updateCampEvent = async (id: string, data: Partial<CampEvent>): Promise<void> => {
  await updateDoc(doc(db, 'camp_events', id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteCampEvent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'camp_events', id));
};

// ─── Verification Engine ──────────────────────────────────────────────────────

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
        verifiedAt: new Date() as any,
        ...(rejectionReason ? { rejectionReason } : { rejectionReason: '' }),
      }
      : s
  );
  await saveCadetSkills(cadetUid, updated);
};

export const resubmitSkill = async (cadetUid: string, skillId: string): Promise<void> => {
  const skills = await getCadetSkills(cadetUid);
  const updated = skills.map((s) =>
    s.id === skillId
      ? { ...s, verificationStatus: 'pending' as VerificationStatus, rejectionReason: '', verifiedBy: undefined, verifiedAt: undefined }
      : s
  );
  await saveCadetSkills(cadetUid, updated);
};

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

export const getPendingVerifications = async (
  branch: Wing,
  allCadetProfiles: CadetProfile[]
): Promise<PendingVerificationItem[]> => {
  const wingCadets = allCadetProfiles.filter((c) => c.branch === branch);
  const items: PendingVerificationItem[] = [];

  await Promise.all(
    wingCadets.map(async (cadet) => {
      const cadetName = `${cadet.firstName} ${cadet.lastName}`;

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

// ─── Parades & Attendance ─────────────────────────────────────────────────────

export const getAllParades = async (): Promise<ParadeSession[]> => {
  const q = query(collection(db, 'parades'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ParadeSession));
};

export const getParadesByWing = async (wing: Wing | 'All'): Promise<ParadeSession[]> => {
  const q = query(
    collection(db, 'parades'),
    where('wing', 'in', [wing, 'All']),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ParadeSession));
};

export const getParade = async (id: string): Promise<ParadeSession | null> => {
  const snap = await getDoc(doc(db, 'parades', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as ParadeSession) : null;
};

export const addParade = async (data: Omit<ParadeSession, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'parades'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const updateParade = async (id: string, data: Partial<ParadeSession>): Promise<void> => {
  await updateDoc(doc(db, 'parades', id), data);
};

export const deleteParade = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'parades', id));
};

export const getAttendanceForParade = async (paradeId: string): Promise<AttendanceRecord[]> => {
  const q = query(collection(db, 'attendance'), where('paradeId', '==', paradeId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
};

export const getCadetAttendance = async (cadetUid: string): Promise<AttendanceRecord[]> => {
  const q = query(collection(db, 'attendance'), where('cadetUid', '==', cadetUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as AttendanceRecord));
};

export const markAttendanceBulk = async (
  paradeId: string,
  records: { cadetUid: string; status: AttendanceStatus; remarks?: string }[],
  markedBy: string
): Promise<void> => {
  const batch = writeBatch(db);
  for (const r of records) {
    const ref = doc(collection(db, 'attendance'));
    batch.set(ref, {
      paradeId,
      cadetUid: r.cadetUid,
      status: r.status,
      remarks: r.remarks || '',
      markedBy,
      markedAt: serverTimestamp(),
    });
  }
  await batch.commit();
};

export const updateAttendanceRecord = async (id: string, status: AttendanceStatus, remarks?: string): Promise<void> => {
  await updateDoc(doc(db, 'attendance', id), { status, remarks });
};

// ─── Training Sessions ────────────────────────────────────────────────────────

export const getAllTrainingSessions = async (): Promise<TrainingSession[]> => {
  const q = query(collection(db, 'training_sessions'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TrainingSession));
};

export const addTrainingSession = async (data: Omit<TrainingSession, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'training_sessions'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const deleteTrainingSession = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'training_sessions', id));
};

// ─── Events & Activities ──────────────────────────────────────────────────────

export const getAllEvents = async (): Promise<NccEvent[]> => {
  const q = query(collection(db, 'events'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NccEvent));
};

export const getEvent = async (id: string): Promise<NccEvent | null> => {
  const snap = await getDoc(doc(db, 'events', id));
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as NccEvent) : null;
};

export const addEvent = async (data: Omit<NccEvent, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'events'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
};

export const updateEvent = async (id: string, data: Partial<NccEvent>): Promise<void> => {
  await updateDoc(doc(db, 'events', id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteEvent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'events', id));
};

// ─── Announcements ────────────────────────────────────────────────────────────

export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Announcement));
};

export const getAnnouncementsForCadet = async (
  cadetUid: string,
  wing: Wing
): Promise<Announcement[]> => {
  const snap = await getDocs(query(collection(db, 'announcements'), orderBy('createdAt', 'desc')));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Announcement))
    .filter((a) => {
      if (a.target === 'all') return true;
      if (a.target === 'army' && wing === 'Army') return true;
      if (a.target === 'navy' && wing === 'Navy') return true;
      if (a.target === 'air_force' && wing === 'Air Force') return true;
      if (a.target === 'cadets_only') return true;
      if (a.target === 'specific' && a.targetUids?.includes(cadetUid)) return true;
      return false;
    });
};

export const addAnnouncement = async (data: Omit<Announcement, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'announcements'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const updateAnnouncement = async (id: string, data: Partial<Announcement>): Promise<void> => {
  await updateDoc(doc(db, 'announcements', id), data);
};

export const deleteAnnouncement = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'announcements', id));
};

// ─── Documents ────────────────────────────────────────────────────────────────

export const getAllDocuments = async (): Promise<NccDocument[]> => {
  const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as NccDocument));
};

export const addDocument = async (data: Omit<NccDocument, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'documents'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const deleteDocument = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'documents', id));
};

// ─── Inventory ────────────────────────────────────────────────────────────────

export const getAllInventory = async (): Promise<InventoryItem[]> => {
  const snap = await getDocs(collection(db, 'inventory'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryItem));
};

export const addInventoryItem = async (data: Omit<InventoryItem, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'inventory'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
};

export const updateInventoryItem = async (id: string, data: Partial<InventoryItem>): Promise<void> => {
  await updateDoc(doc(db, 'inventory', id), { ...data, updatedAt: serverTimestamp() });
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'inventory', id));
};

export const getInventoryIssuesByCadet = async (cadetUid: string): Promise<InventoryIssue[]> => {
  const q = query(collection(db, 'inventory_issues'), where('cadetUid', '==', cadetUid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryIssue));
};

export const getAllInventoryIssues = async (): Promise<InventoryIssue[]> => {
  const snap = await getDocs(collection(db, 'inventory_issues'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as InventoryIssue));
};

export const addInventoryIssue = async (data: Omit<InventoryIssue, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'inventory_issues'), { ...data, createdAt: serverTimestamp() });
  // Decrement available quantity
  await updateDoc(doc(db, 'inventory', data.itemId), {
    availableQuantity: (await getDoc(doc(db, 'inventory', data.itemId))).data()!.availableQuantity - data.quantity,
    updatedAt: serverTimestamp(),
  });
  return ref.id;
};

export const returnInventoryIssue = async (id: string, itemId: string, qty: number, returnedTo: string): Promise<void> => {
  await updateDoc(doc(db, 'inventory_issues', id), {
    returnedDate: new Date().toISOString().split('T')[0],
    returnedTo,
  });
  const itemSnap = await getDoc(doc(db, 'inventory', itemId));
  if (itemSnap.exists()) {
    await updateDoc(doc(db, 'inventory', itemId), {
      availableQuantity: itemSnap.data().availableQuantity + qty,
      updatedAt: serverTimestamp(),
    });
  }
};

// ─── Medical Records ──────────────────────────────────────────────────────────

export const getMedicalRecordsByCadet = async (cadetUid: string): Promise<MedicalRecord[]> => {
  const q = query(collection(db, 'medical_records'), where('cadetUid', '==', cadetUid), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
};

export const getAllMedicalRecords = async (): Promise<MedicalRecord[]> => {
  const snap = await getDocs(collection(db, 'medical_records'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as MedicalRecord));
};

export const addMedicalRecord = async (data: Omit<MedicalRecord, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'medical_records'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const deleteMedicalRecord = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'medical_records', id));
};

// ─── Promotions ───────────────────────────────────────────────────────────────

export const getAllPromotions = async (): Promise<PromotionRecord[]> => {
  const q = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PromotionRecord));
};

export const addPromotion = async (data: Omit<PromotionRecord, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'promotions'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const approvePromotion = async (
  id: string,
  cadetUid: string,
  toRank: string,
  approvedBy: string
): Promise<void> => {
  await updateDoc(doc(db, 'promotions', id), {
    status: 'approved',
    approvedBy,
    approvedAt: serverTimestamp(),
  });
  // Update cadet rank in users and cadets collections
  await Promise.all([
    updateDoc(doc(db, 'users', cadetUid), { nccRank: toRank }),
    updateDoc(doc(db, 'cadets', cadetUid), { nccRank: toRank, updatedAt: serverTimestamp() }),
  ]);
};

export const rejectPromotion = async (id: string): Promise<void> => {
  await updateDoc(doc(db, 'promotions', id), { status: 'rejected' });
};

// ─── Enrollment Applications ──────────────────────────────────────────────────

export const getAllApplications = async (): Promise<EnrollmentApplication[]> => {
  const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as EnrollmentApplication));
};

export const addApplication = async (data: Omit<EnrollmentApplication, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'applications'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
};

export const updateApplicationStatus = async (
  id: string,
  status: ApplicationStatus,
  remarks?: string,
  reviewedBy?: string
): Promise<void> => {
  const snap = await getDoc(doc(db, 'applications', id));
  if (!snap.exists()) return;
  
  const existing = snap.data() as EnrollmentApplication;
  const history = existing.statusHistory || [];
  history.push({ status, date: new Date().toISOString().split('T')[0], remarks: remarks || '' });

  const updateData: any = {
    status,
    statusHistory: history,
    updatedAt: serverTimestamp(),
  };

  if (remarks !== undefined || existing.remarks !== undefined) {
    updateData.remarks = remarks || existing.remarks || '';
  }
  if (reviewedBy !== undefined || existing.reviewedBy !== undefined) {
    updateData.reviewedBy = reviewedBy || existing.reviewedBy || '';
  }

  await updateDoc(doc(db, 'applications', id), updateData);
};

// ─── Finance ──────────────────────────────────────────────────────────────────

export const getAllFinanceRecords = async (): Promise<FinanceRecord[]> => {
  const q = query(collection(db, 'finance_records'), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as FinanceRecord));
};

export const addFinanceRecord = async (data: Omit<FinanceRecord, 'id'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'finance_records'), { ...data, createdAt: serverTimestamp() });
  return ref.id;
};

export const updateFinanceRecord = async (id: string, data: Partial<FinanceRecord>): Promise<void> => {
  await updateDoc(doc(db, 'finance_records', id), data);
};

export const deleteFinanceRecord = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, 'finance_records', id));
};

// ─── Alumni ───────────────────────────────────────────────────────────────────

export const getAllAlumni = async (): Promise<AlumniProfile[]> => {
  const snap = await getDocs(collection(db, 'alumni_profiles'));
  return snap.docs.map((d) => d.data() as AlumniProfile);
};

export const getAlumniProfile = async (uid: string): Promise<AlumniProfile | null> => {
  const snap = await getDoc(doc(db, 'alumni_profiles', uid));
  return snap.exists() ? (snap.data() as AlumniProfile) : null;
};

export const saveAlumniProfile = async (uid: string, data: Partial<AlumniProfile>): Promise<void> => {
  await setDoc(doc(db, 'alumni_profiles', uid), { ...data, uid, updatedAt: serverTimestamp() }, { merge: true });
};

// ─── Camp Recommendation Engine ───────────────────────────────────────────────

const CAMP_CRITERIA: Record<string, { skills: Record<string, number>; evalFields: string[]; minAttendance?: number }> = {
  Sailing: { skills: { Swimming: 4, 'Boat Pulling': 4 }, evalFields: ['discipline'], minAttendance: 80 },
  RDC: { skills: { Drill: 4, Parade: 4 }, evalFields: ['discipline', 'drill', 'leadership'] },
  Trekking: { skills: {}, evalFields: ['physicalFitness', 'initiative', 'teamwork'] },
  NIC: { skills: {}, evalFields: ['communication', 'leadership'] },
  CATC: { skills: { Drill: 3, Parade: 3 }, evalFields: ['discipline', 'teamwork'] },
  SNIC: { skills: {}, evalFields: ['communication', 'leadership', 'teamwork'] },
  'Pre-RDC': { skills: { Drill: 3, Parade: 3 }, evalFields: ['discipline', 'drill'] },
  ATC: { skills: { Drill: 3 }, evalFields: ['discipline', 'physicalFitness'] },
  WATC: { skills: {}, evalFields: ['physicalFitness', 'teamwork', 'discipline'] },
};

export const runCampRecommendation = async (
  campType: string,
  seats: number,
  branch?: Wing
): Promise<RecommendedCadet[]> => {
  const criteria = CAMP_CRITERIA[campType] || { skills: {}, evalFields: [] };

  const cadets = branch ? await getCadetsByWing(branch) : await getAllCadets();
  const [allSkillsDocs, allEvals] = await Promise.all([
    getDocs(collection(db, 'skills')),
    branch ? getEvaluationsByWing(branch) : getAllEvaluations(),
  ]);

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
  try { await deleteDoc(doc(db, 'cadets', uid)); } catch (e) { }
  try { await deleteDoc(doc(db, 'skills', uid)); } catch (e) { }
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

export const adminVerifySkill = async (cadetUid: string, skillId: string, status: VerificationStatus, reason?: string): Promise<void> => {
  await verifySkill(cadetUid, skillId, status, 'Admin', reason);
};

export const adminVerifyAchievement = async (id: string, status: VerificationStatus, reason?: string): Promise<void> => {
  await verifyAchievement(id, status, 'Admin', reason);
};

export const adminVerifyCampRecord = async (id: string, status: VerificationStatus, reason?: string): Promise<void> => {
  await verifyCampRecord(id, status, 'Admin', reason);
};

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
