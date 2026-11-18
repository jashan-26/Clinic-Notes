/**
 * STT (Speech-to-Text) Abstraction Layer
 * Supports:
 *  1. Web Speech API (Native Chromium SpeechRecognition)
 *  2. In-browser Fallback / Audio Simulator (for non-Chromium or mic-denied environments)
 *  3. Multi-language switching: en-IN, en-US, hi-IN
 */

export class SpeechToTextEngine {
  constructor({ language = 'en-IN', onResult, onError, onStatusChange } = {}) {
    this.language = language;
    this.onResult = onResult || (() => {});
    this.onError = onError || (() => {});
    this.onStatusChange = onStatusChange || (() => {});

    this.recognition = null;
    this.isListening = false;
    this.fullTranscript = '';
    this.activeEngine = 'none';

    this.init();
  }

  init() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = this.language;
        this.activeEngine = 'Web Speech API (Native)';

        this.recognition.onstart = () => {
          this.isListening = true;
          this.onStatusChange({ status: 'listening', engine: this.activeEngine });
        };

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscriptChunk = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptChunk += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          if (finalTranscriptChunk) {
            this.fullTranscript += finalTranscriptChunk;
          }

          this.onResult({
            interim: interimTranscript,
            final: finalTranscriptChunk,
            fullTranscript: this.fullTranscript,
          });
        };

        this.recognition.onerror = (event) => {
          console.warn('SpeechRecognition error:', event.error);
          this.onError({
            code: event.error,
            message: this.getFriendlyErrorMessage(event.error),
          });
        };

        this.recognition.onend = () => {
          // If intentionally listening, restart continuous session (browser often auto-stops on silence)
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch (e) {
              this.isListening = false;
              this.onStatusChange({ status: 'idle', engine: this.activeEngine });
            }
          } else {
            this.onStatusChange({ status: 'idle', engine: this.activeEngine });
          }
        };
      } catch (e) {
        console.warn('Could not initialize Web Speech API, using fallback engine.', e);
        this.activeEngine = 'Fallback Engine';
      }
    } else {
      this.activeEngine = 'Fallback Engine (Web Speech Not Available)';
    }
  }

  setLanguage(langCode) {
    this.language = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
      if (this.isListening) {
        this.recognition.stop();
        setTimeout(() => {
          try {
            this.recognition.start();
          } catch (e) {}
        }, 150);
      }
    }
  }

  start() {
    this.isListening = true;
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (err) {
        // Recognition already active
      }
    } else {
      // Fallback engine simulation
      this.onStatusChange({ status: 'listening', engine: this.activeEngine });
    }
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {}
    }
    this.onStatusChange({ status: 'idle', engine: this.activeEngine });
  }

  clear() {
    this.fullTranscript = '';
    this.onResult({
      interim: '',
      final: '',
      fullTranscript: '',
    });
  }

  setTranscript(text) {
    this.fullTranscript = text;
    this.onResult({
      interim: '',
      final: '',
      fullTranscript: text,
    });
  }

  getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
      case 'not-allowed':
        return 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
      case 'no-speech':
        return 'No speech was detected. Please check your microphone volume.';
      case 'audio-capture':
        return 'No microphone was found on this device.';
      case 'network':
        return 'Network issue prevented speech recognition. Check internet connection.';
      default:
        return `Speech recognition error: ${errorCode}`;
    }
  }
}
