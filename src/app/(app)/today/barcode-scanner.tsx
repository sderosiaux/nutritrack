"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type FoodItem = {
  id: string;
  name: string;
  brandName: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  servingSizes: Array<{ id: string; label: string; weightG: number }>;
};

interface BarcodeScannerProps {
  onFoodFound: (food: FoodItem) => void;
  onClose: () => void;
}

// BarcodeDetector is available in Chrome 83+, Edge 83+, Opera 69+, Samsung Internet 15+
// Not available in Firefox or Safari (they get manual entry fallback)
declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

function hasBarcodeDetector(): boolean {
  return typeof window !== "undefined" && "BarcodeDetector" in window;
}

export function BarcodeScanner({ onFoodFound, onClose }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const hasCamera = typeof navigator !== "undefined" && !!navigator.mediaDevices;
  const canScanNative = hasBarcodeDetector();

  // Lookup barcode via API
  const lookupBarcode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/foods/barcode/${encodeURIComponent(code.trim())}`);
      if (!res.ok) {
        setError("No product found for this barcode.");
        return;
      }
      const food = await res.json() as FoodItem;
      onFoodFound(food);
    } catch {
      setError("Lookup failed. Try again.");
    } finally {
      setLoading(false);
    }
  }, [onFoodFound]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // Scan loop using BarcodeDetector
  const startScanLoop = useCallback(async (video: HTMLVideoElement) => {
    if (!window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });

    scanningRef.current = true;
    while (scanningRef.current) {
      try {
        if (video.readyState >= 2) {
          const results = await detector.detect(video);
          if (results.length > 0) {
            const code = results[0].rawValue;
            scanningRef.current = false;
            stopCamera();
            setBarcode(code);
            await lookupBarcode(code);
            return;
          }
        }
      } catch {
        // Detection can throw on some frames, continue
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }, [stopCamera, lookupBarcode]);

  // Start camera
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScanning(true);
        startScanLoop(videoRef.current);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      if (msg.includes("Permission") || msg.includes("NotAllowed")) {
        setCameraError("Camera access denied. Check your browser permissions.");
      } else {
        setCameraError("Could not start camera.");
      }
    }
  }, [startScanLoop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      scanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") lookupBarcode(barcode);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--color-text)" }}>
          Scan Barcode
        </h2>
        <Button variant="ghost" size="sm" onClick={() => { stopCamera(); onClose(); }} aria-label="Close barcode scanner">
          ✕
        </Button>
      </div>

      {/* Camera viewfinder */}
      {hasCamera && canScanNative && !scanning && (
        <Button onClick={startCamera} variant="outline" style={{ width: "100%" }}>
          Open camera
        </Button>
      )}

      {scanning && (
        <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          <video
            ref={videoRef}
            style={{ width: "100%", borderRadius: "var(--radius-md)", background: "#000" }}
            playsInline
            muted
          />
          <div style={{
            position: "absolute", top: "50%", left: "10%", right: "10%",
            height: 2, background: "var(--color-primary)", opacity: 0.7,
            animation: "scan-line 2s ease-in-out infinite",
          }} />
          <Button
            variant="ghost"
            size="sm"
            onClick={stopCamera}
            style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.5)", color: "white" }}
          >
            Stop
          </Button>
        </div>
      )}

      {cameraError && (
        <p style={{ fontSize: 13, color: "var(--color-rose)", padding: "8px 0" }}>
          {cameraError}
        </p>
      )}

      {!hasCamera && (
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "8px 0" }}>
          Camera not available in this browser. Enter barcode manually.
        </p>
      )}

      {hasCamera && !canScanNative && !scanning && (
        <p style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "8px 0" }}>
          Camera scanning not supported in this browser. Enter barcode manually.
        </p>
      )}

      {/* Manual entry */}
      <div className="flex flex-col gap-2">
        <label htmlFor="barcode-manual" style={{ fontSize: 13, fontWeight: 500, color: "var(--color-text-muted)" }}>
          {scanning ? "Or enter barcode manually" : "Enter barcode"}
        </label>
        <div className="flex gap-2">
          <Input
            id="barcode-manual"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 3017620422003"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Barcode number"
          />
          <Button onClick={() => lookupBarcode(barcode)} disabled={loading || !barcode.trim()} aria-label="Search barcode">
            {loading ? "..." : "Search"}
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" style={{
          fontSize: 13, color: "var(--color-rose)",
          background: "#fef2f2", padding: "8px 12px", borderRadius: "var(--radius-sm)",
        }}>
          {error}
        </p>
      )}

      <style>{`
        @keyframes scan-line {
          0%, 100% { transform: translateY(-20px); }
          50% { transform: translateY(20px); }
        }
      `}</style>
    </div>
  );
}
