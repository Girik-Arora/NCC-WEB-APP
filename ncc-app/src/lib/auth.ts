import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, Wing, getRoleFromRank } from '@/types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─── Google Auth ──────────────────────────────────────────────────────────────

export const signInWithGoogle = async (): Promise<{ user: User; isNewUser: boolean }> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // New Google user — create a placeholder; onboarding form collects wing/rank
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'cadet',
      createdAt: serverTimestamp(),
    });

    const [firstName = '', lastName = ''] = (user.displayName || '').split(' ');
    await setDoc(doc(db, 'cadets', user.uid), {
      uid: user.uid,
      firstName,
      lastName: user.displayName?.split(' ').slice(1).join(' ') || lastName,
      rollNumber: '',
      college: '',
      branch: 'Army',
      nccRank: 'CDT',
      semester: 1,
      bloodGroup: 'O+',
      phone: '',
      gender: 'Male',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      medicalIssues: false,
      medicalDetails: '',
      profileComplete: false,
      availability: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { user, isNewUser: true };
  }

  return { user, isNewUser: false };
};

// ─── Email / Password Auth ────────────────────────────────────────────────────

export interface RegisterData {
  // Account
  email: string;
  password: string;
  // Personal
  firstName: string;
  lastName: string;
  // Contact & Academic
  phone?: string;
  rollNumber?: string;
  college?: string;
  semester?: number;
  // Wing & Rank (cadets and mod_cadets)
  branch?: Wing;
  nccRank?: string;
  // ANO-specific
  isAno?: boolean;
  anoRank?: string;
  anoBranch?: Wing;
}

export const registerWithEmail = async (data: RegisterData): Promise<User> => {
  // 1. Create Firebase Auth user
  const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user = result.user;

  // 2. Set display name
  const displayName = `${data.firstName} ${data.lastName}`;
  try {
    await updateProfile(user, { displayName });
  } catch (e) {
    console.warn('updateProfile failed (non-critical):', e);
  }

  // 3. Wait for auth token to propagate
  await new Promise((resolve) => setTimeout(resolve, 800));

  // 4. Determine role
  let role: 'cadet' | 'mod_cadet' | 'ano' = 'cadet';
  if (data.isAno) {
    role = 'ano';
  } else if (data.branch && data.nccRank) {
    role = getRoleFromRank(data.branch, data.nccRank);
  }

  const wing: Wing = data.isAno ? (data.anoBranch || 'Army') : (data.branch || 'Army');

  // 5. Create /users doc
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: null,
    role,
    branch: wing,
    ...(data.isAno
      ? { rank: data.anoRank || 'Lieutenant' }
      : { nccRank: data.nccRank || 'CDT' }),
    createdAt: serverTimestamp(),
  });

  // 6. Create /cadets doc (for cadets and mod_cadets)
  if (!data.isAno) {
    await setDoc(doc(db, 'cadets', user.uid), {
      uid: user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      rollNumber: data.rollNumber || '',
      college: data.college || '',
      branch: wing,
      nccRank: data.nccRank || 'CDT',
      semester: data.semester || 1,
      bloodGroup: 'O+',
      phone: data.phone || '',
      gender: 'Male',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      medicalIssues: false,
      medicalDetails: '',
      profileComplete: false,
      availability: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return user;
};

export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

export const sendPasswordReset = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email);
};

// ─── Common ───────────────────────────────────────────────────────────────────

export const signOutUser = async (): Promise<void> => {
  await signOut(auth);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  return null;
};

export { onAuthStateChanged, auth };
