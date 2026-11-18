import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  Edit3,
  Check,
  RotateCcw,
  BookOpen,
  Filter,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { SpeechToTextEngine } from '../../stt';
import { SAMPLE_DOCTOR_NOTES } from '../../utils/sampleData';
import { PhiScrubber } from '../../utils/phiScrubber';
import { logAuditEvent } from '../Common/AuditLogModal';

export function TranscriptPanel({
  transcript,
  setTranscript,
  spans,
  setSpans,
  onSummarize,
  isSummarizing,
  selectedLanguage,
  setSelectedLanguage,
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [sttEngineName, setSttEngineName] = useState('Web Speech API');

  // Active Highlight Filters (all true by default)
  const [activeFilters, setActiveFilters] = useState({
    history: true,
    medication: true,
    test_treatment: true,
    phi: true,
  });

  const sttRef = useRef(null);

  // Initialize STT Engine
  useEffect(() => {
    sttRef.current = new SpeechToTextEngine({
      language: selectedLanguage,
      onResult: ({ interim, final, fullTranscript }) => {
        setInterimText(interim);
        if (final || fullTranscript) {
          setTranscript(fullTranscript);
        }
      },
      onError: (err) => {
        setStatusMessage(err.message);
      },
      onStatusChange: ({ status, engine }) => {
        setIsListening(status === 'listening');
        if (engine) setSttEngineName(engine);
      },
    });

    return () => {
      if (sttRef.current) sttRef.current.stop();
    };
  }, []);

  // Update STT language when dropdown changes
  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    if (sttRef.current) {
      sttRef.current.setLanguage(langCode);
    }
  };

  const toggleListening = () => {
    setStatusMessage(null);
    if (!sttRef.current) return;

    if (isListening) {
      sttRef.current.stop();
      setIsListening(false);
      setInterimText('');
      // Auto-analyze upon stopping dictation
      if (transcript && transcript.length > 20) {
        triggerAnalyzeNotes(transcript);
      }
    } else {
      sttRef.current.start();
      setIsListening(true);
      logAuditEvent('DICTATION_STARTED', `Speech recognition started with language ${selectedLanguage}`);
    }
  };

  const handleClearTranscript = () => {
    if (transcript && window.confirm('Clear current transcript?')) {
      setTranscript('');
      setInterimText('');
      setSpans([]);
      if (sttRef.current) sttRef.current.clear();
    }
  };

  const loadSampleNote = (sampleId) => {
    const sample = SAMPLE_DOCTOR_NOTES.find((s) => s.id === sampleId);
    if (sample) {
      setTranscript(sample.text);
      setInterimText('');
      if (sttRef.current) sttRef.current.setTranscript(sample.text);
      setSelectedLanguage(sample.language);
      triggerAnalyzeNotes(sample.text);
      logAuditEvent('SAMPLE_NOTE_LOADED', `Loaded demo note: ${sample.title}`);
    }
  };

  // Trigger Analyze Spans via Claude API with Privacy Shield
  const triggerAnalyzeNotes = async (textToAnalyze) => {
    const text = textToAnalyze || transcript;
    if (!text || text.trim().length === 0) return;

    setIsAnalyzing(true);
    setStatusMessage(null);

    try {
      // 1. Scrub PHI locally on device
      const { scrubbedText, mapping } = PhiScrubber.scrub(text);

      // 2. Call backend proxy
      const response = await fetch('/api/analyze-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: scrubbedText,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) throw new Error('Analysis API request failed');
      const data = await response.json();

      if (data && Array.isArray(data.spans)) {
        // 3. Restore original PHI tokens in returned spans
        const restoredSpans = data.spans.map((span) => ({
          ...span,
          text: PhiScrubber.restore(span.text, mapping),
        }));
        setSpans(restoredSpans);
        logAuditEvent('NOTE_ANALYZED', `Categorized ${restoredSpans.length} clinical spans`);
      }
    } catch (err) {
      console.warn('Note analysis error, falling back locally:', err);
      // Fallback local span generation
      const { scrubbedText, mapping } = PhiScrubber.scrub(text);
      setSpans([{ text, category: 'normal' }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleFilter = (category) => {
    setActiveFilters((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-teal-700" />
          <div>
            <h2 className="font-bold text-slate-800 text-base">Live Clinical Dictation</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-500">Engine:</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {sttEngineName}
              </span>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Language Selector */}
          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium"
            title="Speech recognition & transcript language"
          >
            <option value="en-IN">English (India)</option>
            <option value="en-US">English (US)</option>
            <option value="hi-IN">Hindi (हिंदी)</option>
          </select>

          {/* Sample Note Loader */}
          <select
            onChange={(e) => {
              if (e.target.value) loadSampleNote(e.target.value);
              e.target.value = '';
            }}
            defaultValue=""
            className="text-xs bg-teal-50 border border-teal-200 text-teal-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-600 font-medium"
          >
            <option value="" disabled>
              Load Sample Note ▾
            </option>
            {SAMPLE_DOCTOR_NOTES.map((sample) => (
              <option key={sample.id} value={sample.id}>
                {sample.langLabel}: {sample.title.slice(0, 30)}...
              </option>
            ))}
          </select>

          {/* Clear button */}
          {transcript && (
            <button
              onClick={handleClearTranscript}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Clear transcript"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Color Legend & Category Filter Bar */}
      <div className="py-3 flex flex-wrap items-center gap-2 text-xs border-b border-slate-100">
        <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px] mr-1">
          <Filter className="w-3 h-3" /> Filters:
        </span>

        {/* History */}
        <button
          onClick={() => toggleFilter('history')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
            activeFilters.history
              ? 'bg-[#DCFCE7] text-emerald-900 border-emerald-300'
              : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
          }`}
          title="Click to toggle Medical History highlight"
        >
          Medical History
        </button>

        {/* Medication */}
        <button
          onClick={() => toggleFilter('medication')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
            activeFilters.medication
              ? 'bg-[#FEF9C3] text-amber-900 border-amber-300'
              : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
          }`}
          title="Click to toggle Medications highlight"
        >
          Medications Prescribed
        </button>

        {/* Tests & Treatments */}
        <button
          onClick={() => toggleFilter('test_treatment')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
            activeFilters.test_treatment
              ? 'bg-[#DBEAFE] text-blue-900 border-blue-300'
              : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
          }`}
          title="Click to toggle Tests & Treatments highlight"
        >
          Tests & Treatments
        </button>

        {/* PHI (Red Font Only) */}
        <button
          onClick={() => toggleFilter('phi')}
          className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-all ${
            activeFilters.phi
              ? 'text-[#DC2626] bg-red-50/70 border-red-200'
              : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60'
          }`}
          title="Click to toggle Protected Health Information (PHI) font styling"
        >
          PHI (Protected Health Info)
        </button>
      </div>

      {/* Transcript Viewport */}
      <div className="relative flex-1 min-h-[220px] max-h-[340px] overflow-y-auto my-3 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm leading-relaxed">
        {statusMessage && (
          <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {isEditMode ? (
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            className="w-full h-full min-h-[200px] bg-white p-3 rounded border border-slate-300 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-teal-600 font-sans leading-relaxed"
            placeholder="Type or edit clinical notes here..."
          />
        ) : (
          <div className="whitespace-pre-wrap font-sans text-slate-800">
            {spans && spans.length > 0 ? (
              // Render Categorized Spans
              spans.map((span, idx) => {
                const cat = span.category;
                let className = '';

                if (cat === 'history' && activeFilters.history) {
                  className = 'bg-[#DCFCE7] text-emerald-950 px-1 py-0.5 rounded-xs mx-0.5';
                } else if (cat === 'medication' && activeFilters.medication) {
                  className = 'bg-[#FEF9C3] text-amber-950 px-1 py-0.5 rounded-xs mx-0.5 font-medium';
                } else if (cat === 'test_treatment' && activeFilters.test_treatment) {
                  className = 'bg-[#DBEAFE] text-blue-950 px-1 py-0.5 rounded-xs mx-0.5';
                } else if (cat === 'phi' && activeFilters.phi) {
                  className = 'text-[#DC2626] font-semibold'; // RED FONT ONLY, NO BG
                }

                return (
                  <span key={idx} className={className}>
                    {span.text}
                  </span>
                );
              })
            ) : transcript ? (
              <span>{transcript}</span>
            ) : (
              <span className="text-slate-400 italic">
                Press "Start Dictation" or click "Load Sample Note" to populate the clinical transcript. Speech will convert to text in real-time.
              </span>
            )}

            {/* Interim live speech recognition text */}
            {interimText && (
              <span className="text-slate-400 italic pl-1 animate-pulse">
                {interimText}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Mic Toggle Button */}
          <button
            onClick={toggleListening}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
              isListening
                ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                : 'bg-teal-700 hover:bg-teal-800 text-white'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Dictation</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Start Dictation</span>
              </>
            )}
          </button>

          {/* Edit Mode Toggle */}
          <button
            onClick={() => {
              if (isEditMode) {
                setIsEditMode(false);
                triggerAnalyzeNotes(transcript);
              } else {
                setIsEditMode(true);
              }
            }}
            className="inline-flex items-center space-x-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            {isEditMode ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Save Edit</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Text</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {/* Analyze Notes Button */}
          <button
            onClick={() => triggerAnalyzeNotes(transcript)}
            disabled={!transcript || isAnalyzing}
            className={`inline-flex items-center space-x-1.5 px-3 py-2.5 border rounded-lg text-xs font-medium transition-colors ${
              !transcript || isAnalyzing
                ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAnalyzing ? 'Tagging...' : 'Analyze Notes'}</span>
          </button>

          {/* Summarize Button */}
          <button
            onClick={onSummarize}
            disabled={!transcript || isSummarizing}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
              !transcript || isSummarizing
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isSummarizing ? 'Generating Summary...' : 'Summarize Notes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
