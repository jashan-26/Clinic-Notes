import React, { useState, useEffect } from 'react';
import { Settings, Clock, ShieldCheck, Save, Check } from 'lucide-react';
import { logAuditEvent } from '../../components/Common/AuditLogModal';

export function AdminSettings() {
  const [retentionPolicy, setRetentionPolicy] = useState('7_days');
  const [sessionTimeout, setSessionTimeout] = useState('30_mins');
  const [requireApproval, setRequireApproval] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('clinicnotes_admin_settings');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRetentionPolicy(parsed.retentionPolicy || '7_days');
        setSessionTimeout(parsed.sessionTimeout || '30_mins');
        setRequireApproval(parsed.requireApproval ?? true);
      } catch (e) {}
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    const settings = {
      retentionPolicy,
      sessionTimeout,
      requireApproval,
    };
    localStorage.setItem('clinicnotes_admin_settings', JSON.stringify(settings));
    logAuditEvent(
      'ADMIN_SETTINGS_UPDATED',
      `Updated retention: ${retentionPolicy}, session: ${sessionTimeout}, requireApproval: ${requireApproval}`,
      'Administrator'
    );
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Hospital System Governance Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure network-wide retention rules, session security thresholds, and doctor onboarding
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5 text-xs">
        {/* Retention Policy */}
        <div className="space-y-1.5 pb-4 border-b border-slate-100">
          <label className="font-bold text-slate-800 block">Default Data Retention Policy (DPDP Act)</label>
          <p className="text-slate-500">
            Defines how long client encounter caches and telemetry remain in workstation storage before automatic purge:
          </p>
          <select
            value={retentionPolicy}
            onChange={(e) => setRetentionPolicy(e.target.value)}
            className="w-full sm:w-72 p-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 font-medium"
          >
            <option value="24_hours">24 Hours (Hospital Shift Protocol)</option>
            <option value="7_days">7 Days (Standard Outpatient OPD)</option>
            <option value="30_days">30 Days (Extended Review)</option>
            <option value="never">Manual Clinician Erasure Only</option>
          </select>
        </div>

        {/* Inactivity Session Timeout */}
        <div className="space-y-1.5 pb-4 border-b border-slate-100">
          <label className="font-bold text-slate-800 block">Workstation Inactivity Auto-Logout</label>
          <p className="text-slate-500">
            Automatically terminates inactive sessions to protect patient health records on shared hospital terminals:
          </p>
          <select
            value={sessionTimeout}
            onChange={(e) => setSessionTimeout(e.target.value)}
            className="w-full sm:w-72 p-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-teal-600 font-medium"
          >
            <option value="15_mins">15 Minutes (High Security OPD)</option>
            <option value="30_mins">30 Minutes (Recommended Hospital Default)</option>
            <option value="60_mins">60 Minutes</option>
          </select>
        </div>

        {/* Require Admin Approval Toggle */}
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 block">Require Admin Approval for New Doctors</span>
              <p className="text-slate-500 text-[11px]">
                When enabled, new registrations must be reviewed by the clinical administrator before accessing patient notes.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={requireApproval}
                onChange={(e) => setRequireApproval(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-700"></div>
            </label>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-400">Settings take effect immediately across all terminals.</span>
          <button
            type="submit"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-medium shadow-2xs transition-colors"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saved ? 'Settings Saved!' : 'Save System Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
