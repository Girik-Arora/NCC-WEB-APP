'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerWithEmail } from '@/lib/auth';
import type { RegisterData } from '@/lib/auth';
import toast from 'react-hot-toast';
import {
  Shield, Eye, EyeOff, User, Mail, Lock, Phone,
  Droplets, GraduationCap, CheckCircle, ArrowRight, ArrowLeft,
} from 'lucide-react';

const BRANCHES = ['Army', 'Navy', 'Air Force'] as const;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: 'Account', icon: <Lock size={16} />, desc: 'Create your login credentials' },
  { id: 2, label: 'NCC Details', icon: <Shield size={16} />, desc: 'Your cadet information' },
  { id: 3, label: 'Personal', icon: <User size={16} />, desc: 'Contact & personal info' },
];

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
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState<RegisterData & { confirmPassword: string }>({
    // Step 1 — Account
    email: '',
    password: '',
    confirmPassword: '',
    // Step 2 — NCC Details
    firstName: '',
    lastName: '',
    rollNumber: '',
    college: '',
    branch: 'Army',
    semester: 1,
    // Step 3 — Personal
    bloodGroup: 'O+',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
  });

  const set = (field: keyof typeof form, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // ── Validation per step ──────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.email.trim()) { toast.error('Email is required.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Enter a valid email address.'); return false; }
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters.'); return false; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    if (!form.firstName.trim()) { toast.error('First name is required.'); return false; }
    if (!form.lastName.trim()) { toast.error('Last name is required.'); return false; }
    if (!form.rollNumber.trim()) { toast.error('Roll number is required.'); return false; }
    if (!form.college.trim()) { toast.error('College name is required.'); return false; }
    return true;
  };

  const validateStep3 = () => {
    if (!form.phone.trim()) { toast.error('Phone number is required.'); return false; }
    if (!/^[+\d\s\-()]{7,15}$/.test(form.phone)) { toast.error('Enter a valid phone number.'); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => (s < 3 ? (s + 1) as Step : s));
  };

  const handleBack = () => setStep((s) => (s > 1 ? (s - 1) as Step : s));

  const handleSubmit = async () => {
    if (accountType === 'cadet' && !validateStep3()) return;
    
    // Quick validation for ANO
    if (accountType === 'ano') {
      if (!form.firstName.trim() || !form.lastName.trim()) { toast.error('Name is required.'); return; }
      if (!validateStep1()) return;
    }

    setLoading(true);
    try {
      await registerWithEmail({ ...form, isAno: accountType === 'ano' });
      toast.success(accountType === 'ano' ? 'ANO Account created!' : 'Account created! Welcome to NCC Portal 🎖️');
      router.push(accountType === 'ano' ? '/ano/dashboard' : '/cadet/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('email-already-in-use')) {
        toast.error('This email is already registered. Try signing in.');
      } else if (msg.includes('weak-password')) {
        toast.error('Choose a stronger password.');
      } else if (msg.includes('invalid-email')) {
        toast.error('Invalid email address.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (icon = true) => ({
    paddingLeft: icon ? 36 : 14,
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #c8960c, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(200,150,12,0.35)' }}>
              <Shield size={22} color="white" />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 800, fontSize: 18, color: '#0f172a', lineHeight: 1 }}>NCC Portal</p>
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Digital Headquarters</p>
            </div>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.3px' }}>Create your account</h1>
          <p style={{ color: '#64748b', fontSize: 14 }}>Fill in your details to join the NCC digital portal.</p>
        </div>

        {/* ── Account Type Toggle ── */}
        <div style={{ display: 'flex', background: '#e2e8f0', borderRadius: 12, padding: 4, marginBottom: 32 }}>
          <button
            onClick={() => { setAccountType('cadet'); setStep(1); }}
            style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: accountType === 'cadet' ? 'white' : 'transparent', color: accountType === 'cadet' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: 14, boxShadow: accountType === 'cadet' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            I am a Cadet
          </button>
          <button
            onClick={() => { setAccountType('ano'); setStep(1); }}
            style={{ flex: 1, padding: '10px 0', border: 'none', borderRadius: 8, background: accountType === 'ano' ? '#1e3a5f' : 'transparent', color: accountType === 'ano' ? 'white' : '#64748b', fontWeight: 700, fontSize: 14, boxShadow: accountType === 'ano' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            I am an ANO
          </button>
        </div>

        {/* ── Step Indicator (Only for Cadets) ── */}
        {accountType === 'cadet' && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid',
                  borderColor: step > s.id ? '#16a34a' : step === s.id ? '#1e3a5f' : '#e2e8f0',
                  background: step > s.id ? '#16a34a' : step === s.id ? '#1e3a5f' : 'white',
                  transition: 'all 0.3s', flexShrink: 0,
                }}>
                  {step > s.id
                    ? <CheckCircle size={18} color="white" />
                    : <span style={{ color: step === s.id ? 'white' : '#94a3b8', fontSize: 13, fontWeight: 700 }}>{s.id}</span>
                  }
                </div>
                <div style={{ display: i < STEPS.length - 1 ? 'none' : 'block' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: step >= s.id ? '#0f172a' : '#94a3b8' }}>{s.label}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <p style={{ fontSize: 13, fontWeight: 600, color: step >= s.id ? '#0f172a' : '#94a3b8', display: 'block' }}>{s.label}</p>
                )}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 2, margin: '0 8px', background: step > s.id ? '#16a34a' : '#e2e8f0', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>
        )}

        {/* ── Form Card ── */}
        <div className="card" style={{ padding: 32 }}>
          {/* Step description */}
          {accountType === 'cadet' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '12px 16px', background: '#f8f9fc', borderRadius: 8 }}>
              <div style={{ color: '#1e3a5f' }}>{STEPS[step - 1].icon}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Step {step}: {STEPS[step - 1].label}</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>{STEPS[step - 1].desc}</p>
              </div>
            </div>
          )}

          {/* ── STEP 1: Account ── */}
          {step === 1 && accountType === 'cadet' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                    placeholder="you@college.edu" style={inputStyle()} />
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Use your college email for easy identification.</p>
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
                {form.confirmPassword && form.confirmPassword === form.password && (
                  <p style={{ fontSize: 12, color: '#16a34a', marginTop: 4 }}>✓ Passwords match.</p>
                )}
              </div>
            </div>
          )}

          {/* ── ANO Specific Form ── */}
          {accountType === 'ano' && (
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

              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input className="form-input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                    placeholder="ano@college.edu" style={inputStyle()} />
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
          )}

          {/* ── STEP 2: NCC Details ── */}
          {step === 2 && accountType === 'cadet' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input className="form-input" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="First name" />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input className="form-input" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Last name" />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Roll Number / Registration No. *</label>
                <div style={{ position: 'relative' }}>
                  <GraduationCap size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input className="form-input" value={form.rollNumber} onChange={(e) => set('rollNumber', e.target.value)}
                    placeholder="e.g. 2024CSE001" style={inputStyle()} />
                </div>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">College / Institution *</label>
                <input className="form-input" value={form.college} onChange={(e) => set('college', e.target.value)} placeholder="Full college name" />
              </div>

              <div className="form-group">
                <label className="form-label">NCC Branch</label>
                <select className="form-select" value={form.branch} onChange={(e) => set('branch', e.target.value)}>
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Current Semester</label>
                <select className="form-select" value={form.semester} onChange={(e) => set('semester', parseInt(e.target.value))}>
                  {SEMESTERS.map((s) => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>

              {/* Info box */}
              <div style={{ gridColumn: '1 / -1', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 12, color: '#0369a1', lineHeight: 1.5 }}>
                  ℹ️ This information will be used for camp recommendations and evaluations. You can update it later from your profile.
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 3: Personal Info ── */}
          {step === 3 && accountType === 'cadet' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Phone Number *</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX" style={inputStyle()} type="tel" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Blood Group</label>
                <div style={{ position: 'relative' }}>
                  <Droplets size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#dc2626' }} />
                  <select className="form-select" value={form.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)} style={{ paddingLeft: 32 }}>
                    {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>Important for camp medical records.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-select" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Date of Birth</label>
                <input className="form-input" type="date" value={form.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
              </div>

              {/* Summary card */}
              <div style={{
                gridColumn: '1 / -1', background: '#f8f9fc', borderRadius: 10,
                padding: '14px 16px', border: '1px solid #e2e8f0',
              }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', marginBottom: 10 }}>Account Summary</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 13 }}>
                  {[
                    { label: 'Name', value: `${form.firstName} ${form.lastName}` },
                    { label: 'Email', value: form.email },
                    { label: 'Roll No.', value: form.rollNumber },
                    { label: 'College', value: form.college },
                    { label: 'Branch', value: form.branch },
                    { label: 'Semester', value: `Semester ${form.semester}` },
                  ].map((item) => (
                    <div key={item.label}>
                      <span style={{ color: '#94a3b8' }}>{item.label}: </span>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.value || '—'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px' }}>
                <p style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
                  By registering, you confirm that the information provided is accurate and belongs to an active NCC cadet.
                </p>
              </div>
            </div>
          )}

          {/* ── Navigation Buttons ── */}
          <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'space-between', alignItems: 'center' }}>
            {accountType === 'cadet' && step > 1 ? (
              <button className="btn-secondary" onClick={handleBack} style={{ gap: 6 }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <div />
            )}

            {accountType === 'cadet' && step < 3 ? (
              <button className="btn-primary" onClick={handleNext} style={{ gap: 6 }}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn-primary" onClick={handleSubmit} disabled={loading}
                style={{ padding: '11px 28px', fontSize: 15, gap: 8, width: accountType === 'ano' ? '100%' : 'auto' }}>
                {loading ? (
                  <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Creating account...</>
                ) : (
                  <><CheckCircle size={18} /> {accountType === 'ano' ? 'Register as ANO' : 'Create Account'}</>
                )}
              </button>
            )}
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
          NCC Portal · Secure Registration
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
