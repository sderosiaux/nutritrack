/**
 * Central schema export — all tables + enums for Drizzle migrations.
 */

// Better Auth tables
export { user, session, account, verification } from "./auth";

// User data
export {
  biologicalSexEnum,
  goalEnum,
  activityLevelEnum,
  unitsEnum,
  userProfiles,
  dailyTargets,
} from "./users";

// Food database
export {
  foodSourceEnum,
  foods,
  servingSizes,
  foodFavorites,
} from "./foods";

// Daily logs
export {
  mealSlotEnum,
  entrySourceEnum,
  intensityLevelEnum,
  exerciseCategoryEnum,
  mealEntries,
  waterEntries,
  weightEntries,
  exercises,
  activityEntries,
} from "./logs";

// Content (recipes + lessons)
export {
  recipeDifficultyEnum,
  recipeSourceEnum,
  lessonCategoryEnum,
  recipes,
  recipeIngredients,
  favoriteRecipes,
  lessons,
  lessonProgress,
} from "./content";
