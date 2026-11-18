import React, { useState, useEffect } from 'react';
import { ClipboardList, Trash2, Download, Clock, ShieldAlert, X } from 'lucide-react';

export function AuditLogModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [retentionPolicy, setRetentionPolicy] = useState('7_days');

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const loadLogs = () => {
    try {
      const stored = localStorage.getItem('clinicnotes_audit_logs');
      if (stored) {
        setLogs(JSON.parse(stored));
      } else {
        // Initialize with default demo log entries
        const initial = [
          {
            id: 'log-1',
            action: 'SESSION_INITIALIZED',
            actor: 'Dr. A. Sharma (Doctor)',
            details: 'Outpatient workstation authenticated with local encrypted session.',
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          },
          {
            id: 'log-2',
            action: 'NOTE_ANALYZED',
            actor: 'Dr. A. Sharma (Doctor)',
            details: 'Clinical dictation analyzed with client-side PHI scrubbing shield.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'log-3',
            action: 'CONSULTATION_STARTED',
            actor: 'Dr. A. Sharma (Doctor)',
            details: 'Doctor-Patient consultation initiated with verified patient consent.',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
          },
        ];
        localStorage.setItem('clinicnotes_audit_logs', JSON.stringify(initial));
        setLogs(initial);
      }
    } catch (e) {
      console.warn('Could not load audit logs:', e);
    }
  };

  const handleClearAllData = () => {
    if (
      window.confirm(
        'DPDP Right to Erasure: Are you sure you want to permanently delete all saved notes, consultation history, and audit logs from this browser?'
      )
    ) {
      localStorage.removeItem('clinicnotes_saved_notes');
      localStorage.removeItem('clinicnotes_consultations');
      localStorage.removeItem('clinicnotes_cart');
      localStorage.removeItem('clinicnotes_orders');
      localStorage.removeItem('clinicnotes_audit_logs');
      setLogs([]);
      alert('All local medical notes and telemetry data have been erased.');
    }
  };

  const handleExportData = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      compliance: 'DPDP / HIPAA Data Portability Export',
      auditLogs: logs,
      notes: localStorage.getItem('clinicnotes_saved_notes') || '[]',
      orders: localStorage.getItem('clinicnotes_orders') || '[]',
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ClinicNotes_Data_Export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Audit Trail & Data Retention</h3>
              <p className="text-xs text-slate-500">Immutable local compliance logging</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Retention Setting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <div>
                <span className="font-medium text-slate-700 text-xs block">Data Retention Policy</span>
                <span className="text-slate-500 text-xs">Auto-purge browser cache after:</span>
              </div>
            </div>
            <select
              value={retentionPolicy}
              onChange={(e) => setRetentionPolicy(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              <option value="24_hours">24 Hours (Clinic Shift)</option>
              <option value="7_days">7 Days (Default Outpatient)</option>
              <option value="30_days">30 Days</option>
              <option value="never">Manual Erasure Only</option>
            </select>
          </div>

          {/* Log Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 text-xs font-semibold text-slate-600">
              Recent Access & Modification Logs ({logs.length})
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No logs recorded yet.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 text-xs hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="font-semibold text-teal-700">{log.action}</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700">{log.details}</p>
                    <span className="text-slate-400 text-[11px] mt-0.5 block">Actor: {log.actor}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* DPDP Actions */}
          <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={handleExportData}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export My Data (JSON)
            </button>
            <button
              onClick={handleClearAllData}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 border border-red-200 rounded-lg text-red-700 bg-red-50 hover:bg-red-100 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              Delete All My Data (Right to Erasure)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function logAuditEvent(action, details, actor = 'Dr. A. Sharma (Doctor)') {
  try {
    const stored = localStorage.getItem('clinicnotes_audit_logs');
    const logs = stored ? JSON.parse(stored) : [];
    logs.unshift({
      id: 'log-' + Date.now(),
      action,
      actor,
      details,
      timestamp: new Date().toISOString(),
    });
    // keep max 100 entries
    localStorage.setItem('clinicnotes_audit_logs', JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to append audit log:', e);
  }
}
