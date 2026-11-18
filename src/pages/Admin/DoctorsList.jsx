import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Mail,
  Eye,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building2,
  X,
} from 'lucide-react';
import { INITIAL_DEMO_USERS, INITIAL_HOSPITALS, isSupabaseConfigured, supabase } from '../../supabase/client';
import { logAuditEvent } from '../../components/Common/AuditLogModal';
import { useAuth } from '../../context/AuthContext';

export function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [selectedDoctorForProfile, setSelectedDoctorForProfile] = useState(null);
  const [doctorToReject, setDoctorToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    loadDoctors();
  }, []);

  const loadDoctors = async () => {
    let profiles = [];
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('profiles').select('*').eq('role', 'doctor');
        if (data) profiles = data;
      } catch (e) {
        console.warn('Error loading doctors from Supabase:', e);
      }
    }

    if (profiles.length === 0) {
      const stored = localStorage.getItem('clinicnotes_demo_profiles');
      profiles = stored ? JSON.parse(stored) : INITIAL_DEMO_USERS;
    }

    setDoctors(profiles.filter((p) => p.role === 'doctor'));
  };

  const updateDoctorStatus = async (id, newStatus, reason = null) => {
    let backendSuccess = false;

    // Call backend API with admin service-role auto-confirm on approval
    if (session?.access_token) {
      try {
        const res = await fetch(`http://localhost:5000/api/admin/doctors/${id}/status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ status: newStatus, reason }),
        });
        if (res.ok) {
          backendSuccess = true;
        }
      } catch (err) {
        console.warn('Backend doctor status update failed, falling back:', err);
      }
    }

    if (!backendSuccess) {
      if (isSupabaseConfigured && supabase) {
        await supabase
          .from('profiles')
          .update({ status: newStatus, rejection_reason: reason })
          .eq('id', id);
      } else {
        const stored = JSON.parse(localStorage.getItem('clinicnotes_demo_profiles') || '[]');
        const updated = stored.map((d) =>
          d.id === id ? { ...d, status: newStatus, rejection_reason: reason } : d
        );
        localStorage.setItem('clinicnotes_demo_profiles', JSON.stringify(updated));
      }
    }

    logAuditEvent(
      'ADMIN_STATUS_UPDATE',
      `Doctor ${id} status updated to '${newStatus}'${reason ? `: ${reason}` : ''}`,
      'Administrator'
    );
    await loadDoctors();
  };

  const handleApprove = (id) => {
    updateDoctorStatus(id, 'approved');
  };

  const handleRejectConfirm = () => {
    if (!doctorToReject) return;
    updateDoctorStatus(doctorToReject.id, 'rejected', rejectionReason || 'Medical registration verification failed.');
    setDoctorToReject(null);
    setRejectionReason('');
  };

  const handleSuspend = (id) => {
    if (window.confirm('Suspend clinical portal access for this doctor?')) {
      updateDoctorStatus(id, 'suspended', 'Administrative compliance hold.');
    }
  };

  const handleReactivate = (id) => {
    updateDoctorStatus(id, 'approved');
  };

  const handleResetPasswordEmail = (email) => {
    logAuditEvent('ADMIN_RESET_PASSWORD_DISPATCHED', `Reset email dispatched to ${email}`, 'Administrator');
    alert(`Password reset instructions sent to ${email}`);
  };

  const handleBulkApprovePending = async () => {
    const pendingDocs = doctors.filter((d) => d.status === 'pending');
    if (pendingDocs.length === 0) {
      alert('No pending doctors found.');
      return;
    }

    if (window.confirm(`Approve all ${pendingDocs.length} pending doctors?`)) {
      for (const d of pendingDocs) {
        await updateDoctorStatus(d.id, 'approved');
      }
      alert(`Successfully approved ${pendingDocs.length} doctors.`);
    }
  };

  // Filter & Search logic
  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch =
      doc.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.medical_registration_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesState = stateFilter === 'all' || doc.state === stateFilter;

    return matchesSearch && matchesStatus && matchesState;
  });

  const totalPages = Math.ceil(filteredDoctors.length / itemsPerPage) || 1;
  const paginatedDoctors = filteredDoctors.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueStates = Array.from(new Set(doctors.map((d) => d.state).filter(Boolean)));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Registered Clinicians Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit, verify medical registration, and manage doctor authorization across branches
          </p>
        </div>

        <button
          onClick={handleBulkApprovePending}
          className="inline-flex items-center space-x-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Bulk Approve Pending</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by doctor name, email, registration # or specialization..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-600"
        >
          <option value="all">All Account Statuses</option>
          <option value="pending">Pending Verification</option>
          <option value="approved">Approved</option>
          <option value="suspended">Suspended</option>
          <option value="rejected">Rejected</option>
        </select>

        {/* State Filter */}
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:ring-1 focus:ring-teal-600"
        >
          <option value="all">All States</option>
          {uniqueStates.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
              <tr>
                <th className="py-3 px-4">Doctor Details</th>
                <th className="py-3 px-4">Medical Reg. #</th>
                <th className="py-3 px-4">Specialization</th>
                <th className="py-3 px-4">Hospital & State</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedDoctors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No doctor accounts match your search filters.
                  </td>
                </tr>
              ) : (
                paginatedDoctors.map((doc) => {
                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {doc.status}
                    </span>
                  );
                  if (doc.status === 'approved') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Approved
                      </span>
                    );
                  } else if (doc.status === 'pending') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Pending
                      </span>
                    );
                  } else if (doc.status === 'suspended') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">
                        Suspended
                      </span>
                    );
                  }

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{doc.full_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{doc.email}</div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {doc.medical_registration_no || 'Pending proof'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{doc.specialization}</div>
                        <div className="text-[11px] text-slate-500">{doc.department}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {doc.branch || doc.hospital_name || 'Hospital Branch'}
                        </div>
                        <div className="text-[11px] text-slate-500">{doc.state || 'India'}</div>
                      </td>
                      <td className="py-3 px-4">{statusBadge}</td>
                      <td className="py-3 px-4 text-right space-x-1">
                        {/* View Profile */}
                        <button
                          onClick={() => setSelectedDoctorForProfile(doc)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="View detailed credentials"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => handleResetPasswordEmail(doc.email)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded"
                          title="Send password reset email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>

                        {/* Approve */}
                        {doc.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(doc.id)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded"
                            title="Approve doctor credentials"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reject */}
                        {doc.status === 'pending' && (
                          <button
                            onClick={() => setDoctorToReject(doc)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Reject registration"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Suspend / Reactivate */}
                        {doc.status === 'approved' && (
                          <button
                            onClick={() => handleSuspend(doc.id)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded"
                            title="Suspend doctor account"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {doc.status === 'suspended' && (
                          <button
                            onClick={() => handleReactivate(doc.id)}
                            className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded"
                            title="Reactivate doctor account"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredDoctors.length)} of{' '}
            {filteredDoctors.length} doctors
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium text-slate-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Detail Modal */}
      {selectedDoctorForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 text-sm">Doctor Credential Profile</h3>
              <button
                onClick={() => setSelectedDoctorForProfile(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-900">Doctor Name: </span>
                <span>{selectedDoctorForProfile.full_name}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Email: </span>
                <span>{selectedDoctorForProfile.email}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Medical Registration No: </span>
                <span className="font-mono text-teal-800">{selectedDoctorForProfile.medical_registration_no}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Specialization: </span>
                <span>{selectedDoctorForProfile.specialization}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Department: </span>
                <span>{selectedDoctorForProfile.department}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Hospital & Branch: </span>
                <span>{selectedDoctorForProfile.branch}, {selectedDoctorForProfile.state}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-900">Current Status: </span>
                <span className="font-bold uppercase text-teal-800">{selectedDoctorForProfile.status}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDoctorForProfile(null)}
                className="px-4 py-1.5 text-xs bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {doctorToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-3">
            <h3 className="font-bold text-slate-800 text-sm">Reject Doctor Registration</h3>
            <p className="text-xs text-slate-600">
              Provide an administrative rationale for declining{' '}
              <strong>{doctorToReject.full_name}</strong>.
            </p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Medical registration number could not be matched with State Medical Council register."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600 min-h-[80px]"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setDoctorToReject(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-3.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
