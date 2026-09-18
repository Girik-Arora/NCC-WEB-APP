'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { addEvent } from '@/lib/db';
import type { EventCategory } from '@/types';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const EVENT_CATEGORIES: EventCategory[] = [
  'Republic Day', 'Independence Day', 'NCC Day',
  'Social Service', 'Tree Plantation', 'Environment',
  'Sports', 'Cultural', 'Seminar', 'Defence Activity',
  'Blood Donation', 'Cyclothon', 'Marathon',
  'Community Service', 'Firing Practice', 'Other',
];

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
        {label} {req && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export default function NewEventPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '', category: 'Social Service' as EventCategory,
    date: new Date().toISOString().split('T')[0],
    endDate: '', venue: '', organizer: '', coordinator: '',
    objectives: '', description: '',
    participantCount: '', facultyPresent: '', nccOfficers: '',
    poMapping: '', sdgMapping: '',
    reportUrl: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (f: string, v: string) => setForm(prev => ({ ...prev, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Event name is required'); return; }
    setSaving(true);
    try {
      await addEvent({
        ...form,
        participantCount: form.participantCount ? parseInt(form.participantCount) : undefined,
        createdBy: userProfile?.uid || '',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
      });
      toast.success('Event logged successfully!');
      router.push('/command/events');
    } catch { toast.error('Failed to save event'); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Link href="/command/events" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--navy-600)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: 16 }}>
          <ChevronLeft size={16} /> Back to Events
        </Link>
        <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)', marginBottom: 4 }}>Log Event / Activity</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Record NCC events, social services, Republic Day activities, sports, etc.</p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Event Name" req>
                  <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Blood Donation Camp 2024" style={inputStyle} />
                </Field>
              </div>
              <Field label="Category" req>
                <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
                  {EVENT_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Start Date" req>
                <input type="date" value={form.date} onChange={e => set('date', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="End Date">
                <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} style={inputStyle} />
              </Field>
              <Field label="Venue">
                <input value={form.venue} onChange={e => set('venue', e.target.value)} placeholder="e.g. TCET Campus" style={inputStyle} />
              </Field>
              <Field label="Organizer / Organization">
                <input value={form.organizer} onChange={e => set('organizer', e.target.value)} placeholder="e.g. NCC TCET, NSS, Hospital" style={inputStyle} />
              </Field>
              <Field label="Coordinator">
                <input value={form.coordinator} onChange={e => set('coordinator', e.target.value)} placeholder="Cadet / Officer name" style={inputStyle} />
              </Field>
              <Field label="Number of Participants">
                <input type="number" value={form.participantCount} onChange={e => set('participantCount', e.target.value)} placeholder="0" style={inputStyle} />
              </Field>
              <Field label="Faculty Present">
                <input value={form.facultyPresent} onChange={e => set('facultyPresent', e.target.value)} placeholder="Names" style={inputStyle} />
              </Field>
              <Field label="NCC Officers Present">
                <input value={form.nccOfficers} onChange={e => set('nccOfficers', e.target.value)} placeholder="Names" style={inputStyle} />
              </Field>
              <Field label="PO Mapping (e.g. PO6, PO10)">
                <input value={form.poMapping} onChange={e => set('poMapping', e.target.value)} placeholder="PO6, PO10" style={inputStyle} />
              </Field>
              <Field label="SDG Mapping (e.g. SDG 4, SDG 13)">
                <input value={form.sdgMapping} onChange={e => set('sdgMapping', e.target.value)} placeholder="SDG 4, SDG 13" style={inputStyle} />
              </Field>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Objectives / Program of Events">
                  <textarea value={form.objectives} onChange={e => set('objectives', e.target.value)} rows={2} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} placeholder="List the objectives or schedule..." />
                </Field>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Description">
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical' }} placeholder="Detailed description of the event..." />
                </Field>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <Field label="Report / Document URL (Google Drive)">
                  <input value={form.reportUrl} onChange={e => set('reportUrl', e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle} />
                </Field>
              </div>
            </div>

            <button type="submit" disabled={saving} style={{
              marginTop: 24, width: '100%', height: 44,
              background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Saving Event...' : 'Save Event'}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
