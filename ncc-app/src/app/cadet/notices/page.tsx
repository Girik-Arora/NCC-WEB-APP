'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAnnouncementsForCadet } from '@/lib/db';
import type { Announcement, AnnouncementPriority } from '@/types';
import { Bell, AlertTriangle, BookOpen, Calendar, Megaphone, Info } from 'lucide-react';

const PRIORITY_CONFIG: Record<AnnouncementPriority, { label: string; color: string; bg: string; border: string; icon: React.ReactNode }> = {
  urgent: { label: 'Urgent', color: '#dc2626', bg: '#fef2f2', border: '#dc2626', icon: <AlertTriangle size={16} /> },
  important: { label: 'Important', color: '#b45309', bg: '#fffbeb', border: '#fde68a', icon: <AlertTriangle size={16} /> },
  training: { label: 'Training', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', icon: <BookOpen size={16} /> },
  event: { label: 'Event', color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', icon: <Calendar size={16} /> },
  general: { label: 'Notice', color: '#374151', bg: '#f9fafb', border: '#e5e7eb', icon: <Megaphone size={16} /> },
};

export default function CadetNoticesPage() {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid || !userProfile?.branch) return;
    getAnnouncementsForCadet(userProfile.uid, userProfile.branch).then(setAnnouncements).finally(() => setLoading(false));
  }, [userProfile]);

  const pinned = announcements.filter(a => a.pinned);
  const regular = announcements.filter(a => !a.pinned);

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin', 'alumni']}>
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--navy-50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bell size={22} color="var(--navy-600)" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)', margin: 0 }}>Notices & Announcements</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>{announcements.length} active notices for you</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : announcements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Bell size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.4 }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>No announcements for you right now.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Check back later for notices from your ANO.</p>
          </div>
        ) : (
          <div>
            {/* Pinned */}
            {pinned.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                  📌 PINNED NOTICES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pinned.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}
                </div>
              </div>
            )}

            {/* Regular */}
            {regular.length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                  ALL NOTICES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {regular.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function AnnouncementCard({ ann }: { ann: Announcement }) {
  const cfg = PRIORITY_CONFIG[ann.priority] || PRIORITY_CONFIG.general;
  return (
    <div style={{
      background: cfg.bg,
      border: `1.5px solid ${cfg.border}`,
      borderRadius: 12, padding: '16px 18px',
      borderLeft: `4px solid ${cfg.color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: cfg.color }}>
          {cfg.icon}
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{cfg.label}</span>
        </div>
        {ann.pinned && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold-700)', background: 'var(--gold-100)', padding: '2px 8px', borderRadius: 99 }}>📌 Pinned</span>}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 6 }}>{ann.title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{ann.body}</div>
      {ann.attachmentUrl && (
        <a href={ann.attachmentUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 10, fontSize: 12, color: cfg.color, fontWeight: 600, textDecoration: 'none' }}>
          📎 View Attachment →
        </a>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
        — {ann.createdByName}
      </div>
    </div>
  );
}
