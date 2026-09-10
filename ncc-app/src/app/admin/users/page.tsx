'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllUsers, updateUserRole, deleteUserDoc } from '@/lib/db';
import { UserProfile } from '@/types';
import toast from 'react-hot-toast';
import { sendPasswordReset } from '@/lib/auth';
import { ShieldAlert, Trash2, Edit, Key } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{uid: string, email: string} | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRoleChange = async (uid: string, currentRole: string, newRole: string) => {
    if (currentRole === newRole) return;
    if (!confirm(`Change role to ${newRole}?`)) return;
    try {
      await updateUserRole(uid, newRole);
      toast.success('Role updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDelete = async (uid: string, name: string) => {
    if (!confirm(`Are you sure you want to delete data for ${name}?\nWARNING: This deletes their Firestore profile, but they may still exist in Auth.`)) return;
    try {
      await deleteUserDoc(uid);
      toast.success('User data deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleOpenPasswordModal = (uid: string, email: string) => {
    setSelectedUser({ uid, email });
    setNewPassword('');
    setPasswordModalOpen(true);
  };

  const handleDirectPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChanging(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: selectedUser.uid, newPassword }),
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Password changed successfully');
        setPasswordModalOpen(false);
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <AppShell requiredRole="admin">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Users</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Manage system access and roles.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>NAME</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>EMAIL</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ROLE</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.uid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: '#0f172a' }}>{u.displayName}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{u.email}</td>
                    <td style={{ padding: '16px' }}>
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u.uid, u.role, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, background: u.role === 'admin' ? '#fef2f2' : u.role === 'ano' ? '#eff6ff' : u.role === 'mod_cadet' ? '#f5f3ff' : '#fff' }}
                      >
                        <option value="cadet">Cadet</option>
                        <option value="mod_cadet">Senior Cadet</option>
                        <option value="ano">ANO</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '16px', display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => handleOpenPasswordModal(u.uid, u.email)}
                        className="btn-ghost" 
                        style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #cbd5e1' }}
                        title="Force Change Password"
                      >
                        <Key size={14} /> Change Password
                      </button>
                      <button 
                        onClick={() => handleDelete(u.uid, u.displayName)}
                        className="btn-danger" 
                        style={{ padding: '6px 12px', fontSize: 12 }}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Change Modal */}
      {passwordModalOpen && selectedUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Change Password</h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
              Enter a new password for <strong>{selectedUser.email}</strong>.
            </p>
            <form onSubmit={handleDirectPasswordChange}>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">New Password</label>
                <input
                  type="text"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  minLength={6}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setPasswordModalOpen(false)}
                  disabled={isChanging}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isChanging}
                >
                  {isChanging ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
