import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ShieldX, LogOut, Activity, PhoneCall } from 'lucide-react';

export function StatusMessage() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const isRejected = profile?.status === 'rejected';
  const isSuspended = profile?.status === 'suspended';

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
          Account Status Notification
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-8 space-y-5 text-center text-xs">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-200 mx-auto flex items-center justify-center">
            <ShieldX className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">
              {isSuspended ? 'Account Access Suspended' : 'Registration Declined'}
            </h3>
            <p className="text-slate-600 leading-relaxed">
              {isSuspended
                ? 'Your clinical portal credentials have been temporarily suspended by the hospital administration. You cannot access clinical encounters or write patient summaries.'
                : 'Your registration request could not be approved by the medical verification board.'}
            </p>
          </div>

          {profile?.rejection_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-left text-red-900">
              <span className="font-semibold block mb-0.5">Administrative Note:</span>
              <span>{profile.rejection_reason}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 space-y-1 text-left">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <PhoneCall className="w-3.5 h-3.5 text-teal-700" /> Need Assistance?
            </div>
            <p className="text-[11px] text-slate-500">
              Please contact your hospital medical directorate or email{' '}
              <strong className="text-teal-800 font-mono">support@clinicnotes.hospital</strong>{' '}
              with your medical council registration copy.
            </p>
          </div>

          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
