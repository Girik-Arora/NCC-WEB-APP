'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllUsers, updateUserRole, updateUserBranch, updateUserNccRank } from '@/lib/db';
import type { UserProfile, UserRole, Wing } from '@/types';
import { ROLE_LABELS } from '@/types';
import { Shield, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLE_COLORS: Record<UserRole, { color: string; bg: string }> = {
  admin: { color: '#dc2626', bg: '#fef2f2' },
  ano: { color: '#15803d', bg: '#f0fdf4' },
  oic: { color: '#0369a1', bg: '#f0f9ff' },
  clerk: { color: '#b45309', bg: '#fffbeb' },
  mod_cadet: { color: '#7c3aed', bg: '#faf5ff' },
  cadet: { color: '#4b5563', bg: '#f9fafb' },
  alumni: { color: '#6b7280', bg: '#f3f4f6' },
};

const ALL_ROLES: UserRole[] = ['admin', 'ano', 'oic', 'clerk', 'mod_cadet', 'cadet', 'alumni'];

export default function CommandAdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => getAllUsers().then(setUsers).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    if (!search.trim()) return true;
    return u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
  });

  const handleRoleChange = async (uid: string, role: UserRole) => {
    setUpdating(uid);
    try {
      await updateUserRole(uid, role);
      toast.success('Role updated');
      load();
    } catch { toast.error('Failed to update role'); }
    finally { setUpdating(null); }
  };

  const handleBranchChange = async (uid: string, branch: Wing) => {
    setUpdating(uid);
    try {
      await updateUserBranch(uid, branch);
      toast.success('Wing updated');
      load();
    } catch { toast.error('Failed'); }
    finally { setUpdating(null); }
  };

  const handleRankChange = async (uid: string, rank: string) => {
    setUpdating(uid);
    try {
      await updateUserNccRank(uid, rank);
      toast.success('Rank updated');
      load();
    } catch { toast.error('Failed'); }
    finally { setUpdating(null); }
  };

  const roleDistribution: Record<string, number> = {};
  users.forEach(u => { roleDistribution[u.role] = (roleDistribution[u.role] || 0) + 1; });

  return (
    <AppShell requiredRole={['admin']}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>Manage user roles, wings, and permissions</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(roleDistribution).map(([role, count]) => {
              const rcfg = ROLE_COLORS[role as UserRole] || { color: '#6b7280', bg: '#f9fafb' };
              return (
                <div key={role} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: rcfg.bg, color: rcfg.color, border: `1px solid ${rcfg.color}30` }}>
                  {ROLE_LABELS[role as UserRole] || role}: {count}
                </div>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20, maxWidth: 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." style={{ width: '100%', paddingLeft: 36, height: 40, border: '1.5px solid var(--border-light)', borderRadius: 10, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                  {['User', 'Email', 'Current Role', 'Wing', 'NCC Rank', 'Change Role', 'Change Wing'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, idx) => {
                  const rcfg = ROLE_COLORS[user.role] || { color: '#6b7280', bg: '#f9fafb' };
                  const isUpdating = updating === user.uid;
                  return (
                    <tr key={user.uid} style={{ borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-light)' : 'none' }} className="table-row-hover">
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-heading)' }}>{user.displayName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>UID: {user.uid.slice(0, 8)}…</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-body)' }}>{user.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: rcfg.bg, color: rcfg.color }}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>{user.branch || '—'}</td>
                      <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)', fontWeight: 500 }}>{user.nccRank || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={user.role}
                          disabled={isUpdating}
                          onChange={e => handleRoleChange(user.uid, e.target.value as UserRole)}
                          style={{ height: 34, padding: '0 10px', borderRadius: 8, fontSize: 12, border: '1.5px solid var(--border-light)', background: 'var(--surface-0)', color: 'var(--text-body)', cursor: 'pointer', opacity: isUpdating ? 0.5 : 1 }}
                        >
                          {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <select
                          value={user.branch || ''}
                          disabled={isUpdating}
                          onChange={e => handleBranchChange(user.uid, e.target.value as Wing)}
                          style={{ height: 34, padding: '0 10px', borderRadius: 8, fontSize: 12, border: '1.5px solid var(--border-light)', background: 'var(--surface-0)', color: 'var(--text-body)', cursor: 'pointer', opacity: isUpdating ? 0.5 : 1 }}
                        >
                          <option value="">No wing</option>
                          <option value="Army">Army</option>
                          <option value="Navy">Navy</option>
                          <option value="Air Force">Air Force</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No users found.</div>}
          </div>
        )}
      </div>
      <style>{`.table-row-hover:hover { background: var(--bg-secondary); }`}</style>
    </AppShell>
  );
}
