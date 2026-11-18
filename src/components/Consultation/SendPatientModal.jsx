import React, { useState } from 'react';
import { Send, MessageSquare, Check, X, Phone, Share2 } from 'lucide-react';
import { logAuditEvent } from '../Common/AuditLogModal';

export function SendPatientModal({ isOpen, onClose, consultationResult }) {
  const [channel, setChannel] = useState('sms');
  const [phoneNumber, setPhoneNumber] = useState('+91 98765 43210');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const previewMessage = `ClinicNotes Medical Dispatch:
Hello Mrs. Smith, your consultation report and digital prescription from Dr. A. Sharma are ready.
Diagnosis: ${consultationResult?.diagnosis || 'Outpatient Review'}
Prescribed: ${(consultationResult?.medicines || []).map((m) => m.name).join(', ')}
Review instructions & order meds: https://clinicnotes.hospital/rx/pt-${Math.floor(100000 + Math.random() * 900000)}`;

  const handleSend = () => {
    setIsSent(true);
    logAuditEvent(
      'PATIENT_DISPATCH',
      `Sent consultation report via ${channel.toUpperCase()} to ${phoneNumber} (Simulated)`
    );
    setTimeout(() => {
      setIsSent(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Send Summary to Patient</h3>
              <p className="text-xs text-slate-500">Secure SMS & WhatsApp Dispatch Preview</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Channel Selector */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Dispatch Channel:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChannel('sms')}
                className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                  channel === 'sms'
                    ? 'bg-teal-50 border-teal-600 text-teal-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>SMS Notification</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('whatsapp')}
                className={`py-2 px-3 rounded-lg border font-medium flex items-center justify-center gap-1.5 transition-all ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Health</span>
              </button>
            </div>
          </div>

          {/* Recipient Phone */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700 block">Patient Mobile Number:</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-slate-800 font-medium"
            />
          </div>

          {/* Message Preview Box */}
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 block">Message Preview:</span>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
              {previewMessage}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={isSent}
            className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              isSent ? 'bg-emerald-600' : 'bg-teal-700 hover:bg-teal-800'
            }`}
          >
            {isSent ? (
              <>
                <Check className="w-4 h-4" />
                <span>Message Dispatched!</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Dispatch to Patient</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
