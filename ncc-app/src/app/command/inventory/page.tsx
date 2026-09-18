'use client';

import { useEffect, useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getAllInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, getAllInventoryIssues, addInventoryIssue, returnInventoryIssue, getAllCadets } from '@/lib/db';
import type { InventoryItem, InventoryIssue, InventoryCategory, CadetProfile } from '@/types';
import { Package, Plus, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES: InventoryCategory[] = [
  'Uniform', 'Equipment', 'Weapon (Training)', 'Navigation',
  'Sports', 'Naval', 'Camp Gear', 'IT', 'Documents', 'Other',
];

const CAT_COLORS: Record<string, string> = {
  'Uniform': '#0369a1', 'Equipment': '#7c3aed', 'Weapon (Training)': '#dc2626',
  'Sports': '#15803d', 'Naval': '#0891b2', 'IT': '#6b7280',
};

export default function CommandInventoryPage() {
  const { userProfile } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [issues, setIssues] = useState<InventoryIssue[]>([]);
  const [cadets, setCadets] = useState<CadetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'inventory' | 'issues'>('inventory');
  const [showForm, setShowForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: '', category: 'Uniform' as InventoryCategory, description: '', totalQuantity: 0, availableQuantity: 0, unit: 'pcs', location: '', condition: 'Good' });
  const [issueForm, setIssueForm] = useState({ itemId: '', cadetUid: '', quantity: 1, issueDate: new Date().toISOString().split('T')[0], returnDate: '', remarks: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [inv, iss, cad] = await Promise.all([getAllInventory(), getAllInventoryIssues(), getAllCadets()]);
    setItems(inv);
    setIssues(iss);
    setCadets(cad);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addInventoryItem({ ...form, createdBy: userProfile?.uid || '', createdAt: new Date() as any, updatedAt: new Date() as any });
      toast.success('Item added');
      setShowForm(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.itemId || !issueForm.cadetUid) { toast.error('Select item and cadet'); return; }
    setSaving(true);
    try {
      const item = items.find(i => i.id === issueForm.itemId);
      const cadet = cadets.find(c => c.uid === issueForm.cadetUid);
      await addInventoryIssue({
        ...issueForm,
        itemName: item?.name || '',
        cadetName: cadet ? `${cadet.firstName} ${cadet.lastName}` : '',
        issuedBy: userProfile?.displayName || '',
        createdAt: new Date() as any,
      });
      toast.success('Item issued');
      setShowIssueForm(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: '100%', height: 40, padding: '0 12px', border: '1.5px solid var(--border-light)', borderRadius: 8, fontSize: 13, background: 'var(--surface-0)', color: 'var(--text-body)', outline: 'none', boxSizing: 'border-box' };

  return (
    <AppShell requiredRole={['ano', 'oic', 'admin', 'clerk']}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-heading)' }}>Inventory & Logistics</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>{items.length} items · {issues.filter(i => !i.returnedDate).length} items on issue</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setShowIssueForm(true); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1.5px solid var(--navy-600)', background: 'transparent', color: 'var(--navy-600)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Issue Item
            </button>
            <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: 'var(--navy-600)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none' }}>
              <Plus size={14} /> Add Item
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border-light)' }}>
          {(['inventory', 'issues'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '10px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13,
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? 'var(--navy-600)' : 'var(--text-secondary)',
              borderBottom: tab === t ? '2.5px solid var(--navy-600)' : '2.5px solid transparent',
            }}>
              {t === 'inventory' ? `Inventory (${items.length})` : `Issue Register (${issues.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div>
        ) : tab === 'inventory' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {items.map(item => {
              const color = CAT_COLORS[item.category] || '#6b7280';
              const isLow = item.availableQuantity <= 2;
              return (
                <div key={item.id} style={{ background: 'var(--surface-0)', border: `1px solid ${isLow ? 'var(--danger-border)' : 'var(--border-light)'}`, borderRadius: 12, padding: 18, position: 'relative' }}>
                  {isLow && <div style={{ position: 'absolute', top: 10, right: 10 }}><AlertTriangle size={16} color="var(--danger)" /></div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${color}15`, color }}>{item.category}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{item.description}</div>}
                  <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-heading)' }}>{item.totalQuantity} {item.unit}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Available</div>
                      <div style={{ fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--success)' }}>{item.availableQuantity} {item.unit}</div>
                    </div>
                  </div>
                  {item.location && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>📍 {item.location}</div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-light)', borderRadius: 14, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border-light)' }}>
                  {['Item', 'Cadet', 'Qty', 'Issue Date', 'Return Date', 'Returned', 'Issued By'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: 0.8, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((iss, idx) => (
                  <tr key={iss.id} style={{ borderBottom: idx < issues.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{iss.itemName}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-body)' }}>{iss.cadetName}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700 }}>{iss.quantity}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{iss.issueDate}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13 }}>{iss.returnDate || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {iss.returnedDate ? (
                        <span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>✅ {iss.returnedDate}</span>
                      ) : (
                        <button onClick={async () => {
                          await returnInventoryIssue(iss.id!, iss.itemId, iss.quantity, userProfile?.displayName || '');
                          toast.success('Returned'); load();
                        }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--border-light)', background: 'none', cursor: 'pointer', color: 'var(--warning)' }}>
                          Mark Returned
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{iss.issuedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Item Modal */}
        {showForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-xl)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
              <button onClick={() => setShowForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>Add Inventory Item</h2>
              <form onSubmit={handleAddItem}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Item Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category</label>
                    <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as InventoryCategory }))} style={inputStyle}>
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Total Qty</label><input type="number" value={form.totalQuantity} onChange={e => setForm(f => ({ ...f, totalQuantity: parseInt(e.target.value), availableQuantity: parseInt(e.target.value) }))} style={inputStyle} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Available</label><input type="number" value={form.availableQuantity} onChange={e => setForm(f => ({ ...f, availableQuantity: parseInt(e.target.value) }))} style={inputStyle} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Unit</label><input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="pcs" style={inputStyle} /></div>
                  </div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Storage Location</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. NCC Room, Shelf A" style={inputStyle} /></div>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Add Item'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Issue Item Modal */}
        {showIssueForm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: 20 }}>
            <div style={{ background: 'var(--surface-0)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
              <button onClick={() => setShowIssueForm(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--text-muted)" /></button>
              <h2 style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Rajdhani, sans-serif', marginBottom: 20 }}>Issue Item to Cadet</h2>
              <form onSubmit={handleIssue}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Select Item</label>
                    <select value={issueForm.itemId} onChange={e => setIssueForm(f => ({ ...f, itemId: e.target.value }))} style={inputStyle}>
                      <option value="">-- Select Item --</option>
                      {items.filter(i => i.availableQuantity > 0).map(i => <option key={i.id} value={i.id}>{i.name} (Avail: {i.availableQuantity})</option>)}
                    </select>
                  </div>
                  <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Select Cadet</label>
                    <select value={issueForm.cadetUid} onChange={e => setIssueForm(f => ({ ...f, cadetUid: e.target.value }))} style={inputStyle}>
                      <option value="">-- Select Cadet --</option>
                      {cadets.map(c => <option key={c.uid} value={c.uid}>{c.firstName} {c.lastName} ({c.nccRank || 'CDT'})</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Qty</label><input type="number" min={1} value={issueForm.quantity} onChange={e => setIssueForm(f => ({ ...f, quantity: parseInt(e.target.value) }))} style={inputStyle} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Issue Date</label><input type="date" value={issueForm.issueDate} onChange={e => setIssueForm(f => ({ ...f, issueDate: e.target.value }))} style={inputStyle} /></div>
                    <div><label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Return Date</label><input type="date" value={issueForm.returnDate} onChange={e => setIssueForm(f => ({ ...f, returnDate: e.target.value }))} style={inputStyle} /></div>
                  </div>
                </div>
                <button type="submit" disabled={saving} style={{ marginTop: 20, width: '100%', height: 44, background: 'var(--navy-600)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Issuing...' : 'Issue Item'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
