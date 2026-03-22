// @vitest-environment jsdom
/**
 * CHK-031: Voice input (Web Speech API)
 * Tests: mic button, SpeechRecognition mock, fallback when unsupported
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/server/db", () => ({ db: {} }));

// Mock SpeechRecognition
class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = "en-US";
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

const mockRecognitionInstance = new MockSpeechRecognition();
const MockSpeechRecognitionCtor = vi.fn(() => mockRecognitionInstance);

describe("CHK-031 — VoiceInput with SpeechRecognition supported", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Install mock SpeechRecognition
    (global as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognitionCtor;
    (global as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognitionCtor;
  });

  afterEach(() => {
    delete (global as unknown as Record<string, unknown>).SpeechRecognition;
    delete (global as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it("renders microphone button", async () => {
    const { VoiceInput } = await import("@/components/vision/voice-input");
    render(<VoiceInput onTranscript={vi.fn()} />);
    expect(screen.getByRole("button", { name: /microphone|voice/i })).toBeInTheDocument();
  });

  it("starts recognition on mic button click", async () => {
    const { VoiceInput } = await import("@/components/vision/voice-input");
    render(<VoiceInput onTranscript={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /microphone|voice/i }));
    await waitFor(() => {
      expect(mockRecognitionInstance.start).toHaveBeenCalled();
    });
  });

  it("calls onTranscript with recognized text", async () => {
    const { VoiceInput } = await import("@/components/vision/voice-input");
    const onTranscript = vi.fn();
    render(<VoiceInput onTranscript={onTranscript} />);

    fireEvent.click(screen.getByRole("button", { name: /microphone|voice/i }));

    // Simulate speech recognition result
    const mockEvent = {
      results: [{
        0: { transcript: "two eggs and a banana" },
        isFinal: true,
        length: 1,
      }],
      resultIndex: 0,
    };

    // Trigger the onresult callback
    if (mockRecognitionInstance.onresult) {
      mockRecognitionInstance.onresult(mockEvent);
    }

    await waitFor(() => {
      expect(onTranscript).toHaveBeenCalledWith("two eggs and a banana");
    });
  });

  it("shows listening state while recording", async () => {
    const { VoiceInput } = await import("@/components/vision/voice-input");
    render(<VoiceInput onTranscript={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /microphone|voice/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/listening|recording/i)
      ).toBeInTheDocument();
    });
  });

  it("stops recognition when stop button clicked", async () => {
    const { VoiceInput } = await import("@/components/vision/voice-input");
    render(<VoiceInput onTranscript={vi.fn()} />);

    // Start
    fireEvent.click(screen.getByRole("button", { name: /microphone|voice/i }));

    await waitFor(() => expect(mockRecognitionInstance.start).toHaveBeenCalled());

    // Stop - button label changes while listening
    const stopBtn = screen.getByRole("button", { name: /stop|listening/i });
    fireEvent.click(stopBtn);

    expect(mockRecognitionInstance.stop).toHaveBeenCalled();
  });
});

describe("CHK-031 — VoiceInput graceful fallback", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Remove SpeechRecognition to simulate unsupported browser
    delete (global as unknown as Record<string, unknown>).SpeechRecognition;
    delete (global as unknown as Record<string, unknown>).webkitSpeechRecognition;
  });

  it("does not render mic button when SpeechRecognition unsupported", async () => {
    const { VoiceInput } = await import("@/components/vision/voice-input");
    render(<VoiceInput onTranscript={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /microphone|voice/i })).not.toBeInTheDocument();
  });

  it("renders null or fallback message when unsupported", async () => {
    const { VoiceInput } = await import("@/components/vision/voice-input");
    const { container } = render(<VoiceInput onTranscript={vi.fn()} />);
    // Either renders nothing or shows fallback text
    const hasFallback =
      container.innerHTML === "" ||
      container.innerHTML.includes("not supported") ||
      container.innerHTML.length < 20;
    expect(hasFallback).toBe(true);
  });
});
