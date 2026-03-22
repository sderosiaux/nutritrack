/**
 * Profile API routes (CHK-021)
 * GET  /api/v1/profile                   — get profile + targets
 * PUT  /api/v1/profile                   — upsert profile (triggers TDEE recalc)
 * POST /api/v1/profile/recalculate-targets — force recalculate DailyTargets
 */
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import * as profileService from "@/server/services/profile-service";

type Env = { Variables: { session: { user: { id: string; email: string; name?: string } } | null } };

const router = new Hono<Env>();

router.use("*", requireAuth);

// ── Validation schemas ─────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  biologicalSex: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  currentWeightKg: z.number().positive().max(500).optional(),
  heightCm: z.number().positive().max(300).optional(),
  goal: z.enum(["lose_weight", "maintain", "build_muscle", "eat_healthier"]).optional(),
  targetWeightKg: z.number().positive().max(500).nullable().optional(),
  weeklyPaceKg: z.number().positive().max(2).nullable().optional(),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]).optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  units: z.enum(["metric", "imperial"]).optional(),
  language: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).max(50).optional(),
});

// ── GET /api/v1/profile ────────────────────────────────────────────────────

router.get("/", async (c) => {
  const userId = c.get("session")!.user.id;
  const result = await profileService.getProfile(userId);

  if (!result) {
    return c.json({ error: "Profile not found", code: "not_found" }, 404);
  }

  return c.json(result);
});

// ── POST /api/v1/profile/recalculate-targets ──────────────────────────────
// Must be registered BEFORE PUT /:anything

router.post("/recalculate-targets", async (c) => {
  const userId = c.get("session")!.user.id;

  try {
    const targets = await profileService.recalculateTargets(userId);
    return c.json(targets);
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "not_found") return c.json({ error: "Profile not found", code: "not_found" }, 404);
    if (e?.code === "validation_error") return c.json({ error: "Profile incomplete", code: "validation_error" }, 422);
    throw err;
  }
});

// ── PUT /api/v1/profile ────────────────────────────────────────────────────

router.put("/", async (c) => {
  const userId = c.get("session")!.user.id;

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON", code: "validation_error" }, 422);
  }

  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Validation error", code: "validation_error", details: parsed.error.flatten() }, 422);
  }

  const saved = await profileService.upsertProfile(userId, parsed.data);
  return c.json(saved);
});

export { router as profile };
