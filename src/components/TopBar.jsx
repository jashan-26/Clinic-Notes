import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  ClipboardList,
  FileBadge,
  Sparkles,
  Stethoscope,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function TopBar({
  activeTab,
  onTabChange,
  onOpenPrivacyShield,
  onOpenAuditLog,
  onOpenCompliance,
  onOpenProfileModal,
  onStartTour,
  sttEngineName = 'Web Speech API (Native)',
}) {
  const { profile, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || 'Dr. A. Sharma';
  const roleBadge = profile?.role === 'admin' ? 'Admin' : 'Doctor';
  const hospitalAffiliation = profile?.branch
    ? `${profile.branch}`
    : profile?.department || 'Dept of Internal Medicine';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">ClinicNotes</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  Hospital Suite
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Clinical Documentation & Consultation Assistant
              </p>
            </div>
          </div>

          {/* Action Chips & Utilities */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Guided Demo Button for Recruiters */}
            <button
              onClick={onStartTour}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              title="Start guided interactive demo"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
              <span className="hidden sm:inline">Guided Demo</span>
            </button>

            {/* Privacy Shield Pill */}
            <button
              onClick={onOpenPrivacyShield}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium transition-colors"
              title="View Client-Side PHI Scrubbing details"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="hidden md:inline">Privacy Shield: Active</span>
            </button>

            {/* Compliance Modal Button */}
            <button
              onClick={onOpenCompliance}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="HIPAA & DPDP Compliance Statement"
            >
              <FileBadge className="w-4 h-4" />
            </button>

            <div className="h-5 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

            {/* Dynamic Profile Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                </div>
                <div className="hidden lg:block">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-slate-800">{displayName}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-teal-50 text-teal-700 border border-teal-200 uppercase">
                      {roleBadge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 max-w-[140px] truncate">
                    {hospitalAffiliation}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Card */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 text-xs z-50">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <p className="font-semibold text-slate-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{profile?.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenProfileModal();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Profile</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenProfileModal();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400" />
                      <span>Security & Password</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAuditLog();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-slate-400" />
                      <span>My Audit Trail</span>
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenCompliance();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center space-x-2"
                    >
                      <FileBadge className="w-3.5 h-3.5 text-slate-400" />
                      <span>Privacy & Compliance</span>
                    </button>

                    {profile?.role === 'admin' && (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/admin');
                        }}
                        className="w-full text-left px-3.5 py-1.5 text-teal-800 font-semibold hover:bg-teal-50 flex items-center space-x-2"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        <span>Admin Governance Portal</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-3.5 py-1.5 text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Row */}
        <div className="flex border-t border-slate-200 space-x-8">
          <button
            onClick={() => onTabChange('notes')}
            className={`py-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'notes'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>Tab 1: Doctor Notes</span>
            <span className="text-xs font-normal text-slate-500 hidden sm:inline">(Dictation & Summarizer)</span>
          </button>

          <button
            onClick={() => onTabChange('consultation')}
            className={`py-3 text-sm font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeTab === 'consultation'
                ? 'border-teal-700 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span>Tab 2: Consultation</span>
            <span className="text-xs font-normal text-slate-500 hidden sm:inline">
              (Live Dialogue & Pharmacy Suggestions)
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
