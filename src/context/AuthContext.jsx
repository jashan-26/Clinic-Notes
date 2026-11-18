import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, INITIAL_DEMO_USERS } from '../supabase/client';

const AuthContext = createContext(null);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_COUNTDOWN_SECONDS = 60; // 60-second warning modal

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(!isSupabaseConfigured);

  // Inactivity timeout warning state
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(WARNING_COUNTDOWN_SECONDS);

  const lastActivityRef = useRef(Date.now());
  const inactivityCheckTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Load initial session
  useEffect(() => {
    async function initSession() {
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchProfile(initialSession.user.id);
          }
        } catch (err) {
          console.warn('Supabase session load error:', err);
        }

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            setSession(newSession);
            setUser(newSession?.user || null);
            if (newSession?.user) {
              await fetchProfile(newSession.user.id);
            } else {
              setProfile(null);
            }
          }
        );

        setLoading(false);
        return () => subscription.unsubscribe();
      } else {
        // Demo mode initialization from local storage
        setIsDemoMode(true);
        const storedDemoSession = localStorage.getItem('clinicnotes_demo_active_user');
        if (storedDemoSession) {
          try {
            const parsed = JSON.parse(storedDemoSession);
            setUser(parsed);
            setProfile(parsed);
          } catch (e) {}
        } else {
          // Default demo logged-in doctor
          const defaultDoc = INITIAL_DEMO_USERS.find((u) => u.email === 'doctor@clinicnotes.hospital');
          if (defaultDoc) {
            setUser(defaultDoc);
            setProfile(defaultDoc);
            localStorage.setItem('clinicnotes_demo_active_user', JSON.stringify(defaultDoc));
          }
        }
        setLoading(false);
      }
    }

    initSession();
  }, []);

  // Auto-create profile row if user exists in auth.users but has no profiles record
  const autoCreateMissingProfile = async (authUser) => {
    if (!isSupabaseConfigured || !supabase || !authUser) return null;
    const meta = authUser.user_metadata || {};
    const fallbackProfile = {
      id: authUser.id,
      email: authUser.email,
      full_name: meta.full_name || (authUser.email ? authUser.email.split('@')[0] : 'Clinician'),
      role: meta.role || (authUser.email?.includes('admin') ? 'admin' : 'doctor'),
      status: meta.status || (authUser.email?.includes('admin') ? 'approved' : 'pending'),
      medical_registration_no: meta.medical_registration_no || 'REG-PENDING',
      specialization: meta.specialization || 'General Medicine',
      department: meta.department || 'Internal Medicine',
      state: meta.state || 'Delhi',
      branch: meta.branch || 'Main Campus',
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString(),
    };
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(fallbackProfile)
        .select()
        .single();
      if (!error && data) {
        setProfile(data);
        return data;
      }
    } catch (e) {
      console.warn('Could not auto-create missing profile:', e);
    }
    setProfile(fallbackProfile);
    return fallbackProfile;
  };

  // Fetch user profile from Supabase
  const fetchProfile = async (userId, authUser = null) => {
    if (!isSupabaseConfigured || !supabase || !userId) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Error fetching profile from Supabase:', error);
      }

      if (data) {
        setProfile(data);
        return data;
      }

      // Edge case: Auth user exists but profile row is missing
      if (authUser || user) {
        return await autoCreateMissingProfile(authUser || user);
      }
      return null;
    } catch (err) {
      console.warn('Error fetching profile from Supabase:', err);
      return null;
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (targetEmail) => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: targetEmail.trim().toLowerCase(),
      });
      if (error) throw error;
      return data;
    }
    return { success: true };
  };

  // Sign In
  const signIn = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const requireEmailConfirm = import.meta.env.VITE_REQUIRE_EMAIL_CONFIRMATION !== 'false';

    if (isSupabaseConfigured && supabase) {
      let { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      // Handle unconfirmed email with dev auto-confirm fallback if VITE_REQUIRE_EMAIL_CONFIRMATION=false
      if (error && error.message?.toLowerCase().includes('email not confirmed')) {
        if (!requireEmailConfirm) {
          try {
            const devRes = await fetch('http://localhost:5000/api/auth/dev-auto-confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: cleanEmail }),
            });
            if (devRes.ok) {
              const retry = await supabase.auth.signInWithPassword({
                email: cleanEmail,
                password,
              });
              if (!retry.error) {
                data = retry.data;
                error = null;
              }
            }
          } catch (devErr) {
            console.warn('Dev auto-confirm failed:', devErr);
          }
        }

        if (error) {
          const unconfirmedErr = new Error('EMAIL_NOT_CONFIRMED');
          unconfirmedErr.code = 'EMAIL_NOT_CONFIRMED';
          unconfirmedErr.originalMessage = error.message;
          throw unconfirmedErr;
        }
      }

      if (error) {
        const msg = error.message?.toLowerCase() || '';
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
          const credErr = new Error('INVALID_CREDENTIALS');
          credErr.code = 'INVALID_CREDENTIALS';
          throw credErr;
        }
        throw error;
      }

      // Update last_login_at
      if (data?.user) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id);

        await supabase.from('login_events').insert({
          user_id: data.user.id,
          event: 'login',
          user_agent: navigator.userAgent,
        });

        const userProfile = await fetchProfile(data.user.id, data.user);
        setUser(data.user);
        setSession(data.session);
        setProfile(userProfile);
        return { user: data.user, session: data.session, profile: userProfile };
      }
      return data;
    } else {
      // Demo Mode login
      const allProfiles = JSON.parse(
        localStorage.getItem('clinicnotes_demo_profiles') || JSON.stringify(INITIAL_DEMO_USERS)
      );

      const matched = allProfiles.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (!matched) {
        throw new Error('Invalid email or password.');
      }

      if (matched.password && matched.password !== password) {
        throw new Error('Incorrect password.');
      }

      const updated = {
        ...matched,
        last_login_at: new Date().toISOString(),
      };

      setUser(updated);
      setProfile(updated);
      localStorage.setItem('clinicnotes_demo_active_user', JSON.stringify(updated));
      return { user: updated, profile: updated };
    }
  };

  // Sign Up (Doctor)
  const signUp = async (formData) => {
    const {
      email,
      password,
      full_name,
      medical_registration_no,
      specialization,
      department,
      hospital_id,
      branch,
      state,
    } = formData;

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name,
            role: 'doctor',
            medical_registration_no,
            specialization,
            department,
            hospital_id,
            branch,
            state,
            status: 'pending',
          },
        },
      });

      if (error) throw error;
      return data;
    } else {
      // Demo Mode signup
      const allProfiles = JSON.parse(
        localStorage.getItem('clinicnotes_demo_profiles') || JSON.stringify(INITIAL_DEMO_USERS)
      );

      if (allProfiles.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
        throw new Error('An account with this email already exists.');
      }

      const newDoctor = {
        id: 'user-doc-' + Date.now(),
        email,
        password,
        full_name,
        role: 'doctor',
        medical_registration_no,
        specialization,
        department,
        hospital_id,
        branch,
        state,
        status: 'pending',
        created_at: new Date().toISOString(),
      };

      allProfiles.push(newDoctor);
      localStorage.setItem('clinicnotes_demo_profiles', JSON.stringify(allProfiles));
      setUser(newDoctor);
      setProfile(newDoctor);
      localStorage.setItem('clinicnotes_demo_active_user', JSON.stringify(newDoctor));
      return { user: newDoctor, profile: newDoctor };
    }
  };

  // Sign Out
  const signOut = async () => {
    if (isSupabaseConfigured && supabase) {
      if (user) {
        await supabase.from('login_events').insert({
          user_id: user.id,
          event: 'logout',
          user_agent: navigator.userAgent,
        });
      }
      await supabase.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem('clinicnotes_demo_active_user');
    setShowInactivityWarning(false);
  };

  // Update Profile
  const updateProfile = async (updates) => {
    if (isSupabaseConfigured && supabase && user) {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      await fetchProfile(user.id);
    } else if (profile) {
      // Demo mode update
      const allProfiles = JSON.parse(
        localStorage.getItem('clinicnotes_demo_profiles') || '[]'
      );
      const updatedProfiles = allProfiles.map((p) =>
        p.id === profile.id ? { ...p, ...updates } : p
      );
      localStorage.setItem('clinicnotes_demo_profiles', JSON.stringify(updatedProfiles));
      const updated = { ...profile, ...updates };
      setProfile(updated);
      setUser(updated);
      localStorage.setItem('clinicnotes_demo_active_user', JSON.stringify(updated));
    }
  };

  // Change Password
  const changePassword = async (newPassword) => {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    } else if (profile) {
      const allProfiles = JSON.parse(
        localStorage.getItem('clinicnotes_demo_profiles') || '[]'
      );
      const updatedProfiles = allProfiles.map((p) =>
        p.id === profile.id ? { ...p, password: newPassword } : p
      );
      localStorage.setItem('clinicnotes_demo_profiles', JSON.stringify(updatedProfiles));
    }
  };

  // Inactivity Detection & Auto-Logout Logic
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now();
      if (showInactivityWarning) {
        setShowInactivityWarning(false);
      }
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('mousedown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);

    inactivityCheckTimerRef.current = setInterval(() => {
      if (!user) return;
      const inactiveMs = Date.now() - lastActivityRef.current;
      const warningThreshold = INACTIVITY_TIMEOUT_MS - WARNING_COUNTDOWN_SECONDS * 1000;

      if (inactiveMs >= INACTIVITY_TIMEOUT_MS) {
        // Exceeded 30 minutes: auto-logout
        signOut();
      } else if (inactiveMs >= warningThreshold) {
        const remaining = Math.max(
          1,
          Math.ceil((INACTIVITY_TIMEOUT_MS - inactiveMs) / 1000)
        );
        setShowInactivityWarning(true);
        setCountdownSeconds(remaining);
      } else {
        setShowInactivityWarning(false);
      }
    }, 2000);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('mousedown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      if (inactivityCheckTimerRef.current) clearInterval(inactivityCheckTimerRef.current);
    };
  }, [user, showInactivityWarning]);

  const keepSessionAlive = () => {
    lastActivityRef.current = Date.now();
    setShowInactivityWarning(false);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    isDemoMode,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword,
    fetchProfile,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}

      {/* Inactivity Auto-Logout Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-amber-300 max-w-sm w-full p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center font-bold text-xl border border-amber-200">
              {countdownSeconds}
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">Session Inactivity Warning</h3>
              <p className="text-xs text-slate-600">
                You have been inactive for nearly 30 minutes. To protect patient data, you will be automatically logged out in <strong>{countdownSeconds}s</strong>.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={signOut}
                className="flex-1 py-2 px-3 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors"
              >
                Log Out Now
              </button>
              <button
                onClick={keepSessionAlive}
                className="flex-1 py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white font-medium text-xs rounded-lg shadow-xs transition-colors"
              >
                Keep Me Signed In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
