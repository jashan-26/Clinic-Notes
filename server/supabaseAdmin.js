import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

export const supabaseAdmin = isServerSupabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

/**
 * Authentication & Status Verification Middleware
 * Validates Supabase JWT and verifies profile status is 'approved'
 */
export async function verifyApprovedClinician(req, res, next) {
  // If in demo mode without Supabase server credentials, allow transparent fallback
  if (!isServerSupabaseConfigured) {
    req.user = { id: 'demo-doctor-id', role: 'doctor', status: 'approved' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization header.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }

    const { data: profile, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profError || !profile) {
      return res.status(403).json({ error: 'Forbidden: Profile not found.' });
    }

    if (profile.role !== 'doctor') {
      return res.status(403).json({
        error: 'Forbidden: Patient documentation is restricted to clinical doctor accounts only. Administrator accounts have governance oversight only.',
      });
    }

    if (profile.status !== 'approved') {
      return res.status(403).json({
        error: `Forbidden: Clinician account is currently '${profile.status}'. Only approved accounts can utilize AI documentation.`,
      });
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    console.error('Auth verification error:', err);
    return res.status(500).json({ error: 'Internal auth verification error.' });
  }
}

/**
 * Admin Role Verification Middleware
 */
export async function verifyAdminRole(req, res, next) {
  if (!isServerSupabaseConfigured) {
    req.user = { id: 'demo-admin-id', role: 'admin', status: 'approved' };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Admin authentication token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }

    const { data: profile, error: profError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profError || !profile || profile.role !== 'admin' || profile.status !== 'approved') {
      return res.status(403).json({ error: 'Access denied: Requires active Administrator privileges.' });
    }

    req.user = user;
    req.profile = profile;
    next();
  } catch (err) {
    console.error('Admin auth error:', err);
    return res.status(500).json({ error: 'Internal admin verification error.' });
  }
}
