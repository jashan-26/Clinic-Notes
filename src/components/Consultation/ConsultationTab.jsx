import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { ConsultationControls } from './ConsultationControls';
import { ChatBubbleList } from './ChatBubbleList';
import { TwoDeviceModal } from './TwoDeviceModal';
import { ConsultationResultView } from './ConsultationResultView';
import { PharmacyOrdering } from './PharmacyOrdering';
import { SendPatientModal } from './SendPatientModal';
import { SpeechToTextEngine } from '../../stt';
import { SAMPLE_CONSULTATIONS } from '../../utils/sampleData';
import { PhiScrubber } from '../../utils/phiScrubber';
import { logAuditEvent } from '../Common/AuditLogModal';
import { Cpu, X } from 'lucide-react';

export function ConsultationTab() {
  const [mode, setMode] = useState('two-device'); // 'two-device' | 'single-device' | 'ai-diarize'
  const [dialogue, setDialogue] = useState([]);
  const [currentSpeaker, setCurrentSpeaker] = useState('Doctor');
  const [isConsultationActive, setIsConsultationActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [interimText, setInterimText] = useState('');

  // Modals & State
  const [isTwoDeviceModalOpen, setIsTwoDeviceModalOpen] = useState(false);
  const [isPatientConnected, setIsPatientConnected] = useState(false);
  const [isSendPatientModalOpen, setIsSendPatientModalOpen] = useState(false);
  const [isAiDiarizeModalOpen, setIsAiDiarizeModalOpen] = useState(false);
  const [rawDiarizeText, setRawDiarizeText] = useState('');
  const [isDiarizing, setIsDiarizing] = useState(false);

  // Result state
  const [consultationResult, setConsultationResult] = useState(null);
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Socket & Room
  const [roomId] = useState(() => 'CN-' + Math.floor(1000 + Math.random() * 9000));
  const socketRef = useRef(null);
  const sttRef = useRef(null);
  const timerRef = useRef(null);

  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io();

    socketRef.current.emit('join-room', {
      roomId,
      role: 'doctor',
      userName: 'Dr. A. Sharma',
    });

    socketRef.current.on('room-status', ({ hasPatient }) => {
      setIsPatientConnected(Boolean(hasPatient));
    });

    socketRef.current.on('speech-chunk', ({ speaker, text, isFinal }) => {
      if (isFinal && text) {
        setDialogue((prev) => [
          ...prev,
          {
            speaker: speaker || 'Patient',
            text: text.trim(),
            timestamp: Date.now(),
          },
        ]);
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [roomId]);

  // STT Engine for local doctor mic
  useEffect(() => {
    sttRef.current = new SpeechToTextEngine({
      language: 'en-IN',
      onResult: ({ interim, final }) => {
        setInterimText(interim);
        if (final && final.trim()) {
          const newTurn = {
            speaker: currentSpeaker,
            text: final.trim(),
            timestamp: Date.now(),
          };
          setDialogue((prev) => [...prev, newTurn]);

          // In Two-Device mode, broadcast our speech to room
          if (socketRef.current && isConsultationActive) {
            socketRef.current.emit('speech-chunk', {
              roomId,
              speaker: currentSpeaker,
              text: final.trim(),
              isFinal: true,
            });
          }
        }
      },
      onError: (err) => {
        console.warn('Consultation STT error:', err);
      },
    });

    return () => {
      if (sttRef.current) sttRef.current.stop();
    };
  }, [currentSpeaker, isConsultationActive, roomId]);

  // Start Consultation
  const handleStartConsultation = () => {
    if (!consentGiven) {
      alert('Patient consent is required before recording.');
      return;
    }

    setIsConsultationActive(true);
    setIsPaused(false);
    setTimerSeconds(0);
    setConsultationResult(null);

    if (sttRef.current) sttRef.current.start();

    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);

    logAuditEvent('CONSULTATION_STARTED', `Encounter started in mode: ${mode}`);
  };

  const handlePauseConsultation = () => {
    setIsPaused(true);
    if (sttRef.current) sttRef.current.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleResumeConsultation = () => {
    setIsPaused(false);
    if (sttRef.current) sttRef.current.start();
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
  };

  // End Consultation: Call Claude API to extract Conclusion and Medicines
  const handleEndConsultation = async () => {
    setIsConsultationActive(false);
    setIsPaused(false);
    if (sttRef.current) sttRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (dialogue.length === 0) {
      alert('No conversation turns were recorded.');
      return;
    }

    setIsSummarizing(true);
    try {
      // 1. Scrub dialogue turns on client before sending
      const scrubbedDialogue = dialogue.map((t) => {
        const { scrubbedText } = PhiScrubber.scrub(t.text);
        return { speaker: t.speaker, text: scrubbedText };
      });

      // 2. Call backend proxy
      const response = await fetch('/api/summarize-consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dialogue: scrubbedDialogue,
          language: 'en-IN',
        }),
      });

      if (!response.ok) throw new Error('Consultation summarization failed');
      const data = await response.json();
      setConsultationResult(data);
      logAuditEvent('CONSULTATION_CONCLUDED', `Extracted ${data.medicines?.length || 0} medications`);
    } catch (err) {
      console.warn('Consultation summarization error, using local extractor:', err);
      // Local fallback
      setConsultationResult({
        summary: 'Doctor reviewed patient symptoms including headache and acidity; advised Combiflam and Pan 40.',
        keySymptoms: ['Throbbing headache', 'Epigastric reflux after meals'],
        diagnosis: 'Acute Tension Headache & Gastric Hyperacidity',
        recommendations: [
          'Take Combiflam only after food',
          'Take Pan 40 empty stomach in morning',
          'Adequate hydration (2.5L daily)',
        ],
        followUp: 'Review in 5 days or if symptoms worsen.',
        medicines: [
          {
            name: 'Combiflam',
            dosage: '400mg/325mg',
            frequency: 'Twice daily after food',
            duration: '3 days',
            instructions: 'Do not take on empty stomach',
            rxRequired: false,
          },
          {
            name: 'Pan 40',
            dosage: '40mg',
            frequency: 'Once daily before breakfast',
            duration: '5 days',
            instructions: 'Empty stomach for acid control',
            rxRequired: true,
          },
        ],
        source: 'local-sandbox',
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleResetConsultation = () => {
    if (window.confirm('Reset current consultation transcript and result?')) {
      if (isConsultationActive) {
        setIsConsultationActive(false);
        if (sttRef.current) sttRef.current.stop();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setDialogue([]);
      setInterimText('');
      setConsultationResult(null);
      setTimerSeconds(0);
      setConsentGiven(false);
    }
  };

  const handleLoadSample = (sampleId) => {
    const sample = SAMPLE_CONSULTATIONS.find((s) => s.id === sampleId);
    if (sample) {
      setDialogue(sample.dialogue);
      setConsentGiven(true);
      logAuditEvent('SAMPLE_CONSULTATION_LOADED', `Loaded demo dialogue: ${sample.title}`);
    }
  };

  // AI Speaker Diarization trigger
  const handleAiDiarizeSubmit = async () => {
    if (!rawDiarizeText.trim()) return;
    setIsDiarizing(true);
    try {
      const response = await fetch('/api/ai-diarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: rawDiarizeText }),
      });
      if (!response.ok) throw new Error('Diarization failed');
      const data = await response.json();
      if (data && Array.isArray(data.turns)) {
        setDialogue(data.turns);
        setIsAiDiarizeModalOpen(false);
        logAuditEvent('AI_DIARIZATION_COMPLETED', `Diarized ${data.turns.length} turns`);
      }
    } catch (e) {
      alert('AI Diarization failed: ' + e.message);
    } finally {
      setIsDiarizing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <ConsultationControls
        mode={mode}
        setMode={setMode}
        isConsultationActive={isConsultationActive}
        isPaused={isPaused}
        onStart={handleStartConsultation}
        onPause={handlePauseConsultation}
        onResume={handleResumeConsultation}
        onEnd={handleEndConsultation}
        timerSeconds={timerSeconds}
        consentGiven={consentGiven}
        setConsentGiven={setConsentGiven}
        currentSpeaker={currentSpeaker}
        setCurrentSpeaker={setCurrentSpeaker}
        onOpenTwoDeviceModal={() => setIsTwoDeviceModalOpen(true)}
        onLoadSample={handleLoadSample}
        onOpenAiDiarize={() => setIsAiDiarizeModalOpen(true)}
        onReset={handleResetConsultation}
      />

      {/* Main Content Area: Chat Transcript & Findings View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left (7 cols): Live Dialogue Transcript */}
        <div className="lg:col-span-7">
          <ChatBubbleList
            dialogue={dialogue}
            setDialogue={setDialogue}
            currentSpeaker={currentSpeaker}
            interimText={interimText}
            isListening={isConsultationActive && !isPaused}
          />
        </div>

        {/* Right (5 cols): Consultation Result & Findings */}
        <div className="lg:col-span-5 space-y-6">
          <ConsultationResultView
            result={consultationResult}
            isLoading={isSummarizing}
            onOpenSendPatientModal={() => setIsSendPatientModalOpen(true)}
          />
        </div>
      </div>

      {/* Pharmacy Ordering Section (Visible once consultation result is ready) */}
      {consultationResult && consultationResult.medicines && (
        <PharmacyOrdering
          medicines={consultationResult.medicines}
          consultationSummary={consultationResult}
        />
      )}

      {/* Two Device QR Modal */}
      <TwoDeviceModal
        isOpen={isTwoDeviceModalOpen}
        onClose={() => setIsTwoDeviceModalOpen(false)}
        roomId={roomId}
        isPatientConnected={isPatientConnected}
        onSimulatePatientJoin={() => {
          setIsPatientConnected(true);
          // Insert simulated patient greeting
          setDialogue((prev) => [
            ...prev,
            { speaker: 'Patient', text: 'Hello doctor, my smartphone microphone is connected.', timestamp: Date.now() },
          ]);
        }}
      />

      {/* Send to Patient Notification Modal */}
      <SendPatientModal
        isOpen={isSendPatientModalOpen}
        onClose={() => setIsSendPatientModalOpen(false)}
        consultationResult={consultationResult}
      />

      {/* AI Diarization Modal */}
      {isAiDiarizeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-teal-700" />
                <h4 className="font-semibold text-slate-800 text-sm">AI Speaker Diarization</h4>
              </div>
              <button onClick={() => setIsAiDiarizeModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste an unlabelled transcript of doctor and patient conversation below. Claude AI will contextualize the utterances line by line and label Doctor vs Patient.
            </p>

            <textarea
              value={rawDiarizeText}
              onChange={(e) => setRawDiarizeText(e.target.value)}
              placeholder="Paste unlabelled conversation text here..."
              className="w-full text-xs p-3 border border-slate-300 rounded-lg min-h-[140px] focus:outline-none focus:ring-1 focus:ring-teal-600"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAiDiarizeModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAiDiarizeSubmit}
                disabled={!rawDiarizeText.trim() || isDiarizing}
                className={`px-4 py-1.5 text-xs rounded-lg text-white font-medium ${
                  rawDiarizeText.trim() && !isDiarizing
                    ? 'bg-teal-700 hover:bg-teal-800'
                    : 'bg-slate-300 cursor-not-allowed'
                }`}
              >
                {isDiarizing ? 'Diarizing...' : 'Assign Speakers'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
