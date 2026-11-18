import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SplashIntro } from '../components/Common/SplashIntro';
import {
  Activity,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Send,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../supabase/client';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'EMAIL_NOT_CONFIRMED' | 'INVALID_CREDENTIALS' | 'STATUS_PENDING' | 'STATUS_BLOCKED' | 'GENERIC'
  const [profileNotice, setProfileNotice] = useState(null);
  const [resendStatus, setResendStatus] = useState(null); // null | 'sending' | 'sent' | 'error'
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Splash Screen State: show once per session
  const [showSplash, setShowSplash] = useState(() => {
    if (typeof window === 'undefined') return false;
    const alreadyShown = sessionStorage.getItem('clinicnotes_splash_shown');
    return !alreadyShown;
  });

  const { signIn, resendVerificationEmail, user, profile } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, skip splash and redirect based on role
  useEffect(() => {
    if (user && profile) {
      setShowSplash(false);
      if (profile.role === 'admin') {
        navigate('/admin', { replace: true });
      } else if (profile.status === 'approved') {
        navigate('/', { replace: true });
      } else if (profile.status === 'pending') {
        navigate('/pending', { replace: true });
      } else {
        navigate('/status', { replace: true });
      }
    }
  }, [user, profile, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setErrorType(null);
    setProfileNotice(null);
    setResendStatus(null);
    setLoading(true);

    try {
      const res = await signIn({ email, password });
      const currentProfile = res?.profile;

      // Role-based routing right after login
      if (currentProfile?.role === 'admin') {
        navigate('/admin');
      } else if (currentProfile?.status === 'pending') {
        navigate('/pending');
      } else if (currentProfile?.status === 'suspended' || currentProfile?.status === 'rejected') {
        navigate('/status');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.warn('Sign-in failed:', err);
      const code = err.code || '';
      const msg = (err.message || '').toLowerCase();

      if (code === 'EMAIL_NOT_CONFIRMED' || msg.includes('email not confirmed')) {
        setErrorType('EMAIL_NOT_CONFIRMED');
        setError('Please verify your email address before signing in.');

        // Check if the user is already approved in profiles
        if (isSupabaseConfigured && supabase) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('status, role, full_name')
              .eq('email', email.trim().toLowerCase())
              .maybeSingle();

            if (data?.status === 'approved') {
              setProfileNotice(
                'Your doctor account is approved by the hospital administrator, but your Supabase email verification is still unconfirmed. Click the button below to resend the verification link, or ask the admin to auto-confirm.'
              );
            }
          } catch (e) {
            // Ignore lookup error
          }
        }
      } else if (code === 'INVALID_CREDENTIALS' || msg.includes('invalid') || msg.includes('incorrect')) {
        setErrorType('INVALID_CREDENTIALS');
        setError('Incorrect email or password.');
      } else {
        setErrorType('GENERIC');
        setError(err.message || 'Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address above to resend the verification link.');
      return;
    }
    setResendStatus('sending');
    try {
      await resendVerificationEmail(email);
      setResendStatus('sent');
    } catch (err) {
      console.error('Failed to resend confirmation:', err);
      setResendStatus('error');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) return;
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.resetPasswordForEmail(forgotEmail.trim().toLowerCase(), {
          redirectTo: 'http://localhost:5173/login',
        });
      } catch (err) {
        console.warn('Password reset request error:', err);
      }
    }
    setForgotSent(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSent(false);
    }, 2500);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* FIX 4: Opening Splash Animation */}
      {showSplash && <SplashIntro onFinish={() => setShowSplash(false)} />}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Hospital Brand Logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-700 text-white shadow-sm mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to ClinicNotes</h2>
        <p className="mt-1 text-xs text-slate-500">
          Hospital Documentation & Outpatient Telemedicine Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10 space-y-5">
          {/* Friendly, Accurate Error Banners */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>

              {profileNotice && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] leading-relaxed">
                  {profileNotice}
                </div>
              )}

              {/* Working Resend Verification Link Button */}
              {errorType === 'EMAIL_NOT_CONFIRMED' && (
                <div className="pt-1 border-t border-red-200/60 flex items-center justify-between">
                  <span className="text-[11px] text-red-600">Need a new link?</span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendStatus === 'sending'}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-300 text-red-700 hover:bg-red-50 rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
                  >
                    {resendStatus === 'sending' ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>
                      {resendStatus === 'sending'
                        ? 'Sending...'
                        : resendStatus === 'sent'
                        ? 'Link Sent!'
                        : 'Resend verification link'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {resendStatus === 'sent' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Verification email sent. Please check your inbox and spam folder.</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700">Email Address</label>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@hospital.org"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-teal-700 hover:text-teal-900 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="mt-1 relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2.5 px-4 rounded-lg text-xs font-semibold text-white shadow-xs transition-colors ${
                loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-teal-700 hover:bg-teal-800'
              }`}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>
          </form>

          {/* Minimal clean footer: Doctor Registration link */}
          <div className="text-center pt-2 text-xs text-slate-600 border-t border-slate-100">
            New doctor to the network?{' '}
            <Link to="/signup" className="font-semibold text-teal-700 hover:underline">
              Register doctor account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Reset Account Password</h3>
            <p className="text-xs text-slate-600">
              Enter your registered clinical email to receive a password reset link.
            </p>
            {forgotSent ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 font-medium">
                Password reset link dispatched to your inbox.
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="doctor@hospital.org"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
