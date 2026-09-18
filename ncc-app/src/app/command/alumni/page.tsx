'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllAlumni } from '@/lib/db';
import type { AlumniProfile } from '@/types';
import { GraduationCap, Briefcase, Mail, Phone, ExternalLink } from 'lucide-react';
import { RANK_LABELS } from '@/types';

export default function CommandAlumniPage() {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllAlumni()
      .then(setAlumni)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>
              Alumni Directory
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
              {alumni.length} registered alumni
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading alumni...</div>
        ) : alumni.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'var(--surface-0)', borderRadius: 12, border: '1px solid var(--border-light)' }}>
            <GraduationCap size={48} color="var(--border-strong)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>No Alumni Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Cadets who are discharged and marked as alumni will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {alumni.map((alum) => (
              <div key={alum.uid} className="card" style={{ padding: 20 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div className="avatar avatar-lg" style={{ background: 'var(--navy-100)', color: 'var(--navy-700)' }}>
                    {alum.firstName?.[0] || ''}{alum.lastName?.[0] || ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 2 }}>
                      {alum.firstName} {alum.lastName}
                    </h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
                      {alum.nccRank && (
                        <span className="badge badge-blue">{RANK_LABELS[alum.nccRank] || alum.nccRank}</span>
                      )}
                      {alum.batch && (
                        <span className="badge badge-gray">Batch: {alum.batch}</span>
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                      {(alum.currentProfession || alum.organization) && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Briefcase size={14} color="var(--text-muted)" />
                          <span>
                            {alum.currentProfession || 'Professional'} 
                            {alum.organization ? ` at ${alum.organization}` : ''}
                          </span>
                        </div>
                      )}
                      
                      {alum.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Mail size={14} color="var(--text-muted)" />
                          <a href={`mailto:${alum.email}`} style={{ color: 'var(--navy-600)', textDecoration: 'none' }}>
                            {alum.email}
                          </a>
                        </div>
                      )}
                      
                      {alum.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Phone size={14} color="var(--text-muted)" />
                          <span>{alum.phone}</span>
                        </div>
                      )}
                      
                      {alum.linkedIn && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ExternalLink size={14} color="var(--text-muted)" />
                          <a href={alum.linkedIn} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy-600)', textDecoration: 'none' }}>
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {(alum.defenceService || alum.higherStudies) && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-light)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {alum.defenceService && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 4 }}>
                        {alum.defenceArm || 'Defence Services'}
                      </span>
                    )}
                    {alum.higherStudies && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', background: 'var(--info-bg)', color: 'var(--info)', borderRadius: 4 }}>
                        Higher Studies
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
