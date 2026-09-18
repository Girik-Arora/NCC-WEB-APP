'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { addParade } from '@/lib/db';
import type { ParadeType, Wing } from '@/types';
import { Calendar, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const PARADE_TYPES: ParadeType[] = [
  'Institutional Training', 'Parade', 'PT', 'Drill',
  'NCC Lecture', 'Defence Career Lecture', 'SSB Guidance',
  'Sports Session', 'Social Service', 'Community Activity',
  'Republic Day', 'Independence Day', 'Other',
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, letterSpacing: 0.4 }}>
        {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function NewParadePage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    paradeType: 'Institutional Training' as ParadeType,
    wing: 'All' as Wing | 'All',
    venue: '',
    instructor: '',
    startTime: '',
    endTime: '',
    subjectsCovered: '',
    remarks: '',
    title: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.paradeType) { toast.error('Date and type are required'); return; }
    setSaving(true);
    try {
      const id = await addParade({
        ...form,
        createdBy: userProfile?.uid || 'system',
        createdAt: new Date() as any,
      });
      toast.success('Parade session created');
      router.push(`/command/attendance/${id}`);
    } catch {
      toast.error('Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <Link href="/command/attendance" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--navy-600)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Attendance
        </Link>
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--navy-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={20} color="var(--navy-600)" />
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)', margin: 0 }}>New Parade Session</h1>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>Create an attendance session for today's parade</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Date" required>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Parade Type" required>
                <select value={form.paradeType} onChange={e => set('paradeType', e.target.value)} style={inputStyle}>
                  {PARADE_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Wing">
                <select value={form.wing} onChange={e => set('wing', e.target.value)} style={inputStyle}>
                  <option value="All">All Wings</option>
                  <option value="Army">Army</option>
                  <option value="Navy">Navy</option>
                  <option value="Air Force">Air Force</option>
                </select>
              </Field>
              <Field label="Venue">
                <input type="text" value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="e.g. Parade Ground" style={inputStyle} />
              </Field>
              <Field label="Instructor / ANO">
                <input type="text" value={form.instructor} onChange={e => set('instructor', e.target.value)} placeholder="Name" style={inputStyle} />
              </Field>
              <Field label="Title (optional)">
                <input type="text" value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Republic Day Rehearsal" style={inputStyle} />
              </Field>
              <Field label="Start Time">
                <input type="time" value={form.startTime} onChange={e => set('startTime', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="End Time">
                <input type="time" value={form.endTime} onChange={e => set('endTime', e.target.value)} style={inputStyle} />
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label="Subjects Covered">
                <textarea value={form.subjectsCovered} onChange={e => set('subjectsCovered', e.target.value)} placeholder="Topics / activities covered in this session..." rows={2}
                  style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
              </Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="Remarks">
                <textarea value={form.remarks} onChange={e => set('remarks', e.target.value)} placeholder="Additional notes..." rows={2}
                  style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} />
              </Field>
            </div>
            <button type="submit" disabled={saving} style={{
              marginTop: 22, width: '100%', height: 44,
              background: saving ? 'var(--border-mid)' : 'var(--navy-600)',
              color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Creating...' : 'Create Session & Mark Attendance →'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
