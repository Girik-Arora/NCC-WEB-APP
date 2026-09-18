'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllEvents, deleteEvent } from '@/lib/db';
import type { NccEvent, EventCategory } from '@/types';
import { MapPin, Plus, Trash2, Eye, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CAT_COLORS: Record<string, string> = {
  'Republic Day': '#dc2626', 'Independence Day': '#15803d', 'NCC Day': '#0369a1',
  'Social Service': '#7c3aed', 'Sports': '#d97706', 'Cultural': '#be185d',
  'Blood Donation': '#dc2626', 'Adventure Activity': '#0891b2',
  'Community Service': '#059669', 'Environment': '#65a30d', 'Other': '#6b7280',
};

export default function CommandEventsPage() {
  const { userProfile } = useAuth();
  const [events, setEvents] = useState<NccEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => getAllEvents().then(setEvents).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    await deleteEvent(id);
    toast.success('Event deleted');
    load();
  };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Events & Activities</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{events.length} activities logged</p>
          </div>
          <Link href="/command/events/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--navy-600)', color: '#fff', padding: '10px 18px',
            borderRadius: 10, textDecoration: 'none', fontSize: 13, fontWeight: 600,
          }}>
            <Plus size={15} /> Log Event
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <AlertCircle size={36} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)' }}>No events logged yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {events.map(ev => {
              const color = CAT_COLORS[ev.category] || '#6b7280';
              return (
                <div key={ev.id} style={{
                  background: 'var(--surface-0)', border: '1px solid var(--border-light)',
                  borderRadius: 12, overflow: 'hidden',
                  borderTop: `3px solid ${color}`,
                }}>
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${color}18`, color }}>{ev.category}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link href={`/command/events/${ev.id}`} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border-light)', color: 'var(--navy-600)', fontSize: 12, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={12} /> View
                        </Link>
                        <button onClick={() => handleDelete(ev.id!)} style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--danger-border)', color: 'var(--danger)', background: 'none', cursor: 'pointer', fontSize: 12 }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>{ev.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                      📅 {ev.date}{ev.endDate ? ` – ${ev.endDate}` : ''} {ev.venue ? `· 📍 ${ev.venue}` : ''}
                    </div>
                    {ev.objectives && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>{ev.objectives}</div>}
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                      {ev.participantCount && <span>👥 {ev.participantCount} participants</span>}
                      {ev.poMapping && <span>PO: {ev.poMapping}</span>}
                      {ev.sdgMapping && <span>SDG: {ev.sdgMapping}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
