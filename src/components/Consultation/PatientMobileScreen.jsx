import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Mic, MicOff, Activity, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SpeechToTextEngine } from '../../stt';

export function PatientMobileScreen({ roomId }) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [dialogue, setDialogue] = useState([]);
  const [connected, setConnected] = useState(false);
  const [patientName, setPatientName] = useState('Patient');

  const socketRef = useRef(null);
  const sttRef = useRef(null);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.emit('join-room', {
      roomId,
      role: 'patient',
      userName: patientName,
    });

    socketRef.current.on('connect', () => {
      setConnected(true);
    });

    socketRef.current.on('speech-chunk', (chunk) => {
      setDialogue((prev) => [...prev, chunk]);
    });

    // Initialize STT
    sttRef.current = new SpeechToTextEngine({
      language: 'en-IN',
      onResult: ({ interim, final }) => {
        setInterimText(interim);
        if (final && final.trim()) {
          const text = final.trim();
          setDialogue((prev) => [...prev, { speaker: 'Patient', text }]);
          if (socketRef.current) {
            socketRef.current.emit('speech-chunk', {
              roomId,
              speaker: 'Patient',
              text,
              isFinal: true,
            });
          }
        }
      },
      onError: (err) => console.warn('Mobile STT error:', err),
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      if (sttRef.current) sttRef.current.stop();
    };
  }, [roomId, patientName]);

  const toggleMic = () => {
    if (!sttRef.current) return;
    if (isListening) {
      sttRef.current.stop();
      setIsListening(false);
      setInterimText('');
    } else {
      sttRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs text-center space-y-1">
        <div className="flex items-center justify-center space-x-2">
          <Activity className="w-5 h-5 text-teal-700" />
          <h1 className="font-bold text-slate-800 text-base">ClinicNotes Patient Station</h1>
        </div>
        <p className="text-xs text-slate-500">Connected to Consultation Room: <strong className="font-mono text-teal-800">{roomId}</strong></p>
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-emerald-700 pt-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{connected ? 'Paired with Doctor PC' : 'Connecting...'}</span>
        </div>
      </div>

      {/* Live Transcript Bubbles */}
      <div className="flex-1 my-4 bg-white border border-slate-200 rounded-xl p-4 overflow-y-auto space-y-3 max-h-[55vh]">
        {dialogue.length === 0 && !interimText && (
          <div className="text-center py-12 text-slate-400 text-xs">
            Tap the microphone button below to speak directly to your doctor. Your speech will be transcribed in real-time.
          </div>
        )}

        {dialogue.map((turn, i) => (
          <div
            key={i}
            className={`flex flex-col ${turn.speaker === 'Patient' ? 'items-end' : 'items-start'}`}
          >
            <span className="text-[10px] text-slate-400 font-semibold px-1">{turn.speaker}</span>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs ${
                turn.speaker === 'Patient'
                  ? 'bg-slate-800 text-white rounded-br-xs'
                  : 'bg-teal-700 text-white rounded-bl-xs'
              }`}
            >
              {turn.text}
            </div>
          </div>
        ))}

        {interimText && (
          <div className="flex flex-col items-end animate-pulse">
            <span className="text-[10px] text-slate-400">Transcribing...</span>
            <div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-xs italic bg-slate-200 text-slate-700">
              {interimText}
            </div>
          </div>
        )}
      </div>

      {/* Microphone Control Button */}
      <div className="space-y-3">
        <button
          onClick={toggleMic}
          className={`w-full py-4 rounded-xl flex items-center justify-center space-x-2 text-white font-bold text-sm shadow-md transition-all ${
            isListening ? 'bg-red-600 animate-pulse' : 'bg-teal-700 hover:bg-teal-800'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span>Tap to Stop Speaking</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Tap to Speak (Patient Mic)</span>
            </>
          )}
        </button>

        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted WebRTC Audio Session</span>
        </div>
      </div>
    </div>
  );
}
