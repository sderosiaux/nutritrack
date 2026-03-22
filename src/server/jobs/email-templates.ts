/**
 * email-templates — HTML email templates for NutriTrack notifications.
 * Simple inline-styled HTML (no external template engine required).
 */

export interface DailyReminderStats {
  date: string;
  caloriesConsumed: number;
  caloriesTarget: number;
  waterMl: number;
}

export interface WeeklySummaryStats {
  weekOf: string;
  totalCalories: number;
  avgCaloriesPerDay: number;
  streakDays: number;
  topFoods: string[];
}

const BASE_STYLES = `
  font-family: system-ui, -apple-system, sans-serif;
  background: #f9fafb;
  margin: 0;
  padding: 0;
`;

const CONTAINER_STYLES = `
  max-width: 560px;
  margin: 32px auto;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const HEADER_STYLES = `
  background: #16A34A;
  padding: 24px 32px;
`;

const BODY_STYLES = `
  padding: 32px;
`;

const STAT_BOX_STYLES = `
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px 20px;
  margin: 16px 0;
`;

const FOOTER_STYLES = `
  padding: 24px 32px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
`;

/** Builds the daily reminder email HTML. */
export function buildDailyReminderEmail(stats: DailyReminderStats): string {
  const pct = stats.caloriesTarget > 0
    ? Math.round((stats.caloriesConsumed / stats.caloriesTarget) * 100)
    : 0;
  const waterLiters = (stats.waterMl / 1000).toFixed(1);
  const remaining = Math.max(0, stats.caloriesTarget - stats.caloriesConsumed);

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NutriTrack Daily Summary</title></head>
<body style="${BASE_STYLES}">
  <div style="${CONTAINER_STYLES}">
    <div style="${HEADER_STYLES}">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">NutriTrack</h1>
      <p style="color: #d1fae5; font-size: 14px; margin: 4px 0 0;">Daily Summary — ${stats.date}</p>
    </div>
    <div style="${BODY_STYLES}">
      <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px;">
        Here's your nutrition summary
      </h2>
      <div style="${STAT_BOX_STYLES}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; color: #6b7280;">Calories consumed</span>
          <span style="font-size: 18px; font-weight: 700; color: #f59e0b;">${stats.caloriesConsumed} kcal</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span style="font-size: 14px; color: #6b7280;">Target</span>
          <span style="font-size: 14px; color: #111827;">${stats.caloriesTarget} kcal (${pct}%)</span>
        </div>
        ${remaining > 0 ? `<div style="margin-top: 8px; font-size: 13px; color: #16a34a;">
          ${remaining} kcal remaining today
        </div>` : ""}
      </div>
      <div style="${STAT_BOX_STYLES}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; color: #6b7280;">Water intake</span>
          <span style="font-size: 18px; font-weight: 700; color: #3b82f6;">${waterLiters} L</span>
        </div>
      </div>
      <p style="font-size: 14px; color: #6b7280; margin: 24px 0 0;">
        Keep up the great work! Open NutriTrack to log today's remaining meals.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/today"
         style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #16a34a; color: #ffffff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
        Open NutriTrack
      </a>
    </div>
    <div style="${FOOTER_STYLES}">
      <p>NutriTrack · Open-source nutrition tracker · <a href="#" style="color: #6b7280;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}

/** Builds the weekly summary email HTML. */
export function buildWeeklySummaryEmail(stats: WeeklySummaryStats): string {
  const topFoodsHtml = stats.topFoods.length > 0
    ? `<ul style="margin: 8px 0 0; padding-left: 20px; font-size: 14px; color: #374151;">
        ${stats.topFoods.slice(0, 5).map((f) => `<li style="margin: 4px 0;">${f}</li>`).join("")}
      </ul>`
    : `<p style="font-size: 14px; color: #9ca3af; margin: 8px 0 0;">No foods logged this week.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NutriTrack Weekly Summary</title></head>
<body style="${BASE_STYLES}">
  <div style="${CONTAINER_STYLES}">
    <div style="${HEADER_STYLES}">
      <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0;">NutriTrack</h1>
      <p style="color: #d1fae5; font-size: 14px; margin: 4px 0 0;">Weekly Summary — Week of ${stats.weekOf}</p>
    </div>
    <div style="${BODY_STYLES}">
      <h2 style="font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 16px;">
        Your week at a glance
      </h2>
      <div style="${STAT_BOX_STYLES}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; color: #6b7280;">Total calories</span>
          <span style="font-size: 18px; font-weight: 700; color: #f59e0b;">${stats.totalCalories.toLocaleString()} kcal</span>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
          <span style="font-size: 14px; color: #6b7280;">Daily average</span>
          <span style="font-size: 14px; color: #111827;">${stats.avgCaloriesPerDay} kcal/day</span>
        </div>
      </div>
      <div style="${STAT_BOX_STYLES}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 14px; color: #6b7280;">Logging streak</span>
          <span style="font-size: 18px; font-weight: 700; color: #16a34a;">${stats.streakDays} days 🔥</span>
        </div>
      </div>
      <div style="${STAT_BOX_STYLES}">
        <p style="font-size: 14px; font-weight: 600; color: #111827; margin: 0;">Top foods this week</p>
        ${topFoodsHtml}
      </div>
      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/progress"
         style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #16a34a; color: #ffffff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
        View full analytics
      </a>
    </div>
    <div style="${FOOTER_STYLES}">
      <p>NutriTrack · Open-source nutrition tracker · <a href="#" style="color: #6b7280;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;
}
