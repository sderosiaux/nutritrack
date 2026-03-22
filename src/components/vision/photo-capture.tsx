"use client";

import { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface PhotoCaptureProps {
  onFoodsDetected: (
    items: Array<{ name: string; weightG: number; confidence: number }>
  ) => void;
  mealType: string;
  date: string;
}

type CaptureState =
  | { mode: "idle" }
  | { mode: "camera"; stream: MediaStream }
  | { mode: "error"; message: string }
  | { mode: "uploading" }
  | { mode: "polling"; jobId: string }
  | { mode: "done" };

export function PhotoCapture({ onFoodsDetected, mealType: _mealType, date: _date }: PhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<CaptureState>({ mode: "idle" });
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback((stream?: MediaStream) => {
    stream?.getTracks().forEach((t) => t.stop());
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
  }, []);

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState({ mode: "error", message: "Camera not available in this browser." });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setState({ mode: "camera", stream });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setState({ mode: "error", message: "Camera not available or permission denied." });
    }
  }

  async function captureFrame() {
    if (state.mode !== "camera") return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    stopCamera(state.stream);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      await uploadAndAnalyze(blob);
    }, "image/jpeg", 0.85);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadAndAnalyze(file);
  }

  async function uploadAndAnalyze(blob: Blob) {
    setState({ mode: "uploading" });

    try {
      const formData = new FormData();
      formData.append("image", blob, "photo.jpg");

      const res = await fetch("/api/v1/recognize/photo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        setState({ mode: "error", message: "Upload failed. Try again." });
        return;
      }

      const { jobId } = (await res.json()) as { jobId: string };
      setState({ mode: "polling", jobId });
      pollJobStatus(jobId);
    } catch {
      setState({ mode: "error", message: "Upload failed. Check your connection." });
    }
  }

  function pollJobStatus(jobId: string) {
    let attempts = 0;
    const maxAttempts = 40;

    pollTimerRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollTimerRef.current!);
        setState({ mode: "error", message: "Analysis timed out. Try again." });
        return;
      }

      try {
        const res = await fetch(`/api/v1/recognize/photo/${jobId}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: string;
          items?: Array<{ name: string; weightG: number; confidence: number }>;
          error?: string;
        };

        if (data.status === "done" || data.status === "complete") {
          clearInterval(pollTimerRef.current!);
          setState({ mode: "done" });
          onFoodsDetected(data.items ?? []);
        } else if (data.status === "failed") {
          clearInterval(pollTimerRef.current!);
          setState({
            mode: "error",
            message: data.error ?? "Recognition failed. Try again.",
          });
        }
      } catch {
        // Keep polling
      }
    }, 750);
  }

  function reset() {
    if (state.mode === "camera") stopCamera(state.stream);
    setState({ mode: "idle" });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {state.mode === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button type="button" onClick={openCamera} aria-label="Take Photo">
            Take Photo
          </Button>
          <label
            htmlFor="gallery-upload"
            aria-label="Upload from gallery"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-border)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--color-text)",
            }}
          >
            Upload from Gallery
          </label>
          <input
            id="gallery-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </div>
      )}

      {state.mode === "camera" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{ width: "100%", borderRadius: "var(--radius-md)", background: "#000" }}
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Button type="button" onClick={captureFrame} style={{ flex: 1 }}>
              Capture
            </Button>
            <Button type="button" onClick={reset} variant="outline" style={{ flex: 1 }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {state.mode === "uploading" && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--color-text-muted)" }}>
          Uploading...
        </div>
      )}

      {state.mode === "polling" && (
        <div style={{ textAlign: "center", padding: 24, color: "var(--color-text-muted)" }}>
          <div>Analyzing your food photo...</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>This may take a few seconds</div>
        </div>
      )}

      {state.mode === "error" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              padding: 12,
              borderRadius: "var(--radius-md)",
              background: "#fef2f2",
              color: "var(--color-destructive)",
              fontSize: 14,
            }}
          >
            {state.message}
          </div>
          <Button type="button" onClick={reset} variant="outline">
            Try Again
          </Button>
        </div>
      )}

      {state.mode === "done" && (
        <div style={{ textAlign: "center", color: "var(--color-primary)" }}>
          Analysis complete!
        </div>
      )}
    </div>
  );
}
