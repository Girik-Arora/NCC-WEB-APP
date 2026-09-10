'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllCadets, deleteCadetDoc } from '@/lib/db';
import { CadetProfile } from '@/types';
import toast from 'react-hot-toast';
import { Users, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

export default function AdminCadetsPage() {
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAllCadets();
      setCadets(data);
    } catch (error) {
      toast.error('Failed to load cadets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (uid: string, name: string) => {
    if (!confirm(`Are you sure you want to delete profile data for ${name}?`)) return;
    try {
      await deleteCadetDoc(uid);
      toast.success('Cadet profile deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete cadet profile');
    }
  };

  return (
    <AppShell requiredRole="admin">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>Cadets</h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Manage cadet profiles globally.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>NAME</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ROLL NO.</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>BRANCH</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>SEMESTER</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : cadets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No cadets found.</td>
                </tr>
              ) : (
                cadets.map((c) => (
                  <tr key={c.uid} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: '#0f172a' }}>{c.firstName} {c.lastName}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{c.rollNumber || '-'}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{c.branch}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{c.semester}</td>
                    <td style={{ padding: '16px', display: 'flex', gap: 8 }}>
                      <Link 
                        href={`/ano/cadets/${c.uid}`}
                        className="btn-primary" 
                        style={{ padding: '6px 12px', fontSize: 12, textDecoration: 'none' }}
                      >
                        <Eye size={14} /> View
                      </Link>
                      <button 
                        onClick={() => handleDelete(c.uid, `${c.firstName} ${c.lastName}`)}
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
    </AppShell>
  );
}
