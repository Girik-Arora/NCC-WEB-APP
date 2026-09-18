'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetProfile, saveCadetProfile } from '@/lib/db';
import type { CadetProfile } from '@/types';
import { User, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Computer Engineering', 'Information Technology', 'EXTC', 'Mechanical', 'Civil', 'Electrical', 'AI & DS', 'AIDS', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ── These must be defined OUTSIDE the page component.
// ── Defining them inside causes React to unmount/remount inputs on every keystroke.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 22, marginBottom: 16 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border-light)' }}>{title}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>{children}</div>
    </div>
  );
}

function Field({ label, req, full, children }: { label: string; req?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
        {label} {req && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function CadetProfilePage() {
  const { userProfile } = useAuth();
  const [profile, setProfile] = useState<Partial<CadetProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userProfile?.uid) return;
    getCadetProfile(userProfile.uid).then(p => {
      if (p) setProfile(p);
      else setProfile({ uid: userProfile.uid, firstName: userProfile.displayName?.split(' ')[0] || '', lastName: userProfile.displayName?.split(' ').slice(1).join(' ') || '', branch: userProfile.branch });
    }).finally(() => setLoading(false));
  }, [userProfile]);

  const set = (field: string, value: any) => setProfile(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCadetProfile(userProfile!.uid, { ...profile, profileComplete: true });
      toast.success('Profile saved successfully!');
    } catch { toast.error('Failed to save profile'); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin', 'alumni']}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>My Profile</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Keep your NCC cadet record up to date</p>
          </div>
          <button onClick={handleSave} disabled={saving || loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--navy-600)', color: '#fff', padding: '10px 20px', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading…</div>
        ) : (
          <>
            <Section title="👤 Personal Information">
              <Field label="First Name" req><input value={profile.firstName || ''} onChange={e => set('firstName', e.target.value)} style={inputStyle} /></Field>
              <Field label="Last Name" req><input value={profile.lastName || ''} onChange={e => set('lastName', e.target.value)} style={inputStyle} /></Field>
              <Field label="Date of Birth"><input type="date" value={profile.dateOfBirth || ''} onChange={e => set('dateOfBirth', e.target.value)} style={inputStyle} /></Field>
              <Field label="Gender">
                <select value={profile.gender || ''} onChange={e => set('gender', e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
              <Field label="Blood Group">
                <select value={profile.bloodGroup || ''} onChange={e => set('bloodGroup', e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Phone Number"><input value={profile.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXXXXXXX" style={inputStyle} /></Field>
              <Field label="Address" full><input value={profile.address || ''} onChange={e => set('address', e.target.value)} placeholder="Full residential address" style={inputStyle} /></Field>
            </Section>

            <Section title="🎓 Academic Details">
              <Field label="Roll Number" req><input value={profile.rollNumber || ''} onChange={e => set('rollNumber', e.target.value)} style={inputStyle} /></Field>
              <Field label="Department" req>
                <select value={profile.department || ''} onChange={e => set('department', e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </Field>
              <Field label="Semester">
                <select value={profile.semester?.toString() || ''} onChange={e => set('semester', parseInt(e.target.value))} style={inputStyle}>
                  <option value="">Select</option>
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </Field>
              <Field label="Enrollment Year"><input type="number" value={profile.enrollmentYear || ''} onChange={e => set('enrollmentYear', parseInt(e.target.value))} placeholder="2024" style={inputStyle} /></Field>
            </Section>

            <Section title="🪖 NCC Details">
              <Field label="Regimental Number"><input value={profile.regimentalNumber || ''} onChange={e => set('regimentalNumber', e.target.value)} style={inputStyle} /></Field>
              <Field label="NCC Wing">
                <select value={profile.branch || ''} onChange={e => set('branch', e.target.value)} style={inputStyle}>
                  <option value="">Select Wing</option>
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                </select>
              </Field>
              <Field label="Division">
                <select value={profile.division || ''} onChange={e => set('division', e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  <option value="SD">SD (Senior Division)</option>
                  <option value="SW">SW (Senior Wing)</option>
                  <option value="JD">JD (Junior Division)</option>
                  <option value="JW">JW (Junior Wing)</option>
                </select>
              </Field>
              <Field label="Platoon"><input value={profile.platoon || ''} onChange={e => set('platoon', e.target.value)} placeholder="e.g. Alpha Platoon" style={inputStyle} /></Field>
            </Section>

            <Section title="👕 Uniform Sizes">
              <Field label="Shirt Size">
                <select value={profile.shirtSize || ''} onChange={e => set('shirtSize', e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Trouser Size">
                <select value={profile.trouserSize || ''} onChange={e => set('trouserSize', e.target.value)} style={inputStyle}>
                  <option value="">Select</option>
                  {['26', '28', '30', '32', '34', '36', '38', '40'].map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Boot Size (UK)"><input type="number" value={profile.bootSize || ''} onChange={e => set('bootSize', parseInt(e.target.value))} placeholder="7" style={inputStyle} /></Field>
            </Section>

            <Section title="🆘 Emergency Contact">
              <Field label="Contact Name"><input value={profile.emergencyName || ''} onChange={e => set('emergencyName', e.target.value)} style={inputStyle} /></Field>
              <Field label="Relation"><input value={profile.emergencyRelation || ''} onChange={e => set('emergencyRelation', e.target.value)} placeholder="Father / Mother / Guardian" style={inputStyle} /></Field>
              <Field label="Phone Number" full><input value={profile.emergencyPhone || ''} onChange={e => set('emergencyPhone', e.target.value)} style={inputStyle} /></Field>
            </Section>

            <Section title="🏥 Medical Information">
              <Field label="Any Medical Issues" full>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                      <input type="radio" name="medical" value={opt} checked={opt === 'Yes' ? !!profile.medicalIssues : !profile.medicalIssues}
                        onChange={() => set('medicalIssues', opt === 'Yes')} /> {opt}
                    </label>
                  ))}
                </div>
              </Field>
              {profile.medicalIssues && (
                <Field label="Medical Details" full>
                  <textarea value={profile.medicalDetails || ''} onChange={e => set('medicalDetails', e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} placeholder="Briefly describe your medical condition..." />
                </Field>
              )}
            </Section>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 32 }}>
              <button onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--navy-600)', color: '#fff', padding: '12px 28px', borderRadius: 10, border: 'none', fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                <Save size={16} /> {saving ? 'Saving…' : 'Save All Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
