'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithGoogle, signInWithEmail, sendPasswordReset, getUserProfile } from '@/lib/auth';
import toast from 'react-hot-toast';
import { Shield, CheckCircle, Eye, EyeOff, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const router = useRouter();

  const redirectByRole = async (uid: string) => {
    const profile = await getUserProfile(uid);
    if (profile?.role === 'ano' || profile?.role === 'admin') {
      router.push('/ano/dashboard');
    } else {
      router.push('/cadet/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithGoogle();
      toast.success('Welcome to NCC Portal!');
      await redirectByRole(user.uid);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Google login failed.');
    } finally {
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

  const features = [
    'Track your skills and certifications',
    'Manage camp history automatically',
    'Upload achievements with one click',
    'Get recommended for camps intelligently',
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8f9fc' }}>
      {/* ── Left Panel ── */}
      <div style={{
        width: '44%',
        background: 'linear-gradient(160deg, #1e3a5f 0%, #0f2744 60%, #1e3a5f 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 48, position: 'relative' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg, #c8960c, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(200,150,12,0.4)' }}>
            <Shield size={26} color="white" />
          </div>
          <div>
            <h1 style={{ color: 'white', fontWeight: 800, fontSize: 20 }}>NCC Portal</h1>
            <p style={{ color: '#93c5fd', fontSize: 12, marginTop: 2 }}>National Cadet Corps</p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <h2 style={{ color: 'white', fontWeight: 800, fontSize: 36, lineHeight: 1.2, marginBottom: 16, letterSpacing: '-0.5px' }}>
            One portal for<br /><span style={{ color: '#f59e0b' }}>every cadet.</span>
          </h2>
          <p style={{ color: '#93c5fd', fontSize: 15, lineHeight: 1.6, marginBottom: 40 }}>
            The complete digital management system for NCC cadets and officers.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {features.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={17} color="#f59e0b" />
                <span style={{ color: '#bfdbfe', fontSize: 14 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative circles */}
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(37,99,235,0.15)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 40, width: 100, height: 100, borderRadius: '50%', background: 'rgba(245,158,11,0.1)' }} />
      </div>

      {/* ── Right Panel ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.3px' }}>
              {forgotMode ? 'Reset Password' : 'Sign in'}
            </h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              {forgotMode
                ? 'Enter your email to receive a reset link.'
                : 'Access your NCC Portal account.'}
            </p>
          </div>

          {/* ── Auth mode tabs ── */}
          {!forgotMode && (
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: 10, padding: 4, marginBottom: 24 }}>
              {(['google', 'email'] as const).map((mode) => (
                <button key={mode} onClick={() => setAuthMode(mode)}
                  style={{
                    flex: 1, padding: '9px', borderRadius: 7, border: 'none', cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 600,
                    background: authMode === mode ? 'white' : 'transparent',
                    color: authMode === mode ? '#1e3a5f' : '#64748b',
                    boxShadow: authMode === mode ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s',
                  }}>
                  {mode === 'google' ? '🔵 Google' : '✉️ Email & Password'}
                </button>
              ))}
            </div>
          )}

          {/* ── Google Sign In ── */}
          {authMode === 'google' && !forgotMode && (
            <div>
              <button onClick={handleGoogleLogin} disabled={loading}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 12, padding: '14px 24px', background: loading ? '#f1f5f9' : 'white',
                  border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: 15, fontWeight: 600,
                  color: '#0f172a', cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', fontFamily: 'Inter, sans-serif',
                }}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {loading ? (
                  <div style={{ width: 20, height: 20, border: '2px solid #e2e8f0', borderTop: '2px solid #1e3a5f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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

              <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px', marginTop: 20 }}>
                <p style={{ color: '#0369a1', fontSize: 13, lineHeight: 1.6 }}>
                  <strong>Tip:</strong> Use your college Google account for automatic verification.
                </p>
              </div>
            </div>
          )}

          {/* ── Email Sign In ── */}
          {authMode === 'email' && !forgotMode && (
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    required
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <button type="button" onClick={() => setForgotMode(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#2563eb', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    style={{ paddingLeft: 36, paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 4 }}>
                {loading ? (
                  <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Signing in...</>
                ) : 'Sign In'}
              </button>
            </form>
          )}

          {/* ── Forgot Password ── */}
          {forgotMode && (
            <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@college.edu"
                    required
                    style={{ paddingLeft: 36 }}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
              <button type="button" onClick={() => setForgotMode(false)}
                style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 14, fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}>
                ← Back to sign in
              </button>
            </form>
          )}

          {/* ── Register Link ── */}
          {!forgotMode && (
            <div style={{ textAlign: 'center', marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
              <p style={{ color: '#64748b', fontSize: 14 }}>
                New to NCC Portal?{' '}
                <Link href="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                  Create an account →
                </Link>
              </p>
            </div>
          )}

          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
            National Cadet Corps — Digital Management System
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
