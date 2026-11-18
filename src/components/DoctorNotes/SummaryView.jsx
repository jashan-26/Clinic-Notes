import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Share2,
  EyeOff,
  Eye,
  FileDown,
  Bookmark,
  ShieldCheck,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { generateClinicalPDF } from '../../utils/pdfGenerator';
import { logAuditEvent } from '../Common/AuditLogModal';

export function SummaryView({
  summary,
  isLoading,
  maskPhi,
  setMaskPhi,
  onOpenShareModal,
  onSaveNote,
}) {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-5 bg-slate-200 rounded w-1/3" />
        <div className="h-16 bg-slate-100 rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-slate-100 rounded-lg" />
          <div className="h-24 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-28 bg-slate-100 rounded-lg" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-400">
        <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 text-slate-400 mx-auto flex items-center justify-center mb-2">
          <FileDown className="w-6 h-6" />
        </div>
        <h4 className="font-semibold text-slate-700 text-sm">No Summary Generated Yet</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Start dictating notes or load a sample note, then click "Summarize Notes" to generate the structured clinical record.
        </p>
      </div>
    );
  }

  // Patient field values with Mask PHI support
  const patientName = maskPhi ? '[REDACTED]' : (summary.patient?.name || 'Patient');
  const patientAge = maskPhi ? '[REDACTED]' : (summary.patient?.age || 'Not specified');
  const patientGender = summary.patient?.gender || 'Not specified';
  const patientId = maskPhi ? '[REDACTED]' : (summary.patient?.mrnOrId || 'CN-DEMO-01');

  const handleCopy = () => {
    const textOutput = `CLINICAL SUMMARY — CLINICNOTES
Date: ${new Date().toLocaleDateString('en-IN')}

PATIENT: ${patientName} | Age: ${patientAge} | Gender: ${patientGender} | ID: ${patientId}

CHIEF COMPLAINT:
${summary.chiefComplaint || 'N/A'}

MEDICAL HISTORY:
${(summary.medicalHistory || []).map((h) => `• ${h}`).join('\n')}

MEDICATIONS GIVEN:
${(summary.medicationsGiven || []).map((m) => `• ${m.name} (${m.dosage || ''}) - ${m.frequency || ''} - ${m.instructions || ''}`).join('\n')}

TESTS & TREATMENTS:
${(summary.testsAndTreatments || []).map((t) => `• ${t}`).join('\n')}

DOCTOR RECOMMENDATIONS:
${(summary.doctorRecommendations || []).map((r) => `• ${r}`).join('\n')}

FOLLOW UP:
${summary.followUp || 'N/A'}
`;

    navigator.clipboard.writeText(textOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    logAuditEvent('SUMMARY_COPIED', `Copied clinical summary for ${patientName}`);
  };

  const handleDownloadTxt = () => {
    const textOutput = `CLINICNOTES — CLINICAL SUMMARY
Generated: ${new Date().toLocaleString()}
Patient: ${patientName} (${patientAge}, ${patientGender}) | ID: ${patientId}

Chief Complaint:
${summary.chiefComplaint}

Medical History:
${(summary.medicalHistory || []).join('\n')}

Prescribed Medications:
${(summary.medicationsGiven || []).map((m) => `${m.name} | ${m.dosage} | ${m.frequency} | ${m.instructions}`).join('\n')}

Diagnostic Tests:
${(summary.testsAndTreatments || []).join('\n')}

Recommendations & Follow-up:
${(summary.doctorRecommendations || []).join('\n')}
Follow-up: ${summary.followUp}
`;

    const blob = new Blob([textOutput], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Clinical_Summary_${patientName.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    logAuditEvent('SUMMARY_DOWNLOADED_TXT', `Downloaded .txt summary`);
  };

  const handleDownloadPdf = () => {
    generateClinicalPDF({
      title: `Clinical_Summary_${patientName}`,
      patient: summary.patient,
      content: summary,
      maskPhi,
      type: 'Doctor Dictation Summary',
    });
    logAuditEvent('SUMMARY_DOWNLOADED_PDF', `Downloaded hospital PDF for ${patientName}`);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-800 text-base">Structured Clinical Summary</h3>
            {summary.source && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {summary.source}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">Auto-generated encounter documentation</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Mask PHI Toggle */}
          <button
            onClick={() => setMaskPhi(!maskPhi)}
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              maskPhi
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Toggle masking of Protected Health Information"
          >
            {maskPhi ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-red-600" />
                <span>Mask PHI: ON</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Mask PHI</span>
              </>
            )}
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Copy summary text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* PDF Download */}
          <button
            onClick={handleDownloadPdf}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-medium transition-colors"
            title="Download formatted Clinical PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>

          {/* TXT Download */}
          <button
            onClick={handleDownloadTxt}
            className="inline-flex items-center space-x-1 px-2 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
            title="Download plain text"
          >
            <span>.txt</span>
          </button>

          {/* Share with Department Modal */}
          <button
            onClick={onOpenShareModal}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            title="Share with hospital department"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          {/* Save Note */}
          <button
            onClick={onSaveNote}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Save note to history"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Patient PHI Card (RED FONT ONLY) */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">Patient Name</span>
          <span className="font-bold text-[#DC2626] text-sm">{patientName}</span>
        </div>
        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">Age / Gender</span>
          <span className="font-medium text-[#DC2626]">
            {patientAge} • {patientGender}
          </span>
        </div>
        <div>
          <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold block">MRN / Record #</span>
          <span className="font-mono font-semibold text-[#DC2626]">{patientId}</span>
        </div>
      </div>

      {/* Chief Complaint */}
      <div className="border border-slate-200 rounded-lg p-3.5">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Chief Complaint</h4>
        <p className="text-xs text-slate-800 leading-relaxed">{summary.chiefComplaint}</p>
      </div>

      {/* Medical History & Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Medical History (Green Accents) */}
        <div className="border border-emerald-200 bg-emerald-50/40 rounded-lg p-3.5">
          <h4 className="text-xs font-semibold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Past Medical History
          </h4>
          <ul className="space-y-1 text-xs text-emerald-950">
            {summary.medicalHistory && summary.medicalHistory.length > 0 ? (
              summary.medicalHistory.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">None reported</li>
            )}
          </ul>
        </div>

        {/* Tests & Treatments (Blue Accents) */}
        <div className="border border-blue-200 bg-blue-50/40 rounded-lg p-3.5">
          <h4 className="text-xs font-semibold text-blue-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Tests & Treatments Ordered
          </h4>
          <ul className="space-y-1 text-xs text-blue-950">
            {summary.testsAndTreatments && summary.testsAndTreatments.length > 0 ? (
              summary.testsAndTreatments.map((test, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>{test}</span>
                </li>
              ))
            ) : (
              <li className="text-slate-400 italic">None ordered</li>
            )}
          </ul>
        </div>
      </div>

      {/* Prescribed Medications (Yellow Accents) */}
      <div className="border border-amber-200 bg-amber-50/40 rounded-lg p-3.5">
        <h4 className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Medications Prescribed
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-amber-200 text-amber-900 font-semibold">
                <th className="pb-1.5">Medicine</th>
                <th className="pb-1.5">Dosage</th>
                <th className="pb-1.5">Frequency</th>
                <th className="pb-1.5">Instructions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              {summary.medicationsGiven && summary.medicationsGiven.length > 0 ? (
                summary.medicationsGiven.map((med, idx) => (
                  <tr key={idx} className="text-amber-950">
                    <td className="py-1.5 font-bold">{med.name}</td>
                    <td className="py-1.5">{med.dosage || 'Standard'}</td>
                    <td className="py-1.5">{med.frequency || 'As advised'}</td>
                    <td className="py-1.5 text-slate-600">{med.instructions || 'With water'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-2 text-slate-400 italic">
                    No medications listed
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommendations & Follow-Up */}
      <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-2">
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Doctor Recommendations & Advice
        </h4>
        <ul className="space-y-1 text-xs text-slate-700">
          {(summary.doctorRecommendations || []).map((rec, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <span className="text-teal-700 font-bold">•</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>

        {summary.followUp && (
          <div className="mt-2 pt-2 border-t border-slate-200 text-xs text-slate-800">
            <span className="font-semibold text-slate-900">Follow-Up: </span>
            <span>{summary.followUp}</span>
          </div>
        )}
      </div>

      {/* Medical Disclaimer Footer */}
      <div className="text-[11px] text-slate-400 italic text-center pt-2 border-t border-slate-100">
        AI-generated summary. Review and verify before clinical use.
      </div>
    </div>
  );
}
