import React, { useState } from 'react';
import {
  FileCheck2,
  Copy,
  Check,
  Download,
  Send,
  Pill,
  Calendar,
  AlertCircle,
  HelpCircle,
  Activity,
  UserCheck,
} from 'lucide-react';
import { generateClinicalPDF } from '../../utils/pdfGenerator';
import { logAuditEvent } from '../Common/AuditLogModal';

export function ConsultationResultView({
  result,
  isLoading,
  onOpenSendPatientModal,
}) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-20 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 bg-slate-100 rounded-lg" />
          <div className="h-28 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-32 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-2">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-700 text-sm">No Consultation Ended Yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Start a consultation dialogue with the patient, record the discussion, and press "End Consultation" to generate the conclusion, medication table, and pharmacy links.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    const textOutput = `CONSULTATION CLINICAL REPORT — CLINICNOTES
Date: ${new Date().toLocaleDateString('en-IN')}

DIAGNOSIS / IMPRESSION:
${result.diagnosis || 'Clinical evaluation'}

SUMMARY & CONCLUSION:
${result.summary}

KEY SYMPTOMS DISCUSSED:
${(result.keySymptoms || []).map((s) => `• ${s}`).join('\n')}

WHAT THE DOCTOR RECOMMENDED:
${(result.recommendations || []).map((r) => `• ${r}`).join('\n')}

PRESCRIBED MEDICINES:
${(result.medicines || [])
  .map(
    (m) =>
      `• ${m.name} [${m.dosage || ''}] - ${m.frequency || ''} for ${m.duration || ''}\n  Instructions: ${m.instructions || ''}`
  )
  .join('\n\n')}

FOLLOW-UP PLAN:
${result.followUp}
`;

    navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logAuditEvent('CONSULTATION_COPIED', 'Copied consultation clinical summary');
  };

  const handleDownloadPdf = () => {
    generateClinicalPDF({
      title: 'Consultation_Patient_Summary',
      patient: { name: 'Outpatient Consultation', mrnOrId: 'OPD-SESSION' },
      content: result,
      type: 'Doctor-Patient Encounter & Prescription',
    });
    logAuditEvent('CONSULTATION_PDF_DOWNLOADED', 'Downloaded patient consultation summary PDF');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-800 text-base">Consultation Conclusion & Findings</h3>
            {result.source && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {result.source}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Extracted strictly from verified doctor statements</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={onOpenSendPatientModal}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send to Patient</span>
          </button>
        </div>
      </div>

      {/* Diagnosis Banner */}
      <div className="bg-teal-50/60 border border-teal-200 rounded-lg p-3.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-800 block mb-0.5">
          Diagnosis / Clinical Impression
        </span>
        <h4 className="font-bold text-teal-950 text-sm">{result.diagnosis || 'Clinical evaluation'}</h4>
      </div>

      {/* Overview / Conclusion Card */}
      <div className="border border-slate-200 rounded-lg p-3.5 space-y-1">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Conclusion</h4>
        <p className="text-xs text-slate-800 leading-relaxed">{result.summary}</p>
      </div>

      {/* Symptoms & Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Symptoms */}
        <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-slate-500" />
            Key Symptoms Discussed
          </h4>
          <ul className="space-y-1 text-xs text-slate-700">
            {(result.keySymptoms || []).map((sym, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-teal-600 font-bold">•</span>
                <span>{sym}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Doctor Recommendations */}
        <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/40">
          <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
            What the Doctor Recommended
          </h4>
          <ul className="space-y-1 text-xs text-slate-700">
            {(result.recommendations || []).map((rec, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-teal-700 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="border border-slate-200 rounded-lg p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Pill className="w-4 h-4 text-teal-700" />
            Prescribed Medicines
          </h4>
          <span className="text-[11px] text-slate-400">
            {result.medicines?.length || 0} items extracted
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                <th className="pb-2">Medicine Name</th>
                <th className="pb-2">Dosage</th>
                <th className="pb-2">Frequency</th>
                <th className="pb-2">Duration</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(result.medicines || []).map((med, idx) => (
                <tr key={idx} className="text-slate-800 hover:bg-slate-50/50">
                  <td className="py-2.5 font-bold text-teal-900">{med.name}</td>
                  <td className="py-2.5">{med.dosage || 'Standard'}</td>
                  <td className="py-2.5">{med.frequency || 'As advised'}</td>
                  <td className="py-2.5">{med.duration || '3 days'}</td>
                  <td className="py-2.5">
                    {med.rxRequired ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Rx Only
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        OTC
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-600 max-w-xs">{med.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow-Up Plan */}
      {result.followUp && (
        <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50 flex items-start space-x-2.5 text-xs text-slate-700">
          <Calendar className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900">Follow-Up & Safety Plan:</span>
            <p className="mt-0.5 text-slate-700 leading-relaxed">{result.followUp}</p>
          </div>
        </div>
      )}

      {/* Medical Disclaimer */}
      <div className="text-[11px] text-slate-400 italic text-center pt-2 border-t border-slate-100">
        AI-generated consultation summary. Review and verify before clinical use.
      </div>
    </div>
  );
}
