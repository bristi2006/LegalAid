import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, AlertCircle, Loader } from "lucide-react";
import api from "../services/api";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  language: string;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  language,
  disabled = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Mode: "speech_api" or "media_recorder"
  const [mode, setMode] = useState<"speech_api" | "media_recorder">("speech_api");

  // Web Speech API refs
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);

  // MediaRecorder refs (Fallback)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isHindi = language.trim().toLowerCase() === "hindi";
  const isHinglish = language.trim().toLowerCase() === "hinglish";

  // Keep onTranscript ref updated without causing effect re-runs
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  // Keep isListeningRef in sync
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMode("media_recorder");
      return;
    }

    try {
      const instance = new SpeechRecognition();
      instance.continuous = true;
      instance.interimResults = true;
      instance.lang = isHindi ? "hi-IN" : "en-IN";

      instance.onresult = (event: any) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk + " ";
          }
        }
        if (finalTranscript.trim()) {
          onTranscriptRef.current(finalTranscript.trim());
        }
      };

      instance.onerror = (event: any) => {
        console.warn("Web Speech API error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setErrorMsg(
            isHindi
              ? "माइक की अनुमति नहीं मिली।"
              : "Microphone permission denied."
          );
          setIsListening(false);
        } else if (event.error === "network" || event.error === "aborted") {
          // Switch to MediaRecorder fallback
          console.info("Switching to MediaRecorder audio transcription mode...");
          setMode("media_recorder");
          setIsListening(false);
        }
      };

      instance.onend = () => {
        // Auto restart if user intended to keep listening
        if (isListeningRef.current) {
          try {
            instance.start();
          } catch {
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = instance;
    } catch (err) {
      console.warn("Failed to init Web Speech API, using MediaRecorder fallback:", err);
      setMode("media_recorder");
    }

    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
    };
  }, [language, isHindi]);

  // ─── Web Speech API Handler ──────────────────────────────────────────────
  const toggleSpeechApi = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      isListeningRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      setIsListening(false);
    } else {
      setErrorMsg(null);
      isListeningRef.current = true;
      try {
        recognitionRef.current.lang = isHindi ? "hi-IN" : "en-IN";
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        console.warn("Could not start Web Speech API, trying MediaRecorder fallback", err);
        setMode("media_recorder");
        startMediaRecorder();
      }
    }
  };

  // ─── MediaRecorder Fallback Handlers ─────────────────────────────────────
  const startMediaRecorder = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) return;

        setIsTranscribing(true);
        try {
          const res = await api.transcribeAudio(audioBlob, language);
          if (res.text?.trim()) {
            onTranscriptRef.current(res.text.trim());
          } else {
            setErrorMsg(
              isHindi
                ? "कोई आवाज नहीं पहचानी गई।"
                : "No clear speech recognized."
            );
          }
        } catch (err: any) {
          console.error("Audio transcription failed:", err);
          setErrorMsg(
            isHindi
              ? "ऑडियो ट्रांसक्रिप्शन विफल रहा।"
              : "Audio transcription failed. Please try again."
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsListening(true);
    } catch (err) {
      console.error("Microphone access failed:", err);
      setErrorMsg(
        isHindi
          ? "माइक एक्सेस की अनुमति नहीं मिली।"
          : "Microphone access denied. Check permissions."
      );
    }
  };

  const stopMediaRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  };

  const handleClick = () => {
    if (isTranscribing) return;

    if (mode === "speech_api") {
      toggleSpeechApi();
    } else {
      if (isListening) {
        stopMediaRecorder();
      } else {
        startMediaRecorder();
      }
    }
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isTranscribing}
        title={
          isListening
            ? isHindi
              ? "रिकॉर्डिंग बंद करें"
              : "Stop Voice Recording"
            : isHindi
            ? "बोलकर शिकायत दर्ज करें"
            : "Click to Speak Grievance"
        }
        className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer shadow-sm ${
          isTranscribing
            ? "bg-amber-100 text-amber-800 border border-amber-300"
            : isListening
            ? "bg-rose-600 text-white hover:bg-rose-700 ring-2 ring-rose-300 animate-pulse"
            : "bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300"
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isTranscribing ? (
          <>
            <Loader className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>{isHindi ? "प्रोसेसिंग..." : "Transcribing Audio..."}</span>
          </>
        ) : isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <MicOff className="w-3.5 h-3.5" />
            <span>{isHindi ? "सुन रहा है... (रोकें)" : "Listening... (Click Stop)"}</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {isHindi
                ? "🎤 बोलकर शिकायत दर्ज करें"
                : isHinglish
                ? "🎤 Bolkar bataein"
                : "🎤 Speak Grievance"}
            </span>
          </>
        )}
      </button>

      {errorMsg && (
        <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
          <AlertCircle className="w-3 h-3 shrink-0" />
          {errorMsg}
        </span>
      )}
    </div>
  );
};
