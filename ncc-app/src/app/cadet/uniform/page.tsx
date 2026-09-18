'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getInventoryIssuesByCadet } from '@/lib/db';
import type { InventoryIssue } from '@/types';
import { Package, CheckCircle, Clock, RotateCcw, AlertTriangle } from 'lucide-react';

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  'Uniform':          '👕',
  'Equipment':        '🎒',
  'Weapon (Training)':'🔫',
  'Navigation':       '🧭',
  'Sports':           '⚽',
  'Naval':            '⚓',
  'Camp Gear':        '⛺',
  'IT':               '💻',
  'Documents':        '📄',
  'Other':            '📦',
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function isOverdue(issue: InventoryIssue) {
  if (issue.returnedDate || !issue.returnDate) return false;
  return new Date(issue.returnDate) < new Date();
}

// ─── Sub-components (outside page to prevent focus-loss) ─────────────────────

function IssueRow({ issue }: { issue: InventoryIssue }) {
  const returned = !!issue.returnedDate;
  const overdue = isOverdue(issue);
  const emoji = CATEGORY_EMOJI['Other']; // items don't carry category — default

  let statusColor = '#15803d';
  let statusBg = '#f0fdf4';
  let statusLabel = 'Returned';
  let StatusIcon = CheckCircle;

  if (!returned && overdue) {
    statusColor = '#dc2626'; statusBg = '#fef2f2'; statusLabel = 'Overdue'; StatusIcon = AlertTriangle;
  } else if (!returned) {
    statusColor = '#d97706'; statusBg = '#fffbeb'; statusLabel = 'With Cadet'; StatusIcon = Clock;
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto',
      gap: 14,
      padding: '14px 18px',
      alignItems: 'center',
      borderBottom: '1px solid var(--border-light)',
    }}>
      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        📦
      </div>

      {/* Details */}
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 3 }}>
          {issue.itemName}
          <span style={{
            marginLeft: 8, fontSize: 11, fontWeight: 600,
            padding: '1px 8px', borderRadius: 99,
            background: 'var(--bg-secondary)', color: 'var(--text-muted)',
          }}>
            Qty: {issue.quantity}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span>📅 Issued: {formatDate(issue.issueDate)}</span>
          {issue.returnDate && !returned && (
            <span style={{ color: overdue ? '#dc2626' : 'var(--text-muted)', fontWeight: overdue ? 600 : 400 }}>
              ↩ Return by: {formatDate(issue.returnDate)}
            </span>
          )}
          {issue.returnedDate && (
            <span style={{ color: '#15803d' }}>✓ Returned: {formatDate(issue.returnedDate)}</span>
          )}
          {issue.issuedBy && <span>Issued by: {issue.issuedBy}</span>}
          {issue.condition && <span>Condition: {issue.condition}</span>}
          {issue.remarks && <span>· {issue.remarks}</span>}
        </div>
      </div>

      {/* Status badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
        padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700,
        background: statusBg, color: statusColor,
      }}>
        <StatusIcon size={12} /> {statusLabel}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CadetUniformPage() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<InventoryIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getInventoryIssuesByCadet(user.uid)
      .then(setIssues)
      .finally(() => setLoading(false));
  }, [user]);

  const withMe = issues.filter(i => !i.returnedDate);
  const returned = issues.filter(i => !!i.returnedDate);
  const overdue = issues.filter(i => isOverdue(i));

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet', 'ano', 'oic', 'admin']}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontFamily: "'Rajdhani', sans-serif", fontSize: 28,
            fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '0.3px',
          }}>
            Uniform & Equipment Issued
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Inventory items issued to you by the unit quartermaster
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total Issued', value: issues.length, color: 'var(--navy-600)' },
            { label: 'With Me', value: withMe.length, color: '#d97706' },
            { label: 'Returned', value: returned.length, color: '#15803d' },
            { label: 'Overdue', value: overdue.length, color: overdue.length > 0 ? '#dc2626' : '#15803d' },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface-0)', border: `1px solid ${s.label === 'Overdue' && overdue.length > 0 ? '#fecaca' : 'var(--border-light)'}`,
              borderRadius: 12, padding: '16px 18px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color, fontFamily: 'Rajdhani, sans-serif', lineHeight: 1 }}>
                {loading ? '—' : s.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Overdue alert */}
        {!loading && overdue.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, marginBottom: 20,
          }}>
            <AlertTriangle size={20} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 700, color: '#dc2626', fontSize: 14 }}>
                {overdue.length} item{overdue.length > 1 ? 's' : ''} overdue for return
              </div>
              <div style={{ fontSize: 12, color: '#9f1239', marginTop: 2 }}>
                Please return overdue items to the unit quartermaster immediately.
              </div>
            </div>
          </div>
        )}

        {/* Items currently with me */}
        {!loading && withMe.length > 0 && (
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 14, overflow: 'hidden', marginBottom: 20,
          }}>
            <div style={{
              padding: '13px 18px', borderBottom: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#fffbeb',
            }}>
              <Clock size={15} color="#d97706" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>
                Currently With Me ({withMe.length})
              </span>
            </div>
            {withMe.map(issue => <IssueRow key={issue.id} issue={issue} />)}
          </div>
        )}

        {/* Returned items */}
        {!loading && returned.length > 0 && (
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 14, overflow: 'hidden',
          }}>
            <div style={{
              padding: '13px 18px', borderBottom: '1px solid var(--border-light)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <RotateCcw size={15} color="#15803d" />
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)' }}>
                Returned ({returned.length})
              </span>
            </div>
            {returned.map(issue => <IssueRow key={issue.id} issue={issue} />)}
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 72, borderRadius: 12 }} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && issues.length === 0 && (
          <div style={{
            background: 'var(--surface-0)', border: '1px solid var(--border-light)',
            borderRadius: 16, padding: '60px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>
              No items issued yet
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Uniform, equipment, and gear issued to you by the quartermaster will appear here
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
