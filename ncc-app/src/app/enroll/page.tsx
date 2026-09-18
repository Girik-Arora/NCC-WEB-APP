'use client';

import { useState } from 'react';
import { addApplication } from '@/lib/db';
import type { Wing } from '@/types';
import { Shield, CheckCircle } from 'lucide-react';

const DEPARTMENTS = ['Computer Engineering', 'Information Technology', 'EXTC', 'Mechanical', 'Civil', 'Electrical', 'AI & DS', 'AIDS', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STEPS = ['Personal', 'Academic', 'NCC Preference', 'Medical & Emergency', 'Review & Submit'];

function Field({ label, req, full, children }: { label: string; req?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'block', marginBottom: 5, letterSpacing: 0.3 }}>
        {label} {req && <span style={{ color: '#dc2626' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function EnrollPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', gender: '',
    bloodGroup: '', email: '', phone: '', address: '',
    rollNumber: '', department: '', semester: 1, college: 'TCET',
    wingPreference: 'Army' as Wing, secondPreference: '' as Wing | '',
    medicalIssues: false, medicalDetails: '',
    parentName: '', parentRelation: '', parentPhone: '',
    declarationAccepted: false,
  });

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }));

  const isStepValid = () => {
    switch (step) {
      case 0: return form.firstName && form.lastName && form.dateOfBirth && form.gender && form.bloodGroup && form.email && form.phone;
      case 1: return form.rollNumber && form.department && form.semester;
      case 2: return form.wingPreference;
      case 3: return form.parentName && form.parentRelation && form.parentPhone;
      case 4: return form.declarationAccepted;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await addApplication({
        ...form,
        secondPreference: form.secondPreference || undefined,
        status: 'new',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      } as any);
      setSubmitted(true);
    } catch (e) {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 42, padding: '0 14px',
    border: '1.5px solid #d1d5db', borderRadius: 10,
    fontSize: 14, background: '#fff', color: '#111827',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  if (submitted) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center', boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={40} color="#15803d" />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', fontFamily: 'Rajdhani, sans-serif', marginBottom: 8 }}>Application Submitted!</h1>
          <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Your NCC enrollment application has been received. The ANO will review it and contact you via phone/email with the next steps.
          </p>
          <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 10, fontSize: 13, color: '#374151', textAlign: 'left' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Application Summary</div>
            <div>Name: <strong>{form.firstName} {form.lastName}</strong></div>
            <div>Roll No: <strong>{form.rollNumber}</strong></div>
            <div>Wing: <strong>{form.wingPreference}</strong></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px' }}>
      <link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #c8a84b, #f0c060)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 20px rgba(200,168,75,0.4)' }}>
          <Shield size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'Rajdhani, sans-serif', letterSpacing: 1, margin: 0 }}>
          TCET NCC — Enrollment
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginTop: 6 }}>
          Join the National Cadet Corps · Unity & Discipline
        </p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: i < step ? '#15803d' : i === step ? '#c8a84b' : 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff',
              border: i === step ? '2px solid #f0c060' : '2px solid transparent',
            }}>
              {i < step ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && <div style={{ width: 24, height: 2, background: i < step ? '#15803d' : 'rgba(255,255,255,0.15)', borderRadius: 99 }} />}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 24 }}>
        Step {step + 1} of {STEPS.length} — <span style={{ color: '#f0c060', fontWeight: 600 }}>{STEPS[step]}</span>
      </div>

      {/* Card */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 32, width: '100%', maxWidth: 600, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

        {step === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="First Name" req><input value={form.firstName} onChange={e => set('firstName', e.target.value)} style={inputStyle} /></Field>
            <Field label="Last Name" req><input value={form.lastName} onChange={e => set('lastName', e.target.value)} style={inputStyle} /></Field>
            <Field label="Date of Birth" req><input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} style={inputStyle} /></Field>
            <Field label="Gender" req>
              <select value={form.gender} onChange={e => set('gender', e.target.value)} style={inputStyle}>
                <option value="">Select</option>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </Field>
            <Field label="Blood Group" req>
              <select value={form.bloodGroup} onChange={e => set('bloodGroup', e.target.value)} style={inputStyle}>
                <option value="">Select</option>
                {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Phone" req><input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 XXXXXXXXXX" style={inputStyle} /></Field>
            <Field label="Email Address" req full><input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inputStyle} /></Field>
            <Field label="Residential Address" full><textarea value={form.address} onChange={e => set('address', e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' }} /></Field>
          </div>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Roll Number" req full><input value={form.rollNumber} onChange={e => set('rollNumber', e.target.value)} placeholder="e.g. 231105001" style={inputStyle} /></Field>
            <Field label="Department" req>
              <select value={form.department} onChange={e => set('department', e.target.value)} style={inputStyle}>
                <option value="">Select</option>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Current Semester" req>
              <select value={form.semester} onChange={e => set('semester', parseInt(e.target.value))} style={inputStyle}>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </Field>
            <Field label="College" full><input value={form.college} style={{ ...inputStyle, background: '#f9fafb', color: '#6b7280' }} readOnly /></Field>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div style={{ gridColumn: '1 / -1', marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
                Choose your preferred NCC wing. We will try to accommodate your preference, but final placement depends on vacancies.
              </div>
            </div>
            {(['Army', 'Navy', 'Air Force'] as Wing[]).map(wing => (
              <button key={wing} onClick={() => set('wingPreference', wing)} style={{
                padding: '16px 12px', borderRadius: 12, border: `2px solid ${form.wingPreference === wing ? '#1e3a5f' : '#e5e7eb'}`,
                background: form.wingPreference === wing ? '#f0f4ff' : '#fff',
                cursor: 'pointer', textAlign: 'center',
                fontSize: 15, fontWeight: 700, color: form.wingPreference === wing ? '#1e3a5f' : '#374151',
                fontFamily: 'Rajdhani, sans-serif',
              }}>
                {wing === 'Army' ? '🪖' : wing === 'Navy' ? '⚓' : '✈️'} {wing}
              </button>
            ))}
            <Field label="Second Preference (optional)" full>
              <select value={form.secondPreference} onChange={e => set('secondPreference', e.target.value)} style={inputStyle}>
                <option value="">No preference</option>
                {(['Army', 'Navy', 'Air Force'] as Wing[]).filter(w => w !== form.wingPreference).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Parent / Guardian Name" req full><input value={form.parentName} onChange={e => set('parentName', e.target.value)} style={inputStyle} /></Field>
            <Field label="Relation" req>
              <select value={form.parentRelation} onChange={e => set('parentRelation', e.target.value)} style={inputStyle}>
                <option value="">Select</option>
                <option>Father</option><option>Mother</option><option>Guardian</option>
              </select>
            </Field>
            <Field label="Parent Phone" req><input type="tel" value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} style={inputStyle} /></Field>
            <Field label="Any Medical Issues" req full>
              <div style={{ display: 'flex', gap: 16 }}>
                {['No', 'Yes'].map(opt => (
                  <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer', fontWeight: 500 }}>
                    <input type="radio" name="med" checked={opt === 'Yes' ? form.medicalIssues : !form.medicalIssues} onChange={() => set('medicalIssues', opt === 'Yes')} /> {opt}
                  </label>
                ))}
              </div>
            </Field>
            {form.medicalIssues && (
              <Field label="Medical Details" full>
                <textarea value={form.medicalDetails} onChange={e => set('medicalDetails', e.target.value)} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 14px', resize: 'vertical' }} placeholder="Please describe any known conditions..." />
              </Field>
            )}
          </div>
        )}

        {step === 4 && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Review Your Application</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, marginBottom: 20 }}>
              {[
                ['Name', `${form.firstName} ${form.lastName}`],
                ['Roll No', form.rollNumber],
                ['Department', form.department],
                ['Semester', `Sem ${form.semester}`],
                ['Wing', form.wingPreference],
                ['Blood Group', form.bloodGroup],
                ['Phone', form.phone],
                ['Parent', `${form.parentName} (${form.parentRelation})`],
                ['Medical Issues', form.medicalIssues ? '⚠️ Yes' : '✅ No'],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: '8px 12px', background: '#f9fafb', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600, color: '#111827' }}>{value}</div>
                </div>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
              <input type="checkbox" checked={form.declarationAccepted} onChange={e => set('declarationAccepted', e.target.checked)} style={{ marginTop: 3, flexShrink: 0 }} />
              I hereby declare that the information provided above is true and correct. I understand that submitting false information may result in disqualification from the NCC program. I agree to abide by the NCC rules and regulations if selected.
            </label>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: '11px 24px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              ← Back
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button onClick={() => { if (isStepValid()) setStep(s => s + 1); else alert('Please fill in all required fields.'); }} style={{ padding: '11px 28px', borderRadius: 10, background: '#1e3a5f', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!form.declarationAccepted || submitting} style={{ padding: '11px 28px', borderRadius: 10, background: form.declarationAccepted ? '#15803d' : '#9ca3af', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: form.declarationAccepted ? 'pointer' : 'not-allowed' }}>
              {submitting ? 'Submitting...' : '✓ Submit Application'}
            </button>
          )}
        </div>
      </div>

      <div style={{ marginTop: 20, color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
        © TCET NCC Portal · Thakur College of Engineering & Technology
      </div>
    </div>
  );
}
