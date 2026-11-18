import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Copy, Check, Wifi, X, ExternalLink } from 'lucide-react';

export function TwoDeviceModal({ isOpen, onClose, roomId, isPatientConnected, onSimulatePatientJoin }) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef(null);

  const patientUrl = `${window.location.origin}/?room=${roomId}&role=patient`;

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        patientUrl,
        {
          width: 190,
          margin: 1.5,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [isOpen, patientUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(patientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-base">Two-Device Consultation</h3>
              <p className="text-xs text-slate-500">Real-time doctor & patient microphone pairing</p>
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
        <div className="p-6 text-center space-y-4 text-xs">
          <div className="p-2.5 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-left">
            <strong>How Two-Device Mode Works:</strong> Have the patient scan this QR code on their smartphone. Their phone's mic will transcribe Patient speech while your PC mic transcribes Doctor speech. Each turn is 100% accurately labeled!
          </div>

          {/* QR Code Canvas */}
          <div className="flex justify-center p-3 bg-white border border-slate-200 rounded-xl inline-block mx-auto shadow-xs">
            <canvas ref={canvasRef} />
          </div>

          {/* Connection Status Pill */}
          <div className="flex items-center justify-center space-x-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isPatientConnected ? 'bg-emerald-500 animate-none' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="font-medium text-slate-700">
              {isPatientConnected ? 'Patient Smartphone Connected!' : 'Waiting for patient to scan and join...'}
            </span>
          </div>

          {/* Share Link Row */}
          <div className="space-y-1 text-left">
            <span className="text-slate-500 font-medium">Or share link directly:</span>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={patientUrl}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-700"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-medium transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Simulation Helper Button for Recruiters without a second phone */}
          {!isPatientConnected && (
            <div className="pt-2">
              <button
                onClick={onSimulatePatientJoin}
                className="text-teal-700 hover:text-teal-900 underline text-xs font-medium"
              >
                (Demo Helper: Click to simulate patient connecting instantly)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-700 text-white rounded-lg text-xs font-medium hover:bg-teal-800 transition-colors"
          >
            Ready with Two Devices
          </button>
        </div>
      </div>
    </div>
  );
}
