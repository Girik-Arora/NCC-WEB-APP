'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile } from '@/lib/db';
import toast from 'react-hot-toast';
import { Save, User, Shield } from 'lucide-react';

const ANO_RANKS = [
  'Lieutenant',
  'Captain',
  'Major',
  'Sub Lieutenant',
  'Lieutenant Commander',
  'Flying Officer',
  'Flight Lieutenant',
  'Squadron Leader',
  'Third Officer',
  'Second Officer',
  'First Officer',
  'Chief Officer'
];

export default function AnoProfilePage() {
  const { user, userProfile } = useAuth();
  const [form, setForm] = useState({
    displayName: '',
    rank: 'Lieutenant',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setForm({
        displayName: userProfile.displayName || '',
        rank: userProfile.rank || 'Lieutenant',
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: form.displayName,
        rank: form.rank,
      });
      toast.success('Profile updated successfully');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell requiredRole={['ano', 'admin']}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #2563eb, #1e3a5f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
          }}>
            <User size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>Officer Profile</h1>
            <p style={{ color: '#64748b' }}>Manage your personal details</p>
          </div>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder="e.g. Sunil Khatri"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rank / Post</label>
              <select
                className="form-select"
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
              >
                {ANO_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 16 }}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppShell>
  );
}
