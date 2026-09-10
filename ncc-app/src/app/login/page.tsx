'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithGoogle, signInWithEmail, sendPasswordReset, getUserProfile } from '@/lib/auth';
import { saveCadetProfile } from '@/lib/db';
import { RANKS_BY_WING, RANK_LABELS, getRoleFromRank } from '@/types';
import type { Wing } from '@/types';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const NCC_LOGO = 'https://res.cloudinary.com/dxxvewmf5/image/upload/v1786034608/ncclogo_eitfib.webp';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [googleOnboardingUser, setGoogleOnboardingUser] = useState<any>(null);
  const [onboardForm, setOnboardForm] = useState({
    rollNumber: '', college: '', phone: '', branch: 'Army' as Wing, nccRank: 'CDT', semester: 1
  });
  const router = useRouter();

  // Ranks available for selected wing in onboarding
  const onboardRanks = useMemo(() => {
    const { mod, cadet } = RANKS_BY_WING[onboardForm.branch];
    return [...mod, ...cadet];
  }, [onboardForm.branch]);

  const onboardIsModRank = useMemo(() => {
    return getRoleFromRank(onboardForm.branch, onboardForm.nccRank) === 'mod_cadet';
  }, [onboardForm.branch, onboardForm.nccRank]);

  const redirectByRole = async (uid: string) => {
    const profile = await getUserProfile(uid);
    if (profile?.role === 'admin') {
      router.push('/admin/dashboard');
    } else if (profile?.role === 'ano') {
      router.push('/ano/dashboard');
    } else if (profile?.role === 'mod_cadet') {
      router.push('/mod-cadet/dashboard');
    } else {
      router.push('/cadet/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user, isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        setGoogleOnboardingUser(user);
        toast.success('Account created! Please complete your details.');
      } else {
        toast.success('Welcome back!');
        await redirectByRole(user.uid);
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardForm.rollNumber || !onboardForm.college || !onboardForm.phone) {
      toast.error('Please fill required fields.');
      return;
    }
    setLoading(true);
    try {
      const role = getRoleFromRank(onboardForm.branch, onboardForm.nccRank);
      // Update user doc with correct role, branch, nccRank
      const { updateDoc, doc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      await updateDoc(doc(db, 'users', googleOnboardingUser.uid), {
        role,
        branch: onboardForm.branch,
        nccRank: onboardForm.nccRank,
      });
      await saveCadetProfile(googleOnboardingUser.uid, {
        rollNumber: onboardForm.rollNumber,
        college: onboardForm.college,
        phone: onboardForm.phone,
        branch: onboardForm.branch,
        nccRank: onboardForm.nccRank,
        semester: onboardForm.semester,
        profileComplete: false,
      });
      toast.success('Account setup complete!');
      if (role === 'mod_cadet') {
        router.push('/mod-cadet/dashboard');
      } else {
        router.push('/cadet/dashboard');
      }
    } catch (err: unknown) {
      toast.error('Failed to save details.');
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password.'); return; }
    setLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      toast.success('Signed in successfully!');
      await redirectByRole(user.uid);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        toast.error('Incorrect email or password.');
      } else if (msg.includes('too-many-requests')) {
        toast.error('Too many attempts. Try again later.');
      } else {
        toast.error('Login failed. Check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email address first.'); return; }
    setLoading(true);
    try {
      await sendPasswordReset(email);
      toast.success('Password reset email sent! Check your inbox.');
      setForgotMode(false);
    } catch {
      toast.error('Could not send reset email. Check the address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f5f7fa' }}>
      
      {/* ── Left Panel — NCC Brand ── */}
      <div style={{
        width: '46%',
        background: 'linear-gradient(160deg, #0a1628 0%, #0f2135 50%, #1a2f4a 100%)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        padding: '48px 56px',
      }}>
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.04) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />

        {/* Tricolor accent bar at top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4,
          background: 'linear-gradient(90deg, #FF9933 33.33%, #ffffff 33.33% 66.66%, #138808 66.66%)'
        }} />

        {/* Decorative circles */}
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: 'rgba(46,100,159,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 40, right: 60, width: 120, height: 120, borderRadius: '50%', background: 'rgba(200,150,12,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 80, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 60, position: 'relative' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, rgba(200,150,12,0.2), rgba(200,150,12,0.05))',
            border: '1px solid rgba(200,150,12,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}>
            <img src={NCC_LOGO} alt="NCC" style={{ width: 46, height: 46, objectFit: 'contain' }} />
          </div>
          <div>
            <h1 style={{
              color: 'white', fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, fontSize: 22, letterSpacing: '1px', lineHeight: 1
            }}>NCC TCET</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 3 }}>
              National Cadet Corps
            </p>
          </div>
        </div>

        {/* Main content */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{
            display: 'inline-block', background: 'rgba(200,150,12,0.15)',
            border: '1px solid rgba(200,150,12,0.3)', borderRadius: 20,
            padding: '4px 14px', marginBottom: 24
          }}>
            <span style={{ color: '#f0c84a', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              ◆ EKTA AUR ANUSHASAN
            </span>
          </div>

          <h2 style={{
            color: 'white', fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700, fontSize: 42, lineHeight: 1.1,
            marginBottom: 16, letterSpacing: '-0.5px'
          }}>
            The Digital<br />
            <span style={{ color: '#f0c84a' }}>Command Centre</span><br />
            for NCC
          </h2>

          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, lineHeight: 1.7, marginBottom: 40, maxWidth: 360 }}>
            A unified digital platform for managing NCC cadets, tracking skills, running evaluations, and recommending cadets for camps.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '🎯', text: 'Skill tracking with 5-level proficiency ratings' },
              { icon: '🏕️', text: 'Intelligent camp recommendation system' },
              { icon: '📊', text: 'Semester evaluations and performance analytics' },
              { icon: '🏆', text: 'Achievement & certification management' },
            ].map((f) => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13.5 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', marginTop: 48 }}>
          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: '0.05em' }}>
            MINISTRY OF DEFENCE, GOVERNMENT OF INDIA
          </p>
        </div>
      </div>

      {/* ── Right Panel — Auth Form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 48px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            {googleOnboardingUser ? (
              <>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 20, padding: '4px 14px', marginBottom: 12
                }}>
                  <span style={{ fontSize: 12, color: '#15803d', fontWeight: 600 }}>✓ Google account verified</span>
                </div>
                <h2 style={{
                  fontSize: 26, fontWeight: 800, color: 'var(--text-heading)',
                  letterSpacing: '-0.3px', marginBottom: 6
                }}>Complete Your Profile</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  We need a few more details to set up your cadet account.
                </p>
              </>
            ) : (
              <>
                <h2 style={{
                  fontSize: 28, fontWeight: 800, color: 'var(--text-heading)',
                  letterSpacing: '-0.4px', marginBottom: 6,
                  fontFamily: "'Rajdhani', sans-serif"
                }}>
                  {forgotMode ? 'Reset Password' : 'Sign In'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                  {forgotMode
                    ? 'Enter your email to receive a reset link.'
                    : 'Access your NCC TCET account.'}
                </p>
              </>
            )}
          </div>

          {/* ── Auth Mode Tabs ── */}
          {!forgotMode && !googleOnboardingUser && (
            <div style={{
              display: 'flex', background: 'var(--bg-secondary)',
              borderRadius: 10, padding: 4, marginBottom: 28,
              border: '1px solid var(--border-light)'
            }}>
              {(['google', 'email'] as const).map((mode) => (
                <button key={mode} onClick={() => setAuthMode(mode)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                    background: authMode === mode ? 'white' : 'transparent',
                    color: authMode === mode ? 'var(--navy-700)' : 'var(--text-muted)',
                    boxShadow: authMode === mode ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.18s ease',
                  }}>
                  {mode === 'google' ? '🔵 Google' : '✉️ Email & Password'}
                </button>
              ))}
            </div>
          )}

          {/* ── Google Sign In ── */}
          {authMode === 'google' && !forgotMode && !googleOnboardingUser && (
            <div>
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 12, padding: '14px 24px',
                  background: loading ? 'var(--bg-secondary)' : 'white',
                  border: '1.5px solid var(--border-mid)', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, color: 'var(--text-heading)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)',
                  fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid var(--border-light)', borderTop: '2px solid var(--navy-600)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                {loading ? 'Signing in...' : 'Continue with Google'}
              </button>

              <div style={{
                background: 'var(--info-bg)', border: '1px solid var(--info-border)',
                borderRadius: 10, padding: '12px 16px', marginTop: 20
              }}>
                <p style={{ color: 'var(--info)', fontSize: 13, lineHeight: 1.6 }}>
                  <strong>Tip:</strong> Use your college Google account for automatic verification.
                </p>
              </div>
            </div>
          )}

          {/* ── Email Sign In ── */}
          {authMode === 'email' && !forgotMode && !googleOnboardingUser && (
            <form onSubmit={handleEmailLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    required
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <button type="button" onClick={() => setForgotMode(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--navy-500)', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    style={{ paddingLeft: 38, paddingRight: 42 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4 }}>
                {loading ? (
                  <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
                ) : (
                  <>Sign In <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          )}

          {/* ── Forgot Password ── */}
          {forgotMode && (
            <form onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    required
                    style={{ paddingLeft: 38 }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setForgotMode(false)}
                style={{ marginTop: 12, width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                ← Back to sign in
              </button>
            </form>
          )}

          {/* ── Google Onboarding Form ── */}
          {googleOnboardingUser && (
            <form onSubmit={handleOnboardingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Wing + Rank */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Wing *</label>
                  <select className="form-select" value={onboardForm.branch} onChange={(e) => {
                    const w = e.target.value as Wing;
                    const { cadet } = RANKS_BY_WING[w];
                    setOnboardForm({ ...onboardForm, branch: w, nccRank: cadet[cadet.length - 1] });
                  }}>
                    {(['Army', 'Navy', 'Air Force'] as Wing[]).map((w) => (
                      <option key={w} value={w}>{w} Wing</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">NCC Rank *</label>
                  <select className="form-select" value={onboardForm.nccRank} onChange={(e) => setOnboardForm({ ...onboardForm, nccRank: e.target.value })}>
                    <optgroup label="Senior Cadet">
                      {RANKS_BY_WING[onboardForm.branch]?.mod.map((r) => <option key={r} value={r}>{RANK_LABELS[r] || r}</option>)}
                    </optgroup>
                    <optgroup label="Cadet">
                      {RANKS_BY_WING[onboardForm.branch]?.cadet.map((r) => <option key={r} value={r}>{RANK_LABELS[r] || r}</option>)}
                    </optgroup>
                  </select>
                </div>
              </div>
              {/* Role preview */}
              <div style={{ padding: '8px 12px', borderRadius: 8, background: onboardIsModRank ? '#fffbeb' : '#f0f9ff', border: `1px solid ${onboardIsModRank ? '#fbbf24' : '#bae6fd'}`, fontSize: 12, color: onboardIsModRank ? '#92400e' : '#0369a1' }}>
                {onboardIsModRank ? '⭐ Senior Cadet (Moderator) — you can verify junior cadet submissions' : '🎗️ Regular Cadet — standard portal access'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Roll Number *</label>
                  <input className="form-input" value={onboardForm.rollNumber} onChange={(e) => setOnboardForm({...onboardForm, rollNumber: e.target.value})} placeholder="e.g. 2024CSE001" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">College *</label>
                  <input className="form-input" value={onboardForm.college} onChange={(e) => setOnboardForm({...onboardForm, college: e.target.value})} placeholder="College Name" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone *</label>
                  <input className="form-input" value={onboardForm.phone} onChange={(e) => setOnboardForm({...onboardForm, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" required />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Branch</label>
                  <select className="form-select" value={onboardForm.branch} onChange={(e) => setOnboardForm({...onboardForm, branch: e.target.value})}>
                    {['Army', 'Navy', 'Air Force'].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-gold" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4 }}>
                {loading ? 'Saving...' : 'Complete & Enter Portal →'}
              </button>
            </form>
          )}

          {/* ── Register Link ── */}
          {!forgotMode && !googleOnboardingUser && (
            <div style={{ textAlign: 'center', marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                New to NCC TCET?{' '}
                <Link href="/register" style={{ color: 'var(--navy-500)', fontWeight: 600, textDecoration: 'none' }}>
                  Create Account →
                </Link>
              </p>
            </div>
          )}

          <p style={{ textAlign: 'center', color: 'var(--text-disabled)', fontSize: 11.5, marginTop: 28, letterSpacing: '0.03em' }}>
            © 2025 NCC TCET — National Cadet Corps, TCET
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          div[style*="width: 46%"] { display: none !important; }
          div[style*="flex: 1"][style*="alignItems: center"] { padding: 32px 24px !important; }
        }
      `}</style>
    </div>
  );
}
