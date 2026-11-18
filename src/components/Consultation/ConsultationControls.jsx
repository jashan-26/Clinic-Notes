import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Square,
  QrCode,
  Users,
  Cpu,
  CheckSquare,
  Clock,
  Sparkles,
  Keyboard,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { SAMPLE_CONSULTATIONS } from '../../utils/sampleData';
import { logAuditEvent } from '../Common/AuditLogModal';

export function ConsultationControls({
  mode,
  setMode,
  isConsultationActive,
  isPaused,
  onStart,
  onPause,
  onResume,
  onEnd,
  timerSeconds,
  consentGiven,
  setConsentGiven,
  currentSpeaker,
  setCurrentSpeaker,
  onOpenTwoDeviceModal,
  onLoadSample,
  onOpenAiDiarize,
  onReset,
}) {
  // Listen for Spacebar key to toggle Doctor / Patient in Single-Device mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        mode === 'single-device' &&
        isConsultationActive &&
        !isPaused &&
        e.code === 'Space' &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setCurrentSpeaker((prev) => (prev === 'Doctor' ? 'Patient' : 'Doctor'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isConsultationActive, isPaused, setCurrentSpeaker]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
      {/* Top Row: Mode Selection & Timer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Speaker Identification Mode:
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMode('two-device')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                mode === 'two-device'
                  ? 'bg-teal-50 border-teal-600 text-teal-800 font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-teal-700" />
              <span>Two-Device (Mobile QR)</span>
            </button>

            <button
              onClick={() => setMode('single-device')}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                mode === 'single-device'
                  ? 'bg-teal-50 border-teal-600 text-teal-800 font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-600" />
              <span>Single-Device (Toggle/Space)</span>
            </button>

            <button
              onClick={() => {
                setMode('ai-diarize');
                onOpenAiDiarize();
              }}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                mode === 'ai-diarize'
                  ? 'bg-teal-50 border-teal-600 text-teal-800 font-semibold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-teal-600" />
              <span>AI Diarization</span>
            </button>
          </div>
        </div>

        {/* Live Timer & Reset */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 text-slate-800 font-mono text-xs rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-bold">{formatTimer(timerSeconds)}</span>
          </div>

          <button
            onClick={onReset}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            title="Reset consultation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Sub-Banner */}
      {mode === 'two-device' && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-teal-900">
            <strong>Star Feature:</strong> Doctor on PC + Patient on Phone via Socket.IO Room.
          </div>
          <button
            onClick={onOpenTwoDeviceModal}
            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-teal-700 text-white rounded-lg font-medium hover:bg-teal-800 transition-colors w-fit"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Open Mobile QR Pairing</span>
          </button>
        </div>
      )}

      {mode === 'single-device' && (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-600">Currently Speaking:</span>
            <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white">
              <button
                type="button"
                onClick={() => setCurrentSpeaker('Doctor')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  currentSpeaker === 'Doctor'
                    ? 'bg-teal-700 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Doctor
              </button>
              <button
                type="button"
                onClick={() => setCurrentSpeaker('Patient')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  currentSpeaker === 'Patient'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Patient
              </button>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
            <Keyboard className="w-3 h-3" /> Press Spacebar to switch speaker
          </span>
        </div>
      )}

      {/* Consent Checkbox */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center space-x-2 text-xs">
        <input
          type="checkbox"
          id="patientConsent"
          checked={consentGiven}
          onChange={(e) => {
            setConsentGiven(e.target.checked);
            if (e.target.checked) {
              logAuditEvent('CONSENT_VERIFIED', 'Patient verbally consented to audio transcription.');
            }
          }}
          disabled={isConsultationActive}
          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
        />
        <label htmlFor="patientConsent" className="text-slate-700 font-medium cursor-pointer">
          Patient has consented to this conversation being recorded and transcribed.
        </label>
      </div>

      {/* Bottom Actions Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        {/* Sample Loader */}
        <select
          onChange={(e) => {
            if (e.target.value) onLoadSample(e.target.value);
            e.target.value = '';
          }}
          defaultValue=""
          className="text-xs bg-slate-50 border border-slate-300 text-slate-700 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium w-full sm:w-auto"
        >
          <option value="" disabled>
            Load Sample Consultation ▾
          </option>
          {SAMPLE_CONSULTATIONS.map((sample) => (
            <option key={sample.id} value={sample.id}>
              {sample.langLabel}: {sample.title.slice(0, 30)}...
            </option>
          ))}
        </select>

        {/* Start / Pause / End Buttons */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {!isConsultationActive ? (
            <button
              onClick={onStart}
              disabled={!consentGiven}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                consentGiven
                  ? 'bg-teal-700 hover:bg-teal-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Consultation</span>
            </button>
          ) : (
            <>
              {!isPaused ? (
                <button
                  onClick={onPause}
                  className="inline-flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="inline-flex items-center space-x-1 px-3 py-2 bg-teal-100 hover:bg-teal-200 text-teal-800 rounded-lg text-xs font-medium transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={onEnd}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>End Consultation</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
