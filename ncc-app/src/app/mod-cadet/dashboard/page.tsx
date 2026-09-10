'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCadets, getCadetsByWing, getCadetSkills, getCadetAchievements, getCampHistory, getPendingVerifications, verifySkill, verifyAchievement, verifyCampRecord } from '@/lib/db';
import type { CadetProfile, PendingVerificationItem, Wing } from '@/types';
import { RANK_LABELS } from '@/types';
import toast from 'react-hot-toast';
import {
  CheckCircle, XCircle, Clock, Users, Star, Trophy, Tent,
  LayoutDashboard, ShieldCheck, ChevronRight, AlertCircle, User
} from 'lucide-react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import { useSearchParams, useRouter } from 'next/navigation';

// ── Shared cadet section components (re-use from cadet portal) ──────────────
// We import these inline via lazy pages via the tab router approach

type Tab = 'my-profile' | 'verify';

export default function ModCadetDashboard() {
  const { userProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get('tab') as Tab | null;
  
  const [activeTab, setActiveTab] = useState<Tab>(tabParam === 'verify' ? 'verify' : 'my-profile');
  
  useEffect(() => {
    if (tabParam === 'verify' || tabParam === 'my-profile') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [pendingItems, setPendingItems] = useState<PendingVerificationItem[]>([]);
  const [wingCadets, setWingCadets] = useState<CadetProfile[]>([]);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PendingVerificationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const branch = userProfile?.branch as Wing | undefined;
  const modName = userProfile?.displayName || 'Senior Cadet';

  useEffect(() => {
    if (activeTab !== 'verify' || !branch) return;
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, branch]);

  const loadPending = async () => {
    if (!branch) return;
    setLoadingVerify(true);
    try {
      const cadets = await getCadetsByWing(branch);
      setWingCadets(cadets);
      const items = await getPendingVerifications(branch, cadets);
      setPendingItems(items);
    } catch (err) {
      toast.error('Failed to load pending verifications.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleApprove = async (item: PendingVerificationItem) => {
    setProcessingId(item.itemId);
    try {
      if (item.type === 'skill') {
        await verifySkill(item.cadetUid, item.itemId, 'verified', modName);
      } else if (item.type === 'achievement') {
        await verifyAchievement(item.itemId, 'verified', modName);
      } else {
        await verifyCampRecord(item.itemId, 'verified', modName);
      }
      toast.success(`${item.title} approved ✓`);
      setPendingItems((prev) => prev.filter((p) => p.itemId !== item.itemId));
    } catch {
      toast.error('Failed to approve. Try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) { toast.error('Please provide a rejection reason.'); return; }
    setProcessingId(rejectTarget.itemId);
    try {
      if (rejectTarget.type === 'skill') {
        await verifySkill(rejectTarget.cadetUid, rejectTarget.itemId, 'rejected', modName, rejectReason);
      } else if (rejectTarget.type === 'achievement') {
        await verifyAchievement(rejectTarget.itemId, 'rejected', modName, rejectReason);
      } else {
        await verifyCampRecord(rejectTarget.itemId, 'rejected', modName, rejectReason);
      }
      toast.success(`${rejectTarget.title} rejected.`);
      setPendingItems((prev) => prev.filter((p) => p.itemId !== rejectTarget.itemId));
      setRejectTarget(null);
      setRejectReason('');
    } catch {
      toast.error('Failed to reject. Try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const typeIcon = (type: string) => {
    if (type === 'skill') return <Star size={14} color="#f59e0b" />;
    if (type === 'achievement') return <Trophy size={14} color="#7c3aed" />;
    return <Tent size={14} color="#16a34a" />;
  };

  const typeLabel = (type: string) => {
    if (type === 'skill') return { label: 'Skill', color: '#f59e0b', bg: '#fffbeb' };
    if (type === 'achievement') return { label: 'Achievement', color: '#7c3aed', bg: '#f5f3ff' };
    return { label: 'Camp', color: '#16a34a', bg: '#f0fdf4' };
  };

  return (
    <AppShell requiredRole={['mod_cadet']}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.3px' }}>
              {RANK_LABELS[userProfile?.nccRank || ''] || userProfile?.nccRank || 'Senior Cadet'} Dashboard
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {branch} Wing · {modName}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'var(--bg-secondary)', borderRadius: 12, padding: 4, border: '1px solid var(--border-light)', width: 'fit-content' }}>
        {[
          { id: 'my-profile' as Tab, label: '👤 My Profile', desc: 'Manage your own info' },
          { id: 'verify' as Tab, label: '✅ Verify Cadets', desc: `${pendingItems.length} pending`, badge: pendingItems.length },
        ].map((tab) => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); router.replace(`/mod-cadet/dashboard?tab=${tab.id}`); }}
            style={{
              padding: '10px 20px', border: 'none', borderRadius: 8, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? 'var(--navy-700)' : 'var(--text-muted)',
              boxShadow: activeTab === tab.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.18s ease',
              display: 'flex', alignItems: 'center', gap: 8, position: 'relative',
            }}>
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* My Profile Tab — links to cadet sub-pages */}
      {activeTab === 'my-profile' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { href: '/mod-cadet/profile', icon: <User size={20} />, label: 'My Profile', desc: 'Complete your personal details', color: '#2563eb', bg: '#eff6ff' },
              { href: '/mod-cadet/skills', icon: <Star size={20} />, label: 'My Skills', desc: 'Add and track your skills', color: '#f59e0b', bg: '#fffbeb' },
              { href: '/mod-cadet/achievements', icon: <Trophy size={20} />, label: 'My Achievements', desc: 'Log your achievements', color: '#7c3aed', bg: '#f5f3ff' },
              { href: '/mod-cadet/camps', icon: <Tent size={20} />, label: 'Camp History', desc: 'Record your camp participation', color: '#16a34a', bg: '#f0fdf4' },
              { href: '/mod-cadet/availability', icon: <CheckCircle size={20} />, label: 'Availability', desc: 'Set your camp availability', color: '#0369a1', bg: '#f0f9ff' },
            ].map((item) => (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: '20px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, marginBottom: 12 }}>
                    {item.icon}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="card" style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1px solid #fbbf24' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ShieldCheck size={20} color="#d97706" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Senior Cadet Responsibilities</p>
                <p style={{ fontSize: 12, color: '#b45309' }}>
                  As a {RANK_LABELS[userProfile?.nccRank || ''] || 'Senior Cadet'} in the {branch} Wing, you are responsible for verifying submissions from junior cadets in your wing before they are seen by the ANO.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verify Cadets Tab */}
      {activeTab === 'verify' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>Pending Verifications</h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
                {branch} Wing · {wingCadets.length} cadets · {pendingItems.length} pending items
              </p>
            </div>
            <button className="btn-ghost" onClick={loadPending} disabled={loadingVerify} style={{ fontSize: 13 }}>
              {loadingVerify ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {loadingVerify ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
            </div>
          ) : pendingItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>All caught up!</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>No pending submissions to verify.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pendingItems.map((item) => {
                const { label, color, bg } = typeLabel(item.type);
                const isProcessing = processingId === item.itemId;
                return (
                  <div key={`${item.type}-${item.itemId}`} className="card" style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Type badge */}
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {typeIcon(item.type)}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: '2px 8px', borderRadius: 6 }}>{label}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>from</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' }}>{item.cadetName}</span>
                        </div>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', marginBottom: 2 }}>{item.title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.details}</p>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                          onClick={() => handleApprove(item)}
                          disabled={isProcessing}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: '#f0fdf4', color: '#16a34a', fontWeight: 600, fontSize: 13,
                            fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                            opacity: isProcessing ? 0.6 : 1,
                          }}>
                          <CheckCircle size={14} /> Approve
                        </button>
                        <button
                          onClick={() => { setRejectTarget(item); setRejectReason(''); }}
                          disabled={isProcessing}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: 13,
                            fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                            opacity: isProcessing ? 0.6 : 1,
                          }}>
                          <XCircle size={14} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }} onClick={() => setRejectTarget(null)}>
          <div className="card" style={{ width: '100%', maxWidth: 440, padding: 28 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <XCircle size={20} color="#dc2626" />
              <h3 style={{ fontWeight: 700, color: 'var(--text-heading)' }}>Reject Submission</h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Rejecting <strong>{rejectTarget.title}</strong> from <strong>{rejectTarget.cadetName}</strong>. Please provide a reason — the cadet will see this.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Certificate not attached, invalid level claimed..."
              rows={3}
              style={{
                width: '100%', borderRadius: 8, border: '1.5px solid var(--border-mid)',
                padding: '10px 12px', fontSize: 13, fontFamily: 'Inter, sans-serif',
                resize: 'vertical', color: 'var(--text-heading)', background: 'var(--bg-primary)',
              }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setRejectTarget(null)}>Cancel</button>
              <button
                onClick={handleRejectSubmit}
                disabled={!!processingId}
                style={{
                  padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: '#dc2626', color: 'white', fontWeight: 600, fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                }}>
                {processingId ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} } .skeleton { border-radius: 12px; background: var(--bg-secondary); animation: pulse 1.5s ease-in-out infinite; }`}</style>
    </AppShell>
  );
}
