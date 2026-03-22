/**
 * Photo recognition routes:
 * POST /api/v1/recognize/photo         — upload image, enqueue analysis
 * GET  /api/v1/recognize/photo/:jobId  — poll job status (fallback for no SSE)
 * GET  /api/v1/recognize/photo/:jobId/stream — SSE stream
 */
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { uploadPhoto } from "@/server/services/storage-service";
import { enqueueAnalyzePhoto, getJob } from "@/server/services/vision-queue";

type Env = {
  Variables: {
    session: { user: { id: string; email: string; name?: string } } | null;
  };
};

const router = new Hono<Env>();

router.use("*", requireAuth);

// POST /api/v1/recognize/photo
// Body: multipart/form-data { image: File }
// Returns: { jobId: string }
router.post("/photo", async (c) => {
  const userId = c.get("session")!.user.id;

  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid form data", code: "validation_error" }, 422);
  }

  const imageFile = formData.get("image");
  if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
    return c.json(
      { error: "image field required (multipart File)", code: "validation_error" },
      422
    );
  }

  // Validate mime type
  const mimeType = imageFile.type || "image/jpeg";
  if (!mimeType.startsWith("image/")) {
    return c.json(
      { error: "Only image files are accepted", code: "validation_error" },
      422
    );
  }

  try {
    const arrayBuffer = await imageFile.arrayBuffer();
    const { objectKey } = await uploadPhoto(arrayBuffer, userId, mimeType);
    const jobId = await enqueueAnalyzePhoto({ objectKey, userId });

    return c.json({ jobId }, 201);
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    console.error("[recognize] upload error:", e?.message);
    return c.json(
      { error: "Failed to process image", code: "validation_error" },
      422
    );
  }
});

// GET /api/v1/recognize/photo/:jobId — poll job status
router.get("/photo/:jobId", async (c) => {
  const userId = c.get("session")!.user.id;
  const jobId = c.req.param("jobId");

  const job = getJob(jobId);
  if (!job) {
    return c.json({ error: "Job not found", code: "not_found" }, 404);
  }
  if (job.userId !== userId) {
    return c.json({ error: "Forbidden", code: "forbidden" }, 403);
  }

  const response: Record<string, unknown> = {
    jobId: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };

  if (job.status === "complete" && job.results) {
    response.items = job.results;
  }
  if (job.status === "failed" && job.error) {
    response.error = job.error;
  }

  return c.json(response);
});

// GET /api/v1/recognize/photo/:jobId/stream — SSE stream
router.get("/photo/:jobId/stream", async (c) => {
  const userId = c.get("session")!.user.id;
  const jobId = c.req.param("jobId");

  const job = getJob(jobId);
  if (!job) {
    return c.json({ error: "Job not found", code: "not_found" }, 404);
  }
  if (job.userId !== userId) {
    return c.json({ error: "Forbidden", code: "forbidden" }, 403);
  }

  // SSE stream — poll job store and push events
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      function sendEvent(data: Record<string, unknown>) {
        const chunk = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      }

      let attempts = 0;
      const maxAttempts = 60; // 30 seconds max (500ms poll)

      const poll = setInterval(() => {
        attempts++;
        const current = getJob(jobId);

        if (!current || attempts >= maxAttempts) {
          sendEvent({ status: "failed", error: "Timeout or job not found" });
          clearInterval(poll);
          controller.close();
          return;
        }

        if (current.status === "processing") {
          sendEvent({ status: "processing" });
        } else if (current.status === "complete") {
          sendEvent({ status: "done", items: current.results ?? [] });
          clearInterval(poll);
          controller.close();
        } else if (current.status === "failed") {
          sendEvent({ status: "failed", error: current.error ?? "Unknown error" });
          clearInterval(poll);
          controller.close();
        }
        // If still "queued", wait for next poll
      }, 500);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
});

export { router as recognize };
