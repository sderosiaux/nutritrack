/**
 * Analytics routes
 * GET /api/v1/analytics/summary?startDate=&endDate=
 * GET /api/v1/analytics/nutrients?startDate=&endDate=
 * GET /api/v1/analytics/weight?startDate=&endDate=
 * GET /api/v1/analytics/foods/top?startDate=&endDate=&limit=10
 * GET /api/v1/analytics/meal-timing?startDate=&endDate=
 * GET /api/v1/analytics/export?format=json|csv&startDate=&endDate=
 */
import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import * as analyticsService from "@/server/services/analytics-service";

type Env = {
  Variables: { session: { user: { id: string; email: string } } | null };
};

const router = new Hono<Env>();
router.use("*", requireAuth);

/** Build default date range: last 30 days */
function defaultRange(): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

function getDateRange(c: { req: { query: (k: string) => string | undefined } }) {
  const defaults = defaultRange();
  return {
    startDate: c.req.query("startDate") ?? defaults.startDate,
    endDate: c.req.query("endDate") ?? defaults.endDate,
  };
}

// ── Static routes before dynamic ────────────────────────────────────────

// GET /api/v1/analytics/foods/top
router.get("/foods/top", async (c) => {
  const userId = c.get("session")!.user.id;
  const { startDate, endDate } = getDateRange(c);
  const limitStr = c.req.query("limit") ?? "10";
  const limit = Math.min(50, Math.max(1, parseInt(limitStr, 10) || 10));

  const data = await analyticsService.getTopFoods(userId, startDate, endDate, limit);
  return c.json(data);
});

// GET /api/v1/analytics/meal-timing
router.get("/meal-timing", async (c) => {
  const userId = c.get("session")!.user.id;
  const { startDate, endDate } = getDateRange(c);

  const data = await analyticsService.getMealTiming(userId, startDate, endDate);
  return c.json(data);
});

// GET /api/v1/analytics/export
router.get("/export", async (c) => {
  const userId = c.get("session")!.user.id;
  const format = c.req.query("format") ?? "json";

  if (format !== "json" && format !== "csv") {
    return c.json({ error: "format must be json or csv", code: "validation_error" }, 422);
  }

  const { startDate, endDate } = getDateRange(c);
  const data = await analyticsService.getExportData(userId, startDate, endDate);
  const filename = `nutritrack-export-${startDate}-${endDate}`;

  if (format === "csv") {
    const header = "date,meal_type,food_name,calories,protein,carbs,fat,fiber,quantity";
    const rows = data.map((r) =>
      [
        r.date,
        r.mealType,
        `"${r.foodName.replace(/"/g, '""')}"`,
        r.calories,
        r.protein,
        r.carbs,
        r.fat,
        r.fiber,
        r.quantity,
      ].join(",")
    );
    const csv = [header, ...rows].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  }

  // JSON
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.json"`,
    },
  });
});

// GET /api/v1/analytics/summary
router.get("/summary", async (c) => {
  const userId = c.get("session")!.user.id;
  const { startDate, endDate } = getDateRange(c);

  const data = await analyticsService.getSummary(userId, startDate, endDate);
  return c.json(data);
});

// GET /api/v1/analytics/nutrients
router.get("/nutrients", async (c) => {
  const userId = c.get("session")!.user.id;
  const { startDate, endDate } = getDateRange(c);

  const data = await analyticsService.getNutrientBreakdown(userId, startDate, endDate);
  return c.json(data);
});

// GET /api/v1/analytics/weight
router.get("/weight", async (c) => {
  const userId = c.get("session")!.user.id;
  const { startDate, endDate } = getDateRange(c);

  const data = await analyticsService.getWeightHistory(userId, startDate, endDate);
  return c.json(data);
});

export { router as analytics };
