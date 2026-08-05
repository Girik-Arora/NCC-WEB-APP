'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetProfile, saveCadetProfile } from '@/lib/db';
import toast from 'react-hot-toast';
import { Calendar, CheckCircle, XCircle, Info } from 'lucide-react';

export default function AvailabilityPage() {
  const { user } = useAuth();
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getCadetProfile(user.uid).then((p) => {
      if (p) setAvailable(p.availability ?? true);
      setLoading(false);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveCadetProfile(user.uid, { availability: available });
      toast.success('Availability updated!');
    } catch {
      toast.error('Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Availability</h1>
        <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Let your ANO know if you are available for upcoming camps and activities.</p>
      </div>

      <div className="card" style={{ maxWidth: 540 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={22} color="#2563eb" />
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Camp Availability Status</h3>
            <p style={{ fontSize: 13, color: '#64748b' }}>This affects whether you appear in camp recommendation results.</p>
          </div>
        </div>

        {loading ? (
          <div style={{ height: 80, background: '#e2e8f0', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }}>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>
          </div>
        ) : (
          <>
            {/* Toggle options */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button
                onClick={() => setAvailable(true)}
                style={{
                  flex: 1, padding: '16px 20px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${available ? '#16a34a' : '#e2e8f0'}`,
                  background: available ? '#f0fdf4' : 'white',
                  transition: 'all 0.2s', textAlign: 'center' as const,
                }}
              >
                <CheckCircle size={28} color={available ? '#16a34a' : '#cbd5e1'} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 700, fontSize: 15, color: available ? '#15803d' : '#94a3b8' }}>Available</p>
                <p style={{ fontSize: 12, color: available ? '#16a34a' : '#94a3b8', marginTop: 2 }}>Ready for camps & activities</p>
              </button>

              <button
                onClick={() => setAvailable(false)}
                style={{
                  flex: 1, padding: '16px 20px', borderRadius: 10, cursor: 'pointer',
                  border: `2px solid ${!available ? '#dc2626' : '#e2e8f0'}`,
                  background: !available ? '#fef2f2' : 'white',
                  transition: 'all 0.2s', textAlign: 'center' as const,
                }}
              >
                <XCircle size={28} color={!available ? '#dc2626' : '#cbd5e1'} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontWeight: 700, fontSize: 15, color: !available ? '#b91c1c' : '#94a3b8' }}>Unavailable</p>
                <p style={{ fontSize: 12, color: !available ? '#dc2626' : '#94a3b8', marginTop: 2 }}>Skip from recommendations</p>
              </button>
            </div>

            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 8 }}>
              <Info size={16} color="#0369a1" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.5 }}>
                When set to <strong>Unavailable</strong>, you won't appear in camp recommendation results. Update this whenever your availability changes.
              </p>
            </div>

            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </>
        )}
      </div>
    </AppShell>
  );
}
