// @vitest-environment node
/**
 * CHK-028: BullMQ analyze-photo job + SSE
 * Tests: in-memory queue (BullMQ fallback), SSE status endpoint, job lifecycle
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db", () => ({ db: {} }));
vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));
vi.mock("@/server/services/storage-service", () => ({
  uploadPhoto: vi.fn(),
  getPhotoBuffer: vi.fn(),
}));

import { getSessionFromRequest } from "@/server/auth";
import { getPhotoBuffer } from "@/server/services/storage-service";
import { app } from "@/server/api/index";
import {
  createJob,
  getJob,
  updateJob,
} from "@/server/services/vision-queue";

const mockSession = { user: { id: "user-1", email: "test@example.com" } };

describe("CHK-028 — Vision queue (in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession as never);
  });

  it("createJob returns a job with queued status", () => {
    const job = createJob({ objectKey: "uploads/user-1/abc.jpg", userId: "user-1" });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe("queued");
    expect(job.userId).toBe("user-1");
  });

  it("getJob returns job by id", () => {
    const job = createJob({ objectKey: "uploads/user-1/def.jpg", userId: "user-1" });
    const fetched = getJob(job.id);
    expect(fetched).toBeDefined();
    expect(fetched!.id).toBe(job.id);
  });

  it("getJob returns undefined for unknown id", () => {
    expect(getJob("nonexistent-job-id")).toBeUndefined();
  });

  it("updateJob transitions status correctly", () => {
    const job = createJob({ objectKey: "uploads/user-1/ghi.jpg", userId: "user-1" });
    updateJob(job.id, { status: "processing" });
    expect(getJob(job.id)!.status).toBe("processing");
  });

  it("updateJob sets results on complete", () => {
    const job = createJob({ objectKey: "uploads/user-1/jkl.jpg", userId: "user-1" });
    const results = [
      { name: "Apple", weightG: 150, confidence: 0.92 },
      { name: "Banana", weightG: 120, confidence: 0.87 },
    ];
    updateJob(job.id, { status: "complete", results });
    const updated = getJob(job.id)!;
    expect(updated.status).toBe("complete");
    expect(updated.results).toEqual(results);
  });

  it("updateJob sets error on failed", () => {
    const job = createJob({ objectKey: "uploads/user-1/mno.jpg", userId: "user-1" });
    updateJob(job.id, { status: "failed", error: "Vision provider unreachable" });
    const updated = getJob(job.id)!;
    expect(updated.status).toBe("failed");
    expect(updated.error).toBe("Vision provider unreachable");
  });
});

describe("CHK-028 — GET /api/v1/recognize/photo/:jobId (poll fallback)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession as never);
    vi.mocked(getPhotoBuffer).mockResolvedValue(Buffer.from("fake-image"));
  });

  it("returns 401 without auth", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);
    const res = await app.request(
      new Request("http://localhost/api/v1/recognize/photo/some-job-id")
    );
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown job", async () => {
    const res = await app.request(
      new Request("http://localhost/api/v1/recognize/photo/unknown-job-xyz")
    );
    expect(res.status).toBe(404);
  });

  it("returns job status for owned job", async () => {
    const job = createJob({ objectKey: "uploads/user-1/test.jpg", userId: "user-1" });

    const res = await app.request(
      new Request(`http://localhost/api/v1/recognize/photo/${job.id}`)
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("queued");
    expect(body.jobId).toBe(job.id);
  });

  it("returns 403 if job belongs to different user", async () => {
    const job = createJob({ objectKey: "uploads/user-2/test.jpg", userId: "user-2" });

    const res = await app.request(
      new Request(`http://localhost/api/v1/recognize/photo/${job.id}`)
    );
    expect(res.status).toBe(403);
  });
});
