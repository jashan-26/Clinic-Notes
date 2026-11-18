import React, { useState, useEffect } from 'react';
import { UserCheck, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { INITIAL_DEMO_USERS, isSupabaseConfigured, supabase } from '../../supabase/client';
import { logAuditEvent } from '../../components/Common/AuditLogModal';
import { useAuth } from '../../context/AuthContext';

export function PendingApprovals() {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const { session } = useAuth();

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    let profiles = [];
    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'doctor')
        .eq('status', 'pending');
      if (data) profiles = data;
    } else {
      const stored = JSON.parse(localStorage.getItem('clinicnotes_demo_profiles') || '[]');
      profiles = stored.filter((p) => p.role === 'doctor' && p.status === 'pending');
    }
    setPendingDoctors(profiles);
  };

  const handleAction = async (id, newStatus) => {
    let backendSuccess = false;

    // Call backend API with admin service-role auto-confirm
    if (session?.access_token) {
      try {
        const res = await fetch(`http://localhost:5000/api/admin/doctors/${id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        });
        if (res.ok) {
          backendSuccess = true;
        }
      } catch (err) {
        console.warn('Backend status update request failed, falling back:', err);
      }
    }

    if (!backendSuccess) {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
      } else {
        const stored = JSON.parse(localStorage.getItem('clinicnotes_demo_profiles') || '[]');
        const updated = stored.map((d) => (d.id === id ? { ...d, status: newStatus } : d));
        localStorage.setItem('clinicnotes_demo_profiles', JSON.stringify(updated));
      }
    }

    logAuditEvent('ADMIN_PENDING_ACTION', `Doctor ${id} ${newStatus}`, 'Administrator');
    await loadPending();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pending Credential Verification Queue</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review Medical Registration credentials before granting access to patient encounter documentation
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" /> Awaiting Review ({pendingDoctors.length})
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendingDoctors.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Verification Queue is Clear</p>
              <p className="mt-0.5">No pending doctor registrations require review.</p>
            </div>
          ) : (
            pendingDoctors.map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{doc.full_name}</span>
                    <span className="font-mono text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-[11px] font-semibold">
                      Reg #: {doc.medical_registration_no}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    {doc.specialization} • {doc.department}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {doc.branch ? `${doc.branch}, ${doc.state}` : 'Affiliated Hospital'} • Registered:{' '}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleAction(doc.id, 'rejected')}
                    className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleAction(doc.id, 'approved')}
                    className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-semibold shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve Doctor</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
