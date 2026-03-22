/**
 * Vision job queue — in-memory fallback (BullMQ not installed).
 * Provides the same interface that would be used with BullMQ.
 * In production, replace with BullMQ Queue + Worker.
 */

export type JobStatus = "queued" | "processing" | "complete" | "failed";

export interface RecognizedItem {
  name: string;
  weightG: number;
  confidence: number;
}

export interface VisionJob {
  id: string;
  objectKey: string;
  userId: string;
  status: JobStatus;
  results?: RecognizedItem[];
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store — resets on server restart (acceptable for v1)
const jobStore = new Map<string, VisionJob>();

export function createJob(params: { objectKey: string; userId: string }): VisionJob {
  const job: VisionJob = {
    id: crypto.randomUUID(),
    objectKey: params.objectKey,
    userId: params.userId,
    status: "queued",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  jobStore.set(job.id, job);
  return job;
}

export function getJob(jobId: string): VisionJob | undefined {
  return jobStore.get(jobId);
}

export function updateJob(
  jobId: string,
  update: { status: JobStatus; results?: RecognizedItem[]; error?: string }
): VisionJob | undefined {
  const job = jobStore.get(jobId);
  if (!job) return undefined;
  const updated: VisionJob = {
    ...job,
    ...update,
    updatedAt: new Date(),
  };
  jobStore.set(jobId, updated);
  return updated;
}

/**
 * Enqueue a photo analysis job.
 * Triggers async processing in background (fire-and-forget).
 * Returns the job ID.
 */
export async function enqueueAnalyzePhoto(params: {
  objectKey: string;
  userId: string;
}): Promise<string> {
  const job = createJob(params);

  // Fire-and-forget background processing
  processJobAsync(job.id, params.objectKey).catch((err) => {
    console.error("[vision-queue] processJobAsync error:", err);
    updateJob(job.id, { status: "failed", error: "Processing error" });
  });

  return job.id;
}

async function processJobAsync(jobId: string, objectKey: string): Promise<void> {
  updateJob(jobId, { status: "processing" });

  try {
    // Dynamically import to avoid circular deps
    const { getPhotoBuffer } = await import("./storage-service");
    const { analyzeImage } = await import("./vision-service");

    const buffer = await getPhotoBuffer(objectKey);
    if (!buffer) {
      updateJob(jobId, {
        status: "failed",
        error: "Could not retrieve image from storage",
      });
      return;
    }

    const base64 = buffer.toString("base64");
    const results = await analyzeImage(base64, "image/jpeg");

    updateJob(jobId, { status: "complete", results });
  } catch (err: unknown) {
    const e = err as { message?: string };
    updateJob(jobId, {
      status: "failed",
      error: e?.message ?? "Unknown processing error",
    });
  }
}
