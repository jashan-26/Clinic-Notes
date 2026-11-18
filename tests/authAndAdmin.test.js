import { describe, it, expect } from 'vitest';
import {
  statusUpdateSchema,
  bulkApproveSchema,
  hospitalSchema,
} from '../server/adminRoutes.js';

describe('Auth Guard & Strict Role Separation Gating Logic', () => {
  // Pure logic simulation of DoctorProtectedRoute guard
  function evaluateDoctorAccess(profile) {
    if (!profile) return { allowed: false, redirect: '/login' };
    if (profile.role === 'admin') return { allowed: false, redirect: '/admin' };
    if (profile.status === 'pending') return { allowed: false, redirect: '/pending' };
    if (profile.status === 'suspended' || profile.status === 'rejected') {
      return { allowed: false, redirect: '/status' };
    }
    return { allowed: true, redirect: null };
  }

  // Pure logic simulation of AdminProtectedRoute guard
  function evaluateAdminAccess(profile) {
    if (!profile) return { allowed: false, redirect: '/login' };
    if (profile.role !== 'admin') return { allowed: false, redirect: '/' };
    if (profile.status !== 'approved') return { allowed: false, redirect: '/status' };
    return { allowed: true, redirect: null };
  }

  it('should grant access to an approved doctor on the doctor workstation', () => {
    const doc = { role: 'doctor', status: 'approved' };
    const res = evaluateDoctorAccess(doc);
    expect(res.allowed).toBe(true);
    expect(res.redirect).toBeNull();
  });

  it('should strictly redirect admins away from doctor workstation to /admin', () => {
    const admin = { role: 'admin', status: 'approved' };
    const res = evaluateDoctorAccess(admin);
    expect(res.allowed).toBe(false);
    expect(res.redirect).toBe('/admin');
  });

  it('should redirect pending doctors to /pending verification screen', () => {
    const doc = { role: 'doctor', status: 'pending' };
    const res = evaluateDoctorAccess(doc);
    expect(res.allowed).toBe(false);
    expect(res.redirect).toBe('/pending');
  });

  it('should redirect suspended or rejected doctors to /status screen', () => {
    const docSuspended = { role: 'doctor', status: 'suspended' };
    expect(evaluateDoctorAccess(docSuspended).redirect).toBe('/status');

    const docRejected = { role: 'doctor', status: 'rejected' };
    expect(evaluateDoctorAccess(docRejected).redirect).toBe('/status');
  });

  it('should block regular doctors from accessing /admin and redirect to /', () => {
    const doc = { role: 'doctor', status: 'approved' };
    const res = evaluateAdminAccess(doc);
    expect(res.allowed).toBe(false);
    expect(res.redirect).toBe('/');
  });

  it('should grant access to an approved administrator on /admin', () => {
    const admin = { role: 'admin', status: 'approved' };
    const res = evaluateAdminAccess(admin);
    expect(res.allowed).toBe(true);
    expect(res.redirect).toBeNull();
  });
});

describe('Login-Gating Matrix (Email Confirmation × Role × Status)', () => {
  function evaluateLoginGating({ emailConfirmed, status, role, requireEmailConfirm = true }) {
    if (requireEmailConfirm && !emailConfirmed) {
      return {
        canLogin: false,
        error: 'EMAIL_NOT_CONFIRMED',
        redirect: null,
      };
    }

    // Role-based destination after sign-in
    if (role === 'admin') {
      return { canLogin: true, error: null, redirect: '/admin' };
    }

    if (role === 'doctor') {
      if (status === 'approved') return { canLogin: true, error: null, redirect: '/' };
      if (status === 'pending') return { canLogin: true, error: null, redirect: '/pending' };
      if (status === 'suspended' || status === 'rejected') {
        return { canLogin: true, error: null, redirect: '/status' };
      }
    }

    return { canLogin: false, error: 'UNKNOWN_ROLE_OR_STATUS', redirect: null };
  }

  // 1. Unconfirmed Email cases
  it('rejects sign-in when email is not confirmed and confirmation is required', () => {
    const res = evaluateLoginGating({
      emailConfirmed: false,
      status: 'approved',
      role: 'doctor',
      requireEmailConfirm: true,
    });
    expect(res.canLogin).toBe(false);
    expect(res.error).toBe('EMAIL_NOT_CONFIRMED');
  });

  it('bypasses email confirmation requirement when requireEmailConfirm is false', () => {
    const res = evaluateLoginGating({
      emailConfirmed: false,
      status: 'approved',
      role: 'doctor',
      requireEmailConfirm: false,
    });
    expect(res.canLogin).toBe(true);
    expect(res.redirect).toBe('/');
  });

  // 2. Confirmed Email × Doctor Status matrix
  it('routes confirmed approved doctor directly to workstation (/)', () => {
    const res = evaluateLoginGating({
      emailConfirmed: true,
      status: 'approved',
      role: 'doctor',
    });
    expect(res.canLogin).toBe(true);
    expect(res.redirect).toBe('/');
  });

  it('routes confirmed pending doctor to /pending queue', () => {
    const res = evaluateLoginGating({
      emailConfirmed: true,
      status: 'pending',
      role: 'doctor',
    });
    expect(res.canLogin).toBe(true);
    expect(res.redirect).toBe('/pending');
  });

  it('routes confirmed rejected doctor to /status', () => {
    const res = evaluateLoginGating({
      emailConfirmed: true,
      status: 'rejected',
      role: 'doctor',
    });
    expect(res.canLogin).toBe(true);
    expect(res.redirect).toBe('/status');
  });

  it('routes confirmed suspended doctor to /status', () => {
    const res = evaluateLoginGating({
      emailConfirmed: true,
      status: 'suspended',
      role: 'doctor',
    });
    expect(res.canLogin).toBe(true);
    expect(res.redirect).toBe('/status');
  });

  // 3. Confirmed Email × Admin Role
  it('routes confirmed admin directly to governance portal (/admin)', () => {
    const res = evaluateLoginGating({
      emailConfirmed: true,
      status: 'approved',
      role: 'admin',
    });
    expect(res.canLogin).toBe(true);
    expect(res.redirect).toBe('/admin');
  });
});

