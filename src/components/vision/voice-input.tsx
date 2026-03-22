"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
}

// Check SpeechRecognition support
function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionInstance)
    | null;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionEvent {
  results: Array<{
    0: { transcript: string };
    isFinal: boolean;
    length: number;
  }>;
  resultIndex: number;
}

export function VoiceInput({ onTranscript, placeholder = "Speak to add food..." }: VoiceInputProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognitionClass = getSpeechRecognition();
    setSupported(SpeechRecognitionClass !== null);
  }, []);

  function startListening() {
    const SpeechRecognitionClass = getSpeechRecognition();
    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const resultIndex = event.resultIndex;
      const result = event.results[resultIndex];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        setInterimText("");
        setListening(false);
        onTranscript(transcript.trim());
      } else {
        setInterimText(transcript);
      }
    };

    recognition.onerror = () => {
      setListening(false);
      setInterimText("");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    setInterimText("");
  }

  // Not yet determined (SSR)
  if (supported === null) return null;

  // Browser doesn't support speech recognition
  if (!supported) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <button
        type="button"
        role="button"
        aria-label={listening ? "Stop listening" : "Microphone — voice input"}
        onClick={listening ? stopListening : startListening}
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-full)",
          border: "none",
          background: listening ? "var(--color-destructive)" : "var(--color-primary)",
          color: "#fff",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 150ms",
        }}
      >
        {listening ? (
          // Stop icon
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="10" rx="1" />
          </svg>
        ) : (
          // Mic icon
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
        )}
      </button>

      {listening && (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-muted)",
            textAlign: "center",
          }}
        >
          {interimText || "Listening..."}
        </div>
      )}
    </div>
  );
}
