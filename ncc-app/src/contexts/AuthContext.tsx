'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile, CadetProfile } from '@/types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  cadetProfile: CadetProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  cadetProfile: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [cadetProfile, setCadetProfile] = useState<CadetProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Safety net: never hang on loading screen more than 5s
  useEffect(() => {
    timeoutRef.current = setTimeout(() => setLoading(false), 5000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserProfile(null);
        setCadetProfile(null);
        setLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        return;
      }

      // Fast path: fetch profile once immediately (no waiting for snapshot)
      try {
        const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (snap.exists()) setUserProfile(snap.data() as UserProfile);
      } catch (_) {
        // ignore — real-time listener below will catch it
      } finally {
        setLoading(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time profile listener (runs after first fast load)
  useEffect(() => {
    if (!user) return;

    const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserProfile);
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribeProfile();
  }, [user]);

  // Cadet profile listener
  useEffect(() => {
    if (!user || (userProfile?.role !== 'cadet' && userProfile?.role !== 'mod_cadet')) {
      setCadetProfile(null);
      return;
    }
    const unsubscribeCadet = onSnapshot(doc(db, 'cadets', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setCadetProfile(docSnap.data() as CadetProfile);
      } else {
        setCadetProfile(null);
      }
    });
    return () => unsubscribeCadet();
  }, [user, userProfile?.role]);

  return (
    <AuthContext.Provider value={{ user, userProfile, cadetProfile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
