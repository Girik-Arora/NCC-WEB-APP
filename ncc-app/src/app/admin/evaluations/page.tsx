'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { getAllEvaluations, deleteEvaluationAdmin, getAllCadets, getAllUsers } from '@/lib/db';
import { SemesterEvaluation } from '@/types';
import toast from 'react-hot-toast';
import { ClipboardList, Trash2 } from 'lucide-react';

interface EvaluationRow extends SemesterEvaluation {
  cadetName: string;
  anoName: string;
}

export default function AdminEvaluationsPage() {
  const [evaluations, setEvaluations] = useState<EvaluationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allEvals, allCadets, allUsers] = await Promise.all([
        getAllEvaluations(),
        getAllCadets(),
        getAllUsers(),
      ]);
      
      const cadetMap = allCadets.reduce((acc, c) => {
        acc[c.uid] = `${c.firstName} ${c.lastName}`;
        return acc;
      }, {} as Record<string, string>);

      const userMap = allUsers.reduce((acc, u) => {
        acc[u.uid] = u.displayName;
        return acc;
      }, {} as Record<string, string>);

      const mapped: EvaluationRow[] = allEvals.map(e => ({
        ...e,
        cadetName: cadetMap[e.cadetUid] || 'Unknown Cadet',
        anoName: userMap[e.anoUid] || 'Unknown ANO',
      }));
      
      setEvaluations(mapped.sort((a, b) => b.semester - a.semester));
    } catch (error) {
      toast.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (id: string, cadetName: string) => {
    if (!confirm(`Are you sure you want to delete the evaluation for ${cadetName}?`)) return;
    try {
      await deleteEvaluationAdmin(id);
      toast.success('Evaluation deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete evaluation');
    }
  };

  return (
    <AppShell requiredRole="admin">
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <ClipboardList size={24} color="#ea580c" /> Global Evaluations
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>Monitor all semester evaluations system-wide.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>CADET</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ANO</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>SEM/YEAR</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>SCORE</th>
                <th style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontWeight: 600 }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>Loading...</td>
                </tr>
              ) : evaluations.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No evaluations found.</td>
                </tr>
              ) : (
                evaluations.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: '#0f172a' }}>{e.cadetName}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>{e.anoName}</td>
                    <td style={{ padding: '16px', color: '#475569', fontSize: 14 }}>Sem {e.semester} ({e.year})</td>
                    <td style={{ padding: '16px', color: '#16a34a', fontWeight: 700 }}>
                      {e.discipline + e.leadership + e.drill + e.attendance + e.initiative + e.physicalFitness + e.teamwork + e.communication} / 40
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button 
                        onClick={() => handleDelete(e.id, e.cadetName)}
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
