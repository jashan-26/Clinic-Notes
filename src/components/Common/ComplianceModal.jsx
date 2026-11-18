import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, FileText, X } from 'lucide-react';

export function ComplianceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Privacy, Safety & Compliance Statement</h3>
              <p className="text-xs text-slate-500">HIPAA & Digital Personal Data Protection (DPDP) Readiness</p>
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
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 leading-relaxed">
          {/* Important Notice Banner */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Honest Disclosure: Architectural Readiness vs Certification</p>
              <p className="text-amber-800 mt-0.5">
                ClinicNotes is architected with strict Privacy-by-Design principles. This software is a clinical documentation assistive tool and has not undergone third-party HIPAA / SOC-2 certification. Below is an honest accounting of controls in place.
              </p>
            </div>
          </div>

          {/* Implemented Controls */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              What is Built & Working Today:
            </h4>
            <ul className="space-y-1.5 pl-5 list-disc text-slate-700">
              <li>
                <strong>Client-Side PHI Scrubbing Shield:</strong> Patient identifiers (names, ages, phones, MRNs) are scrubbed in the browser before dispatching LLM queries, and reconstructed locally.
              </li>
              <li>
                <strong>Ephemeral Audio/Video Processing:</strong> Camera and microphone streams are processed client-side via Web Speech and MediaRecorder. No raw audiovisual bytes are uploaded to the proxy server.
              </li>
              <li>
                <strong>AES-GCM Web Crypto Storage:</strong> Local notes can be encrypted with the doctor's custom passphrase using standard PBKDF2 + AES-GCM 256-bit cryptography.
              </li>
              <li>
                <strong>Audit Trail & DPDP Right to Erasure:</strong> Local access audit logging, data portability JSON export, and single-click total data erasure.
              </li>
              <li>
                <strong>Explicit Clinical Consent Flow:</strong> Verified timestamped patient consent log before live audio transcription initiates.
              </li>
            </ul>
          </div>

          {/* What Production Still Needs */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              What a Hospital Production Deployment Would Still Require:
            </h4>
            <ul className="space-y-1.5 pl-5 list-disc text-slate-600">
              <li>Executed Business Associate Agreement (BAA) with AI provider (Anthropic Zero Data Retention tier).</li>
              <li>Enterprise HSM / KMS (AWS KMS or Azure Key Vault) for centralized key lifecycle management.</li>
              <li>SOC 2 Type II certified cloud infrastructure with region-locked Indian data sovereignty (DPDP Act 2023).</li>
              <li>Hospital EHR integration via HL7 FHIR standard (SMART on FHIR).</li>
              <li>Third-party penetration testing and formal vulnerability assessment.</li>
            </ul>
          </div>

          {/* Medical Disclaimer */}
          <div className="p-3 bg-slate-100 rounded-lg text-slate-600 text-[11px]">
            <strong>Clinical Disclaimer:</strong> ClinicNotes provides administrative scribing and summarization assistance. It is NOT a diagnostic device. All medication summaries and suggestions must be reviewed and signed off by a licensed medical practitioner before clinical administration.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
