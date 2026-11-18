import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Stethoscope, Building2, Lock, X, Check, ShieldCheck } from 'lucide-react';
import { logAuditEvent } from './AuditLogModal';

export function MyProfileModal({ isOpen, onClose }) {
  const { profile, updateProfile, changePassword } = useAuth();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'password'

  // Editable fields
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [specialization, setSpecialization] = useState(profile?.specialization || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [branch, setBranch] = useState(profile?.branch || '');
  const [state, setState] = useState(profile?.state || '');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savedMessage, setSavedMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavedMessage(null);
    setErrorMessage(null);
    try {
      await updateProfile({
        full_name: fullName,
        specialization,
        department,
        branch,
        state,
      });
      logAuditEvent('PROFILE_UPDATED', `Clinician updated profile information`);
      setSavedMessage('Profile details saved successfully.');
      setTimeout(() => setSavedMessage(null), 2500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSavedMessage(null);
    setErrorMessage(null);

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      await changePassword(newPassword);
      logAuditEvent('PASSWORD_CHANGED', `Doctor changed account credentials`);
      setSavedMessage('Account password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSavedMessage(null), 2500);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to change password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Clinician Profile & Security</h3>
              <p className="text-xs text-slate-500">Hospital Credential Information</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 text-xs font-semibold bg-white">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2.5 mr-6 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`py-2.5 border-b-2 transition-colors ${
              activeTab === 'password'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {savedMessage && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-1.5 font-medium">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{savedMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg font-medium">
              {errorMessage}
            </div>
          )}

          {activeTab === 'profile' ? (
            <form onSubmit={handleSaveProfile} className="space-y-3">
              {/* Status Badge & Read-Only IDs */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Account Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                    {profile?.status || 'Approved'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Registered Email:</span>
                  <span className="font-mono text-slate-900 font-medium">{profile?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Medical Registration #:</span>
                  <span className="font-mono text-teal-800 font-semibold">
                    {profile?.medical_registration_no || 'MCI-VERIFIED'}
                  </span>
                </div>
              </div>

              {/* Editable Fields */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hospital Branch</label>
                  <input
                    type="text"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg shadow-2xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-lg shadow-2xs"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
