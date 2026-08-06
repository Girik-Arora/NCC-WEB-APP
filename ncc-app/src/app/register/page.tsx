'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithEmail } from '@/lib/auth';
import type { RegisterData } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  Shield, Eye, EyeOff, Mail, Lock, CheckCircle,
} from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One number', pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const color = score === 0 ? '#e2e8f0' : score === 1 ? '#dc2626' : score === 2 ? '#d97706' : '#16a34a';
  const label = score === 0 ? '' : score === 1 ? 'Weak' : score === 2 ? 'Fair' : 'Strong';

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? color : '#e2e8f0', transition: 'background 0.3s' }} />
        ))}
        <span style={{ fontSize: 11, color, fontWeight: 600, marginLeft: 6, lineHeight: '4px', alignSelf: 'center' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: c.pass ? '#16a34a' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
              {c.pass && <CheckCircle size={10} color="white" />}
            </div>
            <span style={{ fontSize: 12, color: c.pass ? '#15803d' : '#94a3b8' }}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<'cadet' | 'ano'>('cadet');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState<RegisterData & { confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    rollNumber: '',
    college: '',
    phone: '',
    branch: 'Army',
    semester: 1,
    anoRank: 'Lieutenant',
  });

  const set = (field: keyof typeof form, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.firstName.trim()) { toast.error('First name is required.'); return false; }
    if (!form.lastName.trim()) { toast.error('Last name is required.'); return false; }
    if (accountType === 'cadet') {
      if (!form.rollNumber?.trim()) { toast.error('Roll number is required.'); return false; }
      if (!form.college?.trim()) { toast.error('College is required.'); return false; }
      if (!form.phone?.trim()) { toast.error('Phone number is required.'); return false; }
    }
    if (!form.email.trim()) { toast.error('Email is required.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Enter a valid email address.'); return false; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return false; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await registerWithEmail({ ...form, isAno: accountType === 'ano' });
      toast.success(accountType === 'ano' ? 'ANO Account created!' : 'Account created! Welcome to NCC TCET 🎖️');
      // Always redirect cadets to profile completion, ANOs to dashboard
      router.push(accountType === 'ano' ? '/ano/dashboard' : '/cadet/profile');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = (err as any)?.code || '';
      console.error('Registration error:', code, msg, err);

      if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
        toast.error('This email is already registered. Try signing in.');
      } else if (code === 'auth/weak-password' || msg.includes('weak-password')) {
        toast.error('Choose a stronger password (at least 6 characters).');
      } else if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        toast.error('Invalid email address format.');
      } else if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        toast.error('Email/password sign-up is not enabled. Please contact the admin.');
      } else if (code === 'auth/network-request-failed' || msg.includes('network')) {
        toast.error('Network error. Check your internet connection.');
      } else if (code === 'permission-denied' || msg.includes('permission-denied')) {
        toast.error('Firestore permission denied. Please check security rules.');
      } else {
        toast.error(`Registration failed: ${code || msg || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (icon = true) => ({
    paddingLeft: icon ? 36 : 14,
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      {/* tricolor top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #FF9933 33.33%, #ffffff 33.33% 66.66%, #138808 66.66%)', zIndex: 100 }} />
      <div style={{ width: '100%', maxWidth: 520, paddingTop: 8 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <img
              src="https://res.cloudinary.com/dxxvewmf5/image/upload/v1786034608/ncclogo_eitfib.webp"
              alt="NCC"
              style={{ width: 48, height: 48, objectFit: 'contain' }}
            />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 20, color: 'var(--text-heading)', lineHeight: 1, letterSpacing: '0.5px' }}>NCC TCET</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>National Cadet Corps</p>
            </div>
          </div>
          <h1 style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6, letterSpacing: '0.3px' }}>Create Account</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Fill in your details to join the NCC digital portal.</p>
        </div>

        {/* ── Account Type Toggle ── */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 24 }}>
          <button
            onClick={() => { setAccountType('cadet'); }}
            style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: accountType === 'cadet' ? 'white' : 'transparent', color: accountType === 'cadet' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: 14, boxShadow: accountType === 'cadet' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            I am a Cadet
          </button>
          <button
            onClick={() => { setAccountType('ano'); }}
            style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: accountType === 'ano' ? '#1e3a5f' : 'transparent', color: accountType === 'ano' ? 'white' : '#64748b', fontWeight: 700, fontSize: 14, boxShadow: accountType === 'ano' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            I am an ANO
          </button>
        </div>

        {/* ── Form Card ── */}
        <div className="card" style={{ padding: 32 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="e.g. John" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="e.g. Doe" />
              </div>
            </div>

            {accountType === 'ano' && (
              <div className="form-group">
                <label className="form-label">Rank / Post *</label>
                <select className="form-select" value={form.anoRank || 'Lieutenant'} onChange={(e) => set('anoRank', e.target.value)}>
                  {[
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
                  ].map(rank => <option key={rank} value={rank}>{rank}</option>)}
                </select>
              </div>
            )}

            {accountType === 'cadet' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Roll Number *</label>
                    <input className="form-input" value={form.rollNumber || ''} onChange={(e) => set('rollNumber', e.target.value)} placeholder="e.g. 2024CSE001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">College *</label>
                    <input className="form-input" value={form.college || ''} onChange={(e) => set('college', e.target.value)} placeholder="College Name" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch</label>
                    <select className="form-select" value={form.branch || 'Army'} onChange={(e) => set('branch', e.target.value)}>
                      {['Army', 'Navy', 'Air Force'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                  placeholder={accountType === 'ano' ? "ano@college.edu" : "you@college.edu"} style={inputStyle()} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="form-input" type={showPassword ? 'text' : 'password'} value={form.password}
                  onChange={(e) => set('password', e.target.value)} placeholder="Create a strong password"
                  style={{ ...inputStyle(), paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input className="form-input" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)} placeholder="Repeat your password"
                  style={{
                    ...inputStyle(), paddingRight: 40,
                    borderColor: form.confirmPassword && form.confirmPassword !== form.password ? '#dc2626' : undefined,
                  }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Passwords do not match.</p>
              )}
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}
              style={{ width: '100%', padding: '11px 28px', fontSize: 15, gap: 8 }}>
              {loading ? (
                <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating account...</>
              ) : (
                <><CheckCircle size={18} /> {accountType === 'ano' ? 'Register as ANO' : 'Create Cadet Account'}</>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 12 }}>
          NCC TCET · Secure Registration
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
