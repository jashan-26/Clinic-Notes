import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, ShieldCheck, RefreshCw, LogOut, Activity, AlertCircle } from 'lucide-react';

export function PendingApproval() {
  const { profile, signOut, fetchProfile, user } = useAuth();
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setChecking(true);
    setMessage(null);
    try {
      if (user) {
        await fetchProfile(user.id);
      }
      if (profile?.status === 'approved') {
        navigate('/');
      } else {
        setMessage('Status is still pending administrator review.');
      }
    } catch (e) {
      setMessage('Could not refresh status.');
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-700 text-white shadow-sm mb-3">
          <Activity className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">
          Account Pending Administrator Approval
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Medical Credential Verification in Progress
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-8 space-y-5 text-center text-xs">
          {/* Status Icon */}
          <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border border-amber-200 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">
              Welcome, {profile?.full_name || 'Doctor'}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              Your registration with Medical Council Registration Number{' '}
              <strong className="font-mono text-teal-800">
                {profile?.medical_registration_no || 'Submitted'}
              </strong>{' '}
              has been logged. To ensure clinical safety and HIPAA/DPDP compliance, an administrator must approve your credentials before you can access patient encounters.
            </p>
          </div>

          {/* Details Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left space-y-1 text-slate-700">
            <div>
              <span className="font-semibold text-slate-900">Registered Email: </span>
              <span>{profile?.email}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Specialization: </span>
              <span>{profile?.specialization || 'Internal Medicine'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Hospital: </span>
              <span>{profile?.branch ? `${profile?.branch}, ${profile?.state}` : 'Affiliated Centre'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900">Status: </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                Pending Verification
              </span>
            </div>
          </div>

          {message && (
            <div className="p-2.5 bg-slate-100 border border-slate-200 rounded text-slate-600 flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
              <span>{message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleRefresh}
              disabled={checking}
              className="flex-1 py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Refresh Status'}</span>
            </button>

            <button
              onClick={handleSignOut}
              className="py-2 px-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
