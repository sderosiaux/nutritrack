// @vitest-environment jsdom
/**
 * CHK-030: Photo capture UI + recognition results
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

vi.mock("@/server/db", () => ({ db: {} }));

// Mock getUserMedia (not supported in jsdom)
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, "mediaDevices", {
  value: { getUserMedia: mockGetUserMedia },
  writable: true,
});

// Mock fetch for photo upload and job polling
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { PhotoCapture } from "@/components/vision/photo-capture";

describe("CHK-030 — PhotoCapture component", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders Take Photo button", () => {
    render(
      <PhotoCapture
        onFoodsDetected={vi.fn()}
        mealType="breakfast"
        date="2026-03-22"
      />
    );
    expect(screen.getByRole("button", { name: /take photo/i })).toBeInTheDocument();
  });

  it("shows camera unavailable message when getUserMedia fails", async () => {
    mockGetUserMedia.mockRejectedValueOnce(new Error("Permission denied"));
    render(
      <PhotoCapture
        onFoodsDetected={vi.fn()}
        mealType="breakfast"
        date="2026-03-22"
      />
    );
    const button = screen.getByRole("button", { name: /take photo/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText(/camera not available/i)).toBeInTheDocument();
    });
  });

  it("shows camera unavailable when mediaDevices not supported", async () => {
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: undefined,
      writable: true,
    });
    render(
      <PhotoCapture
        onFoodsDetected={vi.fn()}
        mealType="breakfast"
        date="2026-03-22"
      />
    );
    const button = screen.getByRole("button", { name: /take photo/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText(/camera not available/i)).toBeInTheDocument();
    });
    // Restore
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: { getUserMedia: mockGetUserMedia },
      writable: true,
    });
  });

  it("renders gallery upload option", () => {
    render(
      <PhotoCapture
        onFoodsDetected={vi.fn()}
        mealType="lunch"
        date="2026-03-22"
      />
    );
    // File input should exist for gallery upload
    const inputs = document.querySelectorAll('input[type="file"]');
    expect(inputs.length).toBeGreaterThan(0);
  });
});

describe("CHK-030 — PhotoResults component", () => {
  it("renders detected food items with checkboxes", async () => {
    const { PhotoResults } = await import("@/components/vision/photo-results");
    const items = [
      { name: "Apple", weightG: 150, confidence: 0.92 },
      { name: "Banana", weightG: 120, confidence: 0.87 },
    ];

    render(
      <PhotoResults
        items={items}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });

  it("shows estimated calories for each item", async () => {
    const { PhotoResults } = await import("@/components/vision/photo-results");
    const items = [{ name: "Rice", weightG: 200, confidence: 0.9 }];

    render(
      <PhotoResults
        items={items}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    // Should show kcal estimate (rice ~1.3 kcal/g = ~260 kcal)
    expect(screen.getByText(/kcal/i)).toBeInTheDocument();
  });

  it("calls onConfirm with selected items", async () => {
    const { PhotoResults } = await import("@/components/vision/photo-results");
    const items = [
      { name: "Apple", weightG: 150, confidence: 0.92 },
      { name: "Banana", weightG: 120, confidence: 0.87 },
    ];
    const onConfirm = vi.fn();

    render(
      <PhotoResults
        items={items}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );

    // Uncheck second item
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // uncheck Banana

    // Click confirm
    fireEvent.click(screen.getByRole("button", { name: /confirm|add/i }));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "Apple" })])
    );
    expect(onConfirm).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "Banana" })])
    );
  });

  it("calls onCancel when cancel button clicked", async () => {
    const { PhotoResults } = await import("@/components/vision/photo-results");
    const onCancel = vi.fn();
    render(
      <PhotoResults
        items={[{ name: "Toast", weightG: 50, confidence: 0.8 }]}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows processing spinner state", async () => {
    const { PhotoResults } = await import("@/components/vision/photo-results");
    render(
      <PhotoResults
        items={[]}
        loading={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    const matches = screen.queryAllByText(/analyzing|processing/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});
