import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';

const VoiceInput = ({ onTranscript, lang = 'English' }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;

    // Apply language locales dynamically
    if (lang === 'Telugu' || lang === 'తెలుగు') {
      rec.lang = 'te-IN';
    } else if (lang === 'Hindi' || lang === 'हिन्दी') {
      rec.lang = 'hi-IN';
    } else {
      rec.lang = 'en-IN'; // Indian English
    }

    rec.onstart = () => {
      setIsListening(true);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    rec.onresult = (event) => {
      const resultText = event.results[0][0].transcript;
      if (onTranscript) {
        onTranscript(resultText);
      }
    };

    setRecognition(rec);
  }, [lang, onTranscript]);

  const toggleListening = () => {
    if (!supported) {
      alert("Speech recognition is not fully supported in this browser. For best results, use Google Chrome.");
      return;
    }
    
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={toggleListening}
        className={`p-3 rounded-xl flex items-center justify-center transition-all duration-300 transform active:scale-95 border ${
          isListening
            ? 'bg-red-500 text-white animate-pulse border-red-600 shadow-lg shadow-red-500/30'
            : 'bg-white hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 shadow-sm'
        }`}
        title={isListening ? 'Stop Listening' : 'Speak Complaint'}
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5 text-primary-500" />
        )}
      </button>
      {isListening && (
        <span className="text-xs font-semibold text-red-500 animate-pulse bg-red-50 dark:bg-red-950/20 px-2.5 py-1 rounded-full border border-red-100 dark:border-red-950/40">
          Listening... Speak now
        </span>
      )}
    </div>
  );
};

export default VoiceInput;
