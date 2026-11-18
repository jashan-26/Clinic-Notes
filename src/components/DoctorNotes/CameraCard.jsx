import React, { useState, useRef, useEffect } from 'react';
import { Camera, CameraOff, Video, Square, Download, AlertCircle } from 'lucide-react';

export function CameraCard() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const startCamera = async () => {
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });

      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn('Camera access error:', err);
      if (err.name === 'NotAllowedError') {
        setErrorMessage('Camera access was denied. Please allow camera permissions in browser settings.');
      } else {
        setErrorMessage('Camera or microphone hardware could not be initialized.');
      }
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (isRecording) {
      stopRecording();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startRecording = () => {
    if (!mediaStreamRef.current) {
      startCamera();
      return;
    }

    recordedChunksRef.current = [];
    setRecordedVideoUrl(null);

    try {
      const options = { mimeType: 'video/webm;codecs=vp8,opus' };
      let recorder;
      try {
        recorder = new MediaRecorder(mediaStreamRef.current, options);
      } catch (e) {
        recorder = new MediaRecorder(mediaStreamRef.current);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      setErrorMessage('MediaRecorder failed to start on this browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Camera className="w-4 h-4 text-teal-700" />
          <h3 className="font-semibold text-slate-800 text-sm">Doctor Consultation Camera</h3>
        </div>
        {isRecording && (
          <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-xs font-mono font-medium">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span>REC {formatTimer(recordingSeconds)}</span>
          </div>
        )}
      </div>

      {/* Video Viewport */}
      <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform -scale-x-100 ${!isCameraActive ? 'hidden' : ''}`}
        />

        {!isCameraActive && (
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-2">
              <CameraOff className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-300 font-medium">Camera is currently turned off</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Start camera for live clinical recording</p>
          </div>
        )}

        {/* Recording Overlay Watermark */}
        {isRecording && (
          <div className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
            CLINICNOTES • {new Date().toLocaleDateString('en-IN')}
          </div>
        )}
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Controls Bar */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Start Camera</span>
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <CameraOff className="w-3.5 h-3.5" />
              <span>Stop Camera</span>
            </button>
          )}

          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={!isCameraActive}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isCameraActive
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Record Video</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Recording</span>
            </button>
          )}
        </div>

        {recordedVideoUrl && (
          <a
            href={recordedVideoUrl}
            download={`ClinicNotes_Dictation_${Date.now()}.webm`}
            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .webm</span>
          </a>
        )}
      </div>
    </div>
  );
}
