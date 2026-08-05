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
import { UserProfile } from '@/types';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// ─── Google Auth ─────────────────────────────────────────────────────────────

export const signInWithGoogle = async (): Promise<{ user: User; isNewUser: boolean }> => {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'cadet',
      createdAt: serverTimestamp(),
    });
    return { user, isNewUser: true };
  }

  return { user, isNewUser: false };
};

// ─── Email / Password Auth ───────────────────────────────────────────────────

export interface RegisterData {
  // Account
  email: string;
  password: string;
  // Personal
  firstName: string;
  lastName: string;
  // NCC Details
  rollNumber: string;
  college: string;
  branch: 'Army' | 'Navy' | 'Air Force';
  semester: number;
  // Contact & Medical
  bloodGroup: string;
  phone: string;
  dateOfBirth: string;
  // ANO support
  isAno?: boolean;
}

export const registerWithEmail = async (data: RegisterData): Promise<User> => {
  // 1. Create Firebase Auth user
  const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user = result.user;

  // 2. Set display name
  const displayName = `${data.firstName} ${data.lastName}`;
  await updateProfile(user, { displayName });

  // 3. Create user doc in /users
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName,
    photoURL: null,
    role: data.isAno ? 'ano' : 'cadet',
    createdAt: serverTimestamp(),
  });

  // 4. Pre-fill cadet profile only if it's a cadet
  if (!data.isAno) {
    await setDoc(doc(db, 'cadets', user.uid), {
      uid: user.uid,
      firstName: data.firstName,
      lastName: data.lastName,
      rollNumber: data.rollNumber,
      college: data.college,
      branch: data.branch,
      semester: data.semester,
      bloodGroup: data.bloodGroup,
      phone: data.phone,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      // Defaults
      address: '',
      city: '',
      state: '',
      emergencyName: '',
      emergencyRelation: '',
      emergencyPhone: '',
      medicalIssues: false,
      medicalDetails: '',
      profileComplete: !!(data.firstName && data.lastName && data.phone && data.rollNumber),
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

// ─── Common ──────────────────────────────────────────────────────────────────

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
