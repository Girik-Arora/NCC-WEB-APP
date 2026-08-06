'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile?.role === 'ano' || userProfile?.role === 'admin') {
        router.replace('/ano/dashboard');
      } else {
        router.replace('/cadet/dashboard');
      }
    }
  }, [user, userProfile, loading, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8f9fc' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', boxShadow: '0 8px 24px rgba(30,58,95,0.3)'
        }}>
          <span style={{ color: 'white', fontSize: 24, fontWeight: 700 }}>⚔</span>
        </div>
        <p style={{ color: '#475569', fontSize: 14 }}>Loading NCC TCET...</p>
      </div>
    </div>
  );
}
