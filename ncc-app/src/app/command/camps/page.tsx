'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCampEvents, addCampEvent, deleteCampEvent, getAllCadets, runCampRecommendation } from '@/lib/db';
import type { CampEvent, CampType, Wing, RecommendedCadet } from '@/types';
import { Tent, Plus, X, Star, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const CAMP_TYPES: CampType[] = [
  'CATC', 'ATC', 'WATC', 'BLC', 'NIC', 'RDC', 'Pre-RDC',
  'Trekking', 'Sailing', 'Cyclothon', 'Marathon', 'Rock Climbing',
  'Para Basic', 'SNIC', 'YEP', 'Vayu Sainik', 'Other',
];

export default function CommandCampsPage() {
  const { userProfile } = useAuth();
  const [camps, setCamps] = useState<CampEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showRecommend, setShowRecommend] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<CampEvent | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedCadet[]>([]);
  const [recommending, setRecommending] = useState(false);
  const [form, setForm] = useState({
    campType: 'CATC' as CampType, name: '', location: '', startDate: '',
    endDate: '', seats: 10, wing: 'Army' as Wing | 'All',
    venue: '', commandingOfficer: '', remarks: '',
    reportUrl: '', nominationDeadline: '',
  });
  const [saving, setSaving] = useState(false);

  const load = () => getAllCampEvents().then(setCamps).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addCampEvent({
        ...form,
        status: 'upcoming',
        createdBy: userProfile?.uid || '',
        createdAt: new Date() as any,
        updatedAt: new Date() as any,
        seats: Number(form.seats),
      });
      toast.success('Camp event created');
      setShowForm(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleRecommend = async (camp: CampEvent) => {
    setSelectedCamp(camp);
    setRecommending(true);
    setShowRecommend(true);
    try {
      const recs = await runCampRecommendation(camp.campType, camp.seats ?? 10, camp.wing !== 'All' ? (camp.wing as Wing) : undefined);
      setRecommendations(recs);
    } catch { toast.error('Recommendation failed'); }
    finally { setRecommending(false); }
  };

  const STATUS_CONFIG: Record<string, { color: string; bg: string }> = {
    upcoming: { color: '#0369a1', bg: '#f0f9ff' },
    nomination_open: { color: '#7c3aed', bg: '#faf5ff' },
    in_progress: { color: '#15803d', bg: '#f0fdf4' },
    completed: { color: '#6b7280', bg: '#f9fafb' },
    cancelled: { color: '#dc2626', bg: '#fef2f2' },
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Camp Management</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{camps.length} camp events recorded</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'var(--navy-600)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
            <Plus size={14} /> New Camp
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : camps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>No camps created yet. Add your first camp event!</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {camps.map(camp => {
              const scfg = STATUS_CONFIG[camp.status ?? 'upcoming'] || STATUS_CONFIG.upcoming;
              return (
                <div key={camp.id} style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: scfg.bg, color: scfg.color }}>{(camp.status ?? 'upcoming').replace('_', ' ')}</span>
                    </div>
                    <button onClick={async () => { await deleteCampEvent(camp.id!); toast.success('Deleted'); load(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>✕</button>
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-heading)', fontFamily: 'Rajdhani, sans-serif' }}>{camp.campType}</div>
                    {camp.name && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{camp.name}</div>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                    {camp.location && <div>📍 {camp.location}{camp.venue ? ` · ${camp.venue}` : ''}</div>}
                    {camp.startDate && <div>📅 {camp.startDate}{camp.endDate ? ` → ${camp.endDate}` : ''}</div>}
                    <div>🎯 {camp.seats ?? '—'} seats · {camp.wing ?? 'All'} Wing</div>
                    {camp.nominationDeadline && <div>⏰ Nominations by: {camp.nominationDeadline}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => handleRecommend(camp)} style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--navy-50)', border: '1px solid var(--navy-200)', color: 'var(--navy-700)', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <Star size={13} /> AI Nominate
                    </button>
                    {camp.reportUrl && (
                      <a href={camp.reportUrl} target="_blank" rel="noopener noreferrer" style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-body)', fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                        View Report
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* New Camp Form */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 580, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>Create Camp Event</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Camp Type</label>
                    <select value={form.campType} onChange={e => setForm(f => ({ ...f, campType: e.target.value as CampType }))} style={inputStyle}>
                      {CAMP_TYPES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Wing</label>
                    <select value={form.wing} onChange={e => setForm(f => ({ ...f, wing: e.target.value as any }))} style={inputStyle}>
                      <option value="All">All Wings</option>
                      <option value="Army">Army</option>
                      <option value="Navy">Navy</option>
                      <option value="Air Force">Air Force</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Camp Name / Title</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Annual Trekking Camp 2024" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Location</label>
                    <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Venue</label>
                    <input value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Start Date</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>End Date</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Seats</label>
                    <input type="number" value={form.seats} onChange={e => setForm(f => ({ ...f, seats: parseInt(e.target.value) }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Nomination Deadline</label>
                    <input type="date" value={form.nominationDeadline} onChange={e => setForm(f => ({ ...f, nominationDeadline: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>CO / Director</label>
                    <input value={form.commandingOfficer} onChange={e => setForm(f => ({ ...f, commandingOfficer: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Report/Doc URL</label>
                    <input value={form.reportUrl} onChange={e => setForm(f => ({ ...f, reportUrl: e.target.value }))} placeholder="https://drive.google.com/..." style={inputStyle} />
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Creating...' : 'Create Camp'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Recommendations Modal */}
        {showRecommend && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 600, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowRecommend(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 4 }}>
                ⭐ AI Cadet Nominations
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                {selectedCamp?.campType} — Top {selectedCamp?.seats} cadets ranked by skills, evaluations, and eligibility
              </p>
              {recommending ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Computing recommendations...</div>
              ) : recommendations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No eligible cadets found. Ensure cadets have skills and evaluations recorded.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recommendations.map((r, idx) => (
                    <div key={r.uid} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 14px', borderRadius: 10,
                      background: idx === 0 ? 'var(--gold-50)' : 'var(--bg-secondary)',
                      border: `1px solid ${idx === 0 ? 'var(--gold-300)' : 'var(--border-light)'}`,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: idx === 0 ? 'var(--gold-500)' : idx < 3 ? 'var(--navy-100)' : 'var(--bg-secondary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: 14, color: idx === 0 ? '#fff' : 'var(--text-body)',
                        flexShrink: 0,
                      }}>
                        {r.rank}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.branch} · Sem {r.semester}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--navy-600)' }}>{r.totalScore}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Score</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
