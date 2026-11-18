import React, { useState } from 'react';
import { Share2, Building2, Send, Check, AlertCircle, X } from 'lucide-react';
import { logAuditEvent } from '../Common/AuditLogModal';

export function ShareDepartmentModal({ isOpen, onClose, summary, patientName }) {
  const [selectedDept, setSelectedDept] = useState('Internal Medicine');
  const [priority, setPriority] = useState('Routine');
  const [notes, setNotes] = useState('');
  const [dispatched, setDispatched] = useState(false);

  if (!isOpen) return null;

  const handleDispatch = () => {
    setDispatched(true);
    logAuditEvent(
      'DEPARTMENT_SHARED',
      `Clinical report dispatched to Department of ${selectedDept} [${priority}] (Simulated)`
    );
    setTimeout(() => {
      setDispatched(false);
      onClose();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Share with Hospital Department</h3>
              <p className="text-xs text-slate-500">Simulated hospital intranet dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Demo Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold">Simulated Hospital Referral Demo:</span>
              <p className="mt-0.5">
                This demonstrates how clinical documentation packages are routed to specialized departments (e.g., via HL7 FHIR messaging). No live hospital server is contacted.
              </p>
            </div>
          </div>

          {/* Department Select */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Select Receiving Department:</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium"
            >
              <option value="Internal Medicine">Internal Medicine (Ward 4B)</option>
              <option value="Cardiology">Cardiology OPD / Echo Lab</option>
              <option value="Neurology">Neurology & Stroke Center</option>
              <option value="Pulmonology">Pulmonology & Respiratory Care</option>
              <option value="Orthopedics">Orthopedics & Joint Clinic</option>
              <option value="Pediatrics">Pediatrics & Neonatal Care</option>
              <option value="Emergency Medicine">Emergency Department (Triage)</option>
            </select>
          </div>

          {/* Urgency */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Referral Priority:</label>
            <div className="flex gap-2">
              {['Routine', 'Semi-Urgent', 'Stat / Immediate'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-1.5 px-2 rounded-lg border text-center font-medium transition-all ${
                    priority === p
                      ? 'bg-teal-50 border-teal-600 text-teal-800 font-semibold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Clinical Handover Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Handover Note to Attending Specialist:</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Patient referred for ultrasound correlation and persistent gastric discomfort..."
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600 min-h-[60px]"
            />
          </div>

          {/* Dispatch Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1 text-slate-600 font-mono text-[11px]">
            <div>Patient: {patientName || 'Mrs. Smith'}</div>
            <div>Chief Complaint: {summary?.chiefComplaint ? summary.chiefComplaint.slice(0, 60) + '...' : 'Clinical notes'}</div>
            <div>Destination: {selectedDept} ({priority})</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleDispatch}
            disabled={dispatched}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              dispatched ? 'bg-emerald-600' : 'bg-teal-700 hover:bg-teal-800'
            }`}
          >
            {dispatched ? (
              <>
                <Check className="w-4 h-4" />
                <span>Dispatched to Intranet!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch Referral Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
