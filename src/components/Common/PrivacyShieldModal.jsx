import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, AlertCircle, X, Check } from 'lucide-react';
import { PhiScrubber } from '../../utils/phiScrubber';

export function PrivacyShieldModal({ isOpen, onClose, currentTranscript = '' }) {
  const [testText, setTestText] = useState(
    currentTranscript ||
      'Today I met with a patient. Her name was Mrs. Smith. She was 38 years old female, phone 9876543210, MRN CN-84920.'
  );

  if (!isOpen) return null;

  const { scrubbedText, mapping, stats } = PhiScrubber.scrub(testText);
  const restoredText = PhiScrubber.restore(scrubbedText, mapping);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Client-Side Privacy Shield</h3>
              <p className="text-xs text-slate-500">Zero-PHI transmission architecture</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Badge & Explanation */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-emerald-900">Protected Health Information (PHI) Never Leaves Your Device</p>
              <p className="text-xs text-emerald-700 mt-1">
                Before sending notes to the Claude AI API, all patient names, ages, phone numbers, and hospital IDs are replaced with token placeholders on your device. The raw values are restored locally after processing.
              </p>
            </div>
          </div>

          {/* Interactive Scrubbing Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-700 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-slate-500" /> Live Scrubbing Demonstration
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {stats.total} PHI items scrubbed
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Local Browser Side */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  1. Browser (Raw Patient Data)
                </span>
                <p className="text-xs text-slate-700 font-mono bg-white p-2 rounded border border-slate-200 leading-relaxed whitespace-pre-wrap">
                  {testText}
                </p>
              </div>

              {/* What Claude API Receives */}
              <div className="border border-teal-200 rounded-lg p-3 bg-teal-50/50">
                <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider block mb-1">
                  2. Sent to Claude API (Anonymized)
                </span>
                <p className="text-xs text-teal-900 font-mono bg-white p-2 rounded border border-teal-200 leading-relaxed whitespace-pre-wrap">
                  {scrubbedText}
                </p>
              </div>
            </div>

            {/* Mappings Table */}
            {Object.keys(mapping).length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-lg p-3 bg-white">
                <span className="text-xs font-medium text-slate-600 block mb-2">Local In-Memory Mapping Table:</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(mapping).map(([token, realVal]) => (
                    <span
                      key={token}
                      className="inline-flex items-center gap-1.5 text-xs bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-mono"
                    >
                      <span className="text-teal-700 font-semibold">{token}</span>
                      <span className="text-slate-400">→</span>
                      <span className="text-red-600 font-semibold">{realVal}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Architecture Checklist */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Security Invariants</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Zero server storage of audio or video</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Camera recordings stay in browser Blob</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Web Crypto AES-GCM local storage encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Strict regex & rule-based PHI redaction</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors"
          >
            Close Privacy Shield
          </button>
        </div>
      </div>
    </div>
  );
}
