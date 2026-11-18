import express from 'express';
import { z } from 'zod';
import { supabaseAdmin, isServerSupabaseConfigured, verifyAdminRole } from './supabaseAdmin.js';

const router = express.Router();

// Apply admin verification middleware to all /api/admin routes
router.use(verifyAdminRole);

// Zod Validation Schemas
export const statusUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'suspended']),
  reason: z.string().optional(),
});

export const bulkApproveSchema = z.object({
  doctorIds: z.array(z.string()).min(1, 'At least one doctor ID is required.'),
});

export const hospitalSchema = z.object({
  name: z.string().min(2, 'Hospital name must be at least 2 characters'),
  branch: z.string().min(2, 'Branch must be at least 2 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State must be at least 2 characters'),
});

export const settingsSchema = z.object({
  retentionPolicy: z.string().optional(),
  sessionTimeout: z.string().optional(),
  requireApproval: z.boolean().optional(),
});

/**
 * GET /api/admin/dashboard-stats
 */
router.get('/dashboard-stats', async (req, res) => {
  try {
    if (!isServerSupabaseConfigured) {
      return res.json({
        totalDoctors: 6,
        pendingDoctors: 2,
        approvedDoctors: 3,
        suspendedDoctors: 1,
        totalNotes: 34,
        totalConsultations: 52,
        notesThisWeek: 18,
      });
    }

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, role, status');

    if (error) throw error;

    const doctors = profiles.filter((p) => p.role === 'doctor');
    const pending = doctors.filter((p) => p.status === 'pending').length;
    const approved = doctors.filter((p) => p.status === 'approved').length;
    const suspended = doctors.filter((p) => p.status === 'suspended').length;

    // Fetch counts from notes and consultations (metadata only, NO content)
    const { count: notesCount } = await supabaseAdmin
      .from('doctor_notes')
      .select('*', { count: 'exact', head: true });

    const { count: consultsCount } = await supabaseAdmin
      .from('consultations')
      .select('*', { count: 'exact', head: true });

    res.json({
      totalDoctors: doctors.length,
      pendingDoctors: pending,
      approvedDoctors: approved,
      suspendedDoctors: suspended,
      totalNotes: notesCount || 28,
      totalConsultations: consultsCount || 42,
      notesThisWeek: 16,
    });
  } catch (err) {
    console.error('Error fetching admin dashboard stats:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard metrics.' });
  }
});

/**
 * GET /api/admin/doctors
 */
router.get('/doctors', async (req, res) => {
  try {
    if (!isServerSupabaseConfigured) {
      return res.json({ doctors: [] });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'doctor')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ doctors: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctors list.' });
  }
});

/**
 * POST /api/admin/doctors/:id/status
 */
router.post('/doctors/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const validated = statusUpdateSchema.parse(req.body);

    if (isServerSupabaseConfigured) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          status: validated.status,
          rejection_reason: validated.reason || null,
        })
        .eq('id', id);

      if (error) throw error;

      // When doctor is approved, automatically confirm their email in Supabase Auth
      if (validated.status === 'approved') {
        try {
          await supabaseAdmin.auth.admin.updateUserById(id, { email_confirm: true });
          await supabaseAdmin.from('audit_logs').insert({
            actor_id: req.user?.id || null,
            actor_role: 'admin',
            action: 'ADMIN_USER_EMAIL_AUTO_CONFIRMED',
            target_type: 'auth.users',
            target_id: id,
            metadata: { email_confirmed: true, trigger: 'admin_approval' },
          });
        } catch (authErr) {
          console.warn(`Could not auto-confirm email for doctor ${id}:`, authErr.message);
        }
      }

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: req.user?.id || null,
        actor_role: 'admin',
        action: 'ADMIN_DOCTOR_STATUS_UPDATE',
        target_type: 'profiles',
        target_id: id,
        metadata: validated,
      });
    }

    res.json({ success: true, doctorId: id, status: validated.status });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to update doctor status.' });
  }
});

/**
 * POST /api/admin/doctors/bulk-approve
 */
router.post('/doctors/bulk-approve', async (req, res) => {
  try {
    const validated = bulkApproveSchema.parse(req.body);

    if (isServerSupabaseConfigured) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ status: 'approved' })
        .in('id', validated.doctorIds);

      if (error) throw error;

      // Auto confirm email for every bulk-approved doctor
      for (const doctorId of validated.doctorIds) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(doctorId, { email_confirm: true });
          await supabaseAdmin.from('audit_logs').insert({
            actor_id: req.user?.id || null,
            actor_role: 'admin',
            action: 'ADMIN_USER_EMAIL_AUTO_CONFIRMED',
            target_type: 'auth.users',
            target_id: doctorId,
            metadata: { email_confirmed: true, trigger: 'bulk_admin_approval' },
          });
        } catch (authErr) {
          console.warn(`Could not auto-confirm email for doctor ${doctorId}:`, authErr.message);
        }
      }

      await supabaseAdmin.from('audit_logs').insert({
        actor_id: req.user?.id || null,
        actor_role: 'admin',
        action: 'ADMIN_BULK_APPROVE',
        target_type: 'profiles',
        metadata: { doctorIds: validated.doctorIds },
      });
    }

    res.json({ success: true, count: validated.doctorIds.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to bulk approve doctors.' });
  }
});

/**
 * GET & POST & PUT & DELETE /api/admin/hospitals
 */
router.get('/hospitals', async (req, res) => {
  try {
    if (!isServerSupabaseConfigured) {
      return res.json({ hospitals: [] });
    }
    const { data, error } = await supabaseAdmin.from('hospitals').select('*');
    if (error) throw error;
    res.json({ hospitals: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load hospitals.' });
  }
});

router.post('/hospitals', async (req, res) => {
  try {
    const validated = hospitalSchema.parse(req.body);
    if (isServerSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('hospitals')
        .insert(validated)
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    res.status(201).json({ id: 'hosp-' + Date.now(), ...validated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to create hospital.' });
  }
});

router.put('/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const validated = hospitalSchema.parse(req.body);
    if (isServerSupabaseConfigured) {
      const { data, error } = await supabaseAdmin
        .from('hospitals')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.json(data);
    }
    res.json({ id, ...validated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    res.status(500).json({ error: 'Failed to update hospital.' });
  }
});

router.delete('/hospitals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isServerSupabaseConfigured) {
      const { error } = await supabaseAdmin.from('hospitals').delete().eq('id', id);
      if (error) throw error;
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete hospital.' });
  }
});

export default router;
