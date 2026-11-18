import React, { useState } from 'react';
import { User, Stethoscope, Plus, Edit2, Check, RefreshCw } from 'lucide-react';

export function ChatBubbleList({
  dialogue,
  setDialogue,
  currentSpeaker,
  interimText,
  isListening,
}) {
  const [newTurnText, setNewTurnText] = useState('');
  const [newTurnSpeaker, setNewTurnSpeaker] = useState('Doctor');

  const handleAddManualTurn = (e) => {
    e.preventDefault();
    if (!newTurnText.trim()) return;

    setDialogue((prev) => [
      ...prev,
      {
        speaker: newTurnSpeaker,
        text: newTurnText.trim(),
        timestamp: Date.now(),
      },
    ]);
    setNewTurnText('');
  };

  const toggleTurnSpeaker = (idx) => {
    setDialogue((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        speaker: copy[idx].speaker === 'Doctor' ? 'Patient' : 'Doctor',
      };
      return copy;
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col h-full">
      {/* List Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Real-Time Dialogue Transcript</h3>
          <p className="text-xs text-slate-500">Live chat turns categorized by speaker</p>
        </div>

        {/* Live Speaking Indicator */}
        {isListening && (
          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span className="text-slate-600">Active Speaker:</span>
            <span className="font-bold text-teal-800">{currentSpeaker}</span>
          </div>
        )}
      </div>

      {/* Chat Bubbles Viewport */}
      <div className="flex-1 min-h-[300px] max-h-[460px] overflow-y-auto p-4 space-y-4 bg-slate-50/60 rounded-lg border border-slate-200 my-3">
        {dialogue.length === 0 && !interimText && (
          <div className="p-8 text-center text-xs text-slate-400">
            <p className="font-semibold text-slate-600">No Dialogue Recorded Yet</p>
            <p className="mt-1">
              Select a mode, check the consent box, and press "Start Consultation". You can also click "Load Sample" to view a simulated clinical encounter.
            </p>
          </div>
        )}

        {/* Render Dialogue Turns */}
        {dialogue.map((turn, idx) => {
          const isDoctor = turn.speaker === 'Doctor';
          return (
            <div
              key={idx}
              className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'} space-y-1`}
            >
              {/* Speaker Label with Re-tag button */}
              <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 px-1">
                {isDoctor ? (
                  <>
                    <button
                      onClick={() => toggleTurnSpeaker(idx)}
                      className="hover:underline flex items-center gap-1 font-semibold text-teal-800"
                      title="Click to switch speaker label"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                      <span>Doctor</span>
                      <RefreshCw className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => toggleTurnSpeaker(idx)}
                      className="hover:underline flex items-center gap-1 font-semibold text-slate-800"
                      title="Click to switch speaker label"
                    >
                      <User className="w-3.5 h-3.5 text-slate-600" />
                      <span>Patient</span>
                      <RefreshCw className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  </>
                )}
                {turn.confidence && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({Math.round(turn.confidence * 100)}% conf)
                  </span>
                )}
              </div>

              {/* Chat Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                  isDoctor
                    ? 'bg-teal-700 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {turn.text}
              </div>
            </div>
          );
        })}

        {/* Live Interim Speech Bubble */}
        {interimText && (
          <div
            className={`flex flex-col ${
              currentSpeaker === 'Doctor' ? 'items-end' : 'items-start'
            } space-y-1 animate-pulse`}
          >
            <span className="text-[11px] text-slate-400 font-medium px-1">
              {currentSpeaker} (transcribing...)
            </span>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-xs leading-relaxed italic ${
                currentSpeaker === 'Doctor'
                  ? 'bg-teal-600/80 text-white'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              {interimText}
            </div>
          </div>
        )}
      </div>

      {/* Manual Input Bar */}
      <form onSubmit={handleAddManualTurn} className="pt-2 flex items-center space-x-2">
        <select
          value={newTurnSpeaker}
          onChange={(e) => setNewTurnSpeaker(e.target.value)}
          className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-teal-600"
        >
          <option value="Doctor">Doctor</option>
          <option value="Patient">Patient</option>
        </select>

        <input
          type="text"
          value={newTurnText}
          onChange={(e) => setNewTurnText(e.target.value)}
          placeholder="Type or paste dialogue line manually..."
          className="flex-1 text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-600"
        />

        <button
          type="submit"
          disabled={!newTurnText.trim()}
          className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            newTurnText.trim()
              ? 'bg-slate-800 hover:bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>
    </div>
  );
}
