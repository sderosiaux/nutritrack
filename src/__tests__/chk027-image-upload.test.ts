// @vitest-environment node
/**
 * CHK-027: MinIO image upload
 * POST /api/v1/recognize/photo — multipart, stores to MinIO, returns { jobId }
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/db", () => ({
  db: {},
}));

vi.mock("@/server/auth", () => ({
  getSessionFromRequest: vi.fn(),
}));

vi.mock("@/server/services/storage-service", () => ({
  uploadPhoto: vi.fn(),
}));

vi.mock("@/server/services/vision-queue", () => ({
  enqueueAnalyzePhoto: vi.fn(),
}));

import { getSessionFromRequest } from "@/server/auth";
import { uploadPhoto } from "@/server/services/storage-service";
import { enqueueAnalyzePhoto } from "@/server/services/vision-queue";
import { app } from "@/server/api/index";

const mockSession = { user: { id: "user-1", email: "test@example.com" } };

describe("CHK-027 — POST /api/v1/recognize/photo", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSessionFromRequest).mockResolvedValue(mockSession as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getSessionFromRequest).mockResolvedValue(null);
    const req = new Request("http://localhost/api/v1/recognize/photo", {
      method: "POST",
    });
    const res = await app.request(req);
    expect(res.status).toBe(401);
  });

  it("returns 422 when no image in body", async () => {
    const formData = new FormData();
    const req = new Request("http://localhost/api/v1/recognize/photo", {
      method: "POST",
      body: formData,
    });
    const res = await app.request(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.code).toBe("validation_error");
  });

  it("uploads image and enqueues job, returns jobId", async () => {
    vi.mocked(uploadPhoto).mockResolvedValue({
      objectKey: "uploads/user-1/img-123.jpg",
      url: "http://minio/nutritrack/uploads/user-1/img-123.jpg",
    });
    vi.mocked(enqueueAnalyzePhoto).mockResolvedValue("job-abc-123");

    const imageBlob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("image", imageBlob, "photo.jpg");

    const req = new Request("http://localhost/api/v1/recognize/photo", {
      method: "POST",
      body: formData,
    });

    const res = await app.request(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty("jobId");
    expect(body.jobId).toBe("job-abc-123");
    expect(uploadPhoto).toHaveBeenCalledWith(
      expect.any(ArrayBuffer),
      expect.stringContaining("user-1"),
      expect.stringMatching(/image\/jpeg/)
    );
    expect(enqueueAnalyzePhoto).toHaveBeenCalledWith({
      objectKey: "uploads/user-1/img-123.jpg",
      userId: "user-1",
    });
  });

  it("returns 422 on upload failure", async () => {
    vi.mocked(uploadPhoto).mockRejectedValue(
      Object.assign(new Error("MinIO error"), { code: "upload_failed" })
    );

    const imageBlob = new Blob(["fake-image-data"], { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("image", imageBlob, "photo.jpg");

    const req = new Request("http://localhost/api/v1/recognize/photo", {
      method: "POST",
      body: formData,
    });

    const res = await app.request(req);
    expect(res.status).toBe(422);
  });
});
