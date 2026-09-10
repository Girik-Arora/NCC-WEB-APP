'use client';

import { useState } from 'react';
import AppShell from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { getCadetSkills, saveCadetSkills, addAchievement, addCampRecord } from '@/lib/db';
import type { Skill, Achievement, CampRecord, CampType, Grade } from '@/types';
import toast from 'react-hot-toast';
import { Zap, Link as LinkIcon, Loader2, CheckCircle2, ShieldAlert, ArrowRight, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AutoLodgePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [url, setUrl] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Input, 2: Scanning, 3: Review, 4: Success
  const [findings, setFindings] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes('drive.google.com')) {
      toast.error('Please enter a valid Google Drive link.');
      return;
    }
    
    setStep(2); // Scanning phase
    try {
      const res = await fetch('/api/lodge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setFindings(data.findings);
      setStep(3); // Review phase
    } catch (err: any) {
      toast.error(err.message || 'Failed to scan drive.');
      setStep(1);
    }
  };

  const handleConfirmAndUpload = async () => {
    if (!user) return;
    setUploading(true);
    
    try {
      // Fetch existing skills first
      const existingSkills = await getCadetSkills(user.uid);
      const newSkills = [...existingSkills];
      let skillsUpdated = false;

      for (const item of findings) {
        if (item.type === 'camp') {
          const campData = {
            campType: item.category as CampType,
            year: parseInt(item.date.split('-')[0]),
            location: 'Extracted via Auto-Lodge',
            grade: 'A' as Grade,
            certificateUrl: url, // Simulated link
            verificationStatus: 'pending' as const,
          };
          await addCampRecord(user.uid, campData as any);
        } else if (item.type === 'achievement') {
          const achData = {
            title: item.title,
            description: item.details,
            date: item.date,
            certificateUrl: url,
            verificationStatus: 'pending' as const,
          };
          await addAchievement(user.uid, achData as any);
        } else if (item.type === 'skill') {
          newSkills.push({
            category: item.category,
            name: item.title,
            level: item.level === 'Beginner' ? 1 : item.level === 'Intermediate' ? 3 : 5,
            verificationStatus: 'pending',
          });
          skillsUpdated = true;
        }
      }

      if (skillsUpdated) {
        await saveCadetSkills(user.uid, newSkills);
      }

      setStep(4); // Success phase
    } catch (err) {
      toast.error('Failed to upload data. Try again.');
      setUploading(false);
    }
  };

  return (
    <AppShell requiredRole={['cadet', 'mod_cadet']}>
      <div style={{ maxWidth: 700, margin: '0 auto', paddingTop: 20 }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, #fef08a, #eab308)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 14px rgba(234, 179, 8, 0.3)' }}>
            <Zap size={28} color="#854d0e" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.5px' }}>Auto-Lodge System</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, marginTop: 8 }}>
            Paste a public Google Drive folder containing your certificates, and our AI will automatically extract and categorize them into your profile.
          </p>
        </div>

        {/* Step 1: Input URL */}
        {step === 1 && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <form onSubmit={handleScan}>
              <div style={{ position: 'relative', marginBottom: 24, maxWidth: 500, margin: '0 auto 24px' }}>
                <div style={{ position: 'absolute', top: 14, left: 16, color: 'var(--text-muted)' }}>
                  <LinkIcon size={20} />
                </div>
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '14px 16px 14px 46px', borderRadius: 12,
                    border: '2px solid var(--border-light)', fontSize: 15,
                    fontFamily: 'Inter, sans-serif', color: 'var(--text-heading)',
                    background: 'var(--bg-secondary)', outline: 'none', transition: 'border 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#eab308'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border-light)'}
                />
              </div>
              <div style={{ background: '#fefce8', color: '#854d0e', padding: '12px 16px', borderRadius: 8, fontSize: 13, marginBottom: 24, display: 'inline-flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                <span>Make sure your Google Drive folder is set to <strong>"Anyone with the link can view"</strong>.</span>
              </div>
              <button type="submit" className="btn-primary" style={{ padding: '14px 32px', fontSize: 15, background: '#eab308', color: '#713f12', display: 'flex', alignItems: 'center', gap: 10, margin: '0 auto', boxShadow: '0 4px 14px rgba(234, 179, 8, 0.3)' }}>
                Scan Drive Folder <ArrowRight size={18} />
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Scanning */}
        {step === 2 && (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <Loader2 size={48} color="#eab308" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Analyzing Documents...</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Using AI Vision to extract details from your certificates. This may take a moment.
            </p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)' }}>Review AI Findings</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>We found {findings.length} certificates. Please confirm to upload them.</p>
              </div>
              <button className="btn-ghost" onClick={() => setStep(1)} style={{ fontSize: 13, color: '#ef4444' }}>
                Cancel
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              {findings.map((item, i) => (
                <div key={i} className="card" style={{ padding: 20, display: 'flex', gap: 16, alignItems: 'center', borderLeft: `4px solid ${item.type === 'camp' ? '#16a34a' : item.type === 'skill' ? '#f59e0b' : '#7c3aed'}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: item.type === 'camp' ? '#16a34a' : item.type === 'skill' ? '#f59e0b' : '#7c3aed', background: item.type === 'camp' ? '#f0fdf4' : item.type === 'skill' ? '#fffbeb' : '#f5f3ff', padding: '2px 8px', borderRadius: 4 }}>
                        {item.type}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.category}</span>
                    </div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)' }}>{item.title}</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{item.details}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{item.date}</div>
                    <div style={{ fontSize: 11, color: '#64748b', background: '#f8fafc', padding: '2px 6px', borderRadius: 4 }}>{item.mockFileName}</div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={handleConfirmAndUpload} 
              disabled={uploading}
              className="btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: 15, background: '#eab308', color: '#713f12', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 4px 14px rgba(234, 179, 8, 0.3)' }}
            >
              {uploading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
              {uploading ? 'Saving to Database...' : 'Confirm & Upload All'}
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <CheckCircle2 size={56} color="#16a34a" style={{ margin: '0 auto 20px' }} />
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginBottom: 8 }}>Successfully Lodged!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32 }}>
              Your {findings.length} certificates have been uploaded and added to your profile. They are now pending verification by a Senior Cadet.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button className="btn-ghost" onClick={() => router.push('/cadet/dashboard')} style={{ padding: '10px 24px', background: 'var(--bg-secondary)' }}>
                Back to Dashboard
              </button>
              <button className="btn-primary" onClick={() => { setStep(1); setUrl(''); setFindings([]); }} style={{ padding: '10px 24px', background: '#eab308', color: '#713f12' }}>
                Scan Another Folder
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