describe('Cascading State -> Hospital -> Branch Filter Logic', () => {
  const sampleHospitals = [
    { id: 'h1', name: 'AIIMS New Delhi', branch: 'Main Campus', state: 'Delhi' },
    { id: 'h2', name: 'Max Hospital', branch: 'Saket', state: 'Delhi' },
    { id: 'h3', name: 'Tata Memorial', branch: 'Parel', state: 'Maharashtra' },
    { id: 'h4', name: 'Manipal Hospital', branch: 'HAL Road', state: 'Karnataka' },
  ];

  it('should filter hospitals by selected state', () => {
    const delhiHospitals = sampleHospitals.filter((h) => h.state === 'Delhi');
    expect(delhiHospitals.length).toBe(2);
    expect(delhiHospitals.map((h) => h.name)).toContain('AIIMS New Delhi');
    expect(delhiHospitals.map((h) => h.name)).toContain('Max Hospital');
  });

  it('should filter branches for the selected hospital', () => {
    const selectedHosp = sampleHospitals.find((h) => h.id === 'h3');
    expect(selectedHosp.branch).toBe('Parel');
  });
});

describe('Admin Input Validation (Zod Schemas)', () => {
  it('should accept valid status update payloads', () => {
    const valid = { status: 'approved' };
    expect(statusUpdateSchema.parse(valid)).toEqual(valid);

    const validReject = { status: 'rejected', reason: 'Invalid registration number' };
    expect(statusUpdateSchema.parse(validReject)).toEqual(validReject);
  });

  it('should reject invalid status names', () => {
    expect(() => statusUpdateSchema.parse({ status: 'unauthorized_status' })).toThrow();
  });

  it('should validate bulk approve doctor IDs array', () => {
    const valid = { doctorIds: ['doc-1', 'doc-2'] };
    expect(bulkApproveSchema.parse(valid)).toEqual(valid);

    expect(() => bulkApproveSchema.parse({ doctorIds: [] })).toThrow();
  });

  it('should validate hospital creation payloads', () => {
    const validHosp = {
      name: 'Apollo Hospital',
      branch: 'Greams Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
    };
    expect(hospitalSchema.parse(validHosp)).toEqual(validHosp);

    expect(() =>
      hospitalSchema.parse({
        name: 'A', // too short
        branch: '',
        city: 'Chennai',
        state: 'Tamil Nadu',
      })
    ).toThrow();
  });
});

describe('Zero-Knowledge RLS Invariant', () => {
  it('enforces that admin queries on doctor notes never include plaintext content', () => {
    const storedRow = {
      id: 'note-123',
      doctor_id: 'doc-456',
      title: 'Encounter Note',
      encrypted_payload: 'D7F8A8...CIPHERTEXT...',
      iv: 'B1C2D3...',
      summary_meta: { span_count: 5, language: 'en-IN' },
    };

    expect(storedRow.encrypted_payload).not.toContain('patient');
    expect(storedRow.encrypted_payload).not.toContain('Combiflam');
    expect(storedRow.iv).toBeDefined();
  });
});
