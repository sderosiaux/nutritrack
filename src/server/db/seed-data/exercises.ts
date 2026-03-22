/**
 * Exercise seed data index — re-exports from split files.
 * 200+ exercises with MET values across 5 categories.
 * Source: Ainsworth et al. Compendium of Physical Activities (2011)
 */

export type SeedExercise = {
  id: string;
  name: string;
  category: "cardio" | "strength" | "flexibility" | "sports" | "daily_activity";
  metValue: number;
  metLow: number;
  metHigh: number;
};

export { EXERCISE_SEED_A } from "./exercise-seed-a";
export { EXERCISE_SEED_B } from "./exercise-seed-b";

import { EXERCISE_SEED_A } from "./exercise-seed-a";
import { EXERCISE_SEED_B } from "./exercise-seed-b";

export const ALL_EXERCISES: SeedExercise[] = [...EXERCISE_SEED_A, ...EXERCISE_SEED_B];
