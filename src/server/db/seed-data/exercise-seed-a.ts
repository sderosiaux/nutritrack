/**
 * Exercise seed data — Part A: cardio + strength (120 exercises)
 * MET values from Ainsworth et al. 2011 Compendium of Physical Activities.
 */

import type { SeedExercise } from "./exercises";

const ex = (
  id: string,
  name: string,
  category: SeedExercise["category"],
  metValue: number,
  metLow: number,
  metHigh: number
): SeedExercise => ({ id, name, category, metValue, metLow, metHigh });

// ── CARDIO (60 exercises) ────────────────────────────────────────────────────

export const EXERCISE_SEED_A: SeedExercise[] = [
  // Running
  ex("c001", "Running (5 km/h)", "cardio", 6.0, 5.0, 7.0),
  ex("c002", "Running (8 km/h)", "cardio", 8.3, 7.0, 9.5),
  ex("c003", "Running (10 km/h)", "cardio", 10.0, 8.5, 11.5),
  ex("c004", "Running (12 km/h)", "cardio", 11.5, 10.0, 13.0),
  ex("c005", "Running (14 km/h)", "cardio", 13.3, 11.5, 15.0),
  ex("c006", "Running (16 km/h)", "cardio", 14.5, 13.0, 16.0),
  ex("c007", "Jogging (light)", "cardio", 6.0, 5.0, 7.0),
  ex("c008", "Sprint intervals", "cardio", 14.0, 12.0, 19.0),
  ex("c009", "Trail running", "cardio", 9.0, 7.5, 12.0),
  ex("c010", "Uphill running", "cardio", 11.0, 9.0, 13.5),

  // Cycling
  ex("c011", "Cycling (leisure, <16 km/h)", "cardio", 4.0, 3.5, 5.0),
  ex("c012", "Cycling (moderate, 19–22 km/h)", "cardio", 8.0, 6.5, 9.5),
  ex("c013", "Cycling (vigorous, 22–26 km/h)", "cardio", 10.0, 8.5, 11.5),
  ex("c014", "Cycling (racing, >32 km/h)", "cardio", 16.0, 13.0, 19.0),
  ex("c015", "Mountain biking", "cardio", 8.5, 7.0, 11.0),
  ex("c016", "Stationary bike (light)", "cardio", 3.5, 3.0, 4.5),
  ex("c017", "Stationary bike (moderate)", "cardio", 6.8, 5.5, 8.0),
  ex("c018", "Stationary bike (vigorous)", "cardio", 8.8, 7.5, 10.5),
  ex("c019", "Spin class", "cardio", 8.5, 7.0, 11.0),
  ex("c020", "Cycling (uphill)", "cardio", 12.0, 10.0, 14.0),

  // Swimming
  ex("c021", "Swimming (freestyle, slow)", "cardio", 5.8, 4.5, 7.0),
  ex("c022", "Swimming (freestyle, moderate)", "cardio", 8.3, 6.5, 10.0),
  ex("c023", "Swimming (freestyle, fast)", "cardio", 9.8, 8.0, 11.5),
  ex("c024", "Swimming (breaststroke)", "cardio", 5.3, 4.0, 7.0),
  ex("c025", "Swimming (backstroke)", "cardio", 4.8, 3.5, 6.5),
  ex("c026", "Swimming (butterfly)", "cardio", 13.8, 11.0, 16.0),
  ex("c027", "Water aerobics", "cardio", 5.5, 4.0, 7.0),
  ex("c028", "Lap swimming (vigorous)", "cardio", 9.8, 8.0, 11.5),

  // Walking
  ex("c029", "Walking (3 km/h)", "cardio", 2.5, 2.0, 3.0),
  ex("c030", "Walking (4.5 km/h)", "cardio", 3.5, 3.0, 4.0),
  ex("c031", "Walking (5.5 km/h)", "cardio", 4.3, 3.5, 5.0),
  ex("c032", "Walking (6.5 km/h, brisk)", "cardio", 5.0, 4.0, 6.0),
  ex("c033", "Nordic walking", "cardio", 6.8, 5.5, 8.0),
  ex("c034", "Hiking (flat)", "cardio", 5.3, 4.0, 6.5),
  ex("c035", "Hiking (hills)", "cardio", 7.0, 5.5, 9.0),
  ex("c036", "Backpacking", "cardio", 7.0, 5.5, 9.0),

  // Cardio machines / group
  ex("c037", "Elliptical trainer (moderate)", "cardio", 5.0, 4.0, 6.5),
  ex("c038", "Elliptical trainer (vigorous)", "cardio", 7.5, 6.0, 9.0),
  ex("c039", "Rowing machine (light)", "cardio", 4.8, 3.5, 6.0),
  ex("c040", "Rowing machine (moderate)", "cardio", 7.0, 5.5, 8.5),
  ex("c041", "Rowing machine (vigorous)", "cardio", 8.5, 7.0, 10.0),
  ex("c042", "StairMaster / stair climbing", "cardio", 9.0, 7.0, 11.0),
  ex("c043", "Jump rope (moderate)", "cardio", 10.0, 8.0, 12.5),
  ex("c044", "Jump rope (fast)", "cardio", 12.3, 10.0, 15.0),
  ex("c045", "Aerobics class (low impact)", "cardio", 5.0, 4.0, 6.0),
  ex("c046", "Aerobics class (high impact)", "cardio", 7.3, 6.0, 9.0),
  ex("c047", "Step aerobics (6-inch step)", "cardio", 8.5, 7.0, 10.0),
  ex("c048", "Zumba", "cardio", 6.5, 5.0, 8.5),
  ex("c049", "Dance fitness", "cardio", 6.0, 4.5, 8.0),
  ex("c050", "HIIT cardio", "cardio", 12.0, 10.0, 16.0),
  ex("c051", "Burpees", "cardio", 10.0, 8.0, 13.0),
  ex("c052", "Jumping jacks", "cardio", 8.0, 6.5, 10.0),
  ex("c053", "Box jumps", "cardio", 10.0, 8.0, 12.5),
  ex("c054", "Kickboxing cardio", "cardio", 10.0, 7.5, 12.0),
  ex("c055", "Cross-country skiing (moderate)", "cardio", 7.0, 5.5, 9.0),
  ex("c056", "Snowshoeing", "cardio", 5.8, 4.5, 8.0),
  ex("c057", "Rollerblading", "cardio", 12.3, 7.5, 15.0),
  ex("c058", "Skateboarding", "cardio", 5.0, 4.0, 6.5),
  ex("c059", "Rock climbing (moderate)", "cardio", 8.0, 5.5, 11.0),
  ex("c060", "Rock climbing (vigorous)", "cardio", 11.0, 8.5, 13.5),

  // ── STRENGTH (60 exercises) ────────────────────────────────────────────────

  // Weight training
  ex("s001", "Weight training (light effort)", "strength", 3.0, 2.0, 4.0),
  ex("s002", "Weight training (moderate effort)", "strength", 5.0, 3.5, 6.0),
  ex("s003", "Weight training (vigorous effort)", "strength", 6.0, 5.0, 7.5),
  ex("s004", "Powerlifting", "strength", 6.0, 4.5, 8.0),
  ex("s005", "Olympic weightlifting", "strength", 6.0, 5.0, 8.5),
  ex("s006", "Bodyweight exercises", "strength", 5.0, 3.5, 7.0),

  // Upper body
  ex("s007", "Push-ups", "strength", 3.8, 3.0, 5.0),
  ex("s008", "Pull-ups / chin-ups", "strength", 4.0, 3.0, 5.5),
  ex("s009", "Bench press", "strength", 5.0, 3.5, 6.5),
  ex("s010", "Dumbbell rows", "strength", 4.5, 3.0, 6.0),
  ex("s011", "Overhead press (barbell)", "strength", 5.0, 3.5, 6.5),
  ex("s012", "Dumbbell curls", "strength", 3.0, 2.0, 4.0),
  ex("s013", "Tricep dips", "strength", 3.5, 2.5, 4.5),
  ex("s014", "Lat pulldown", "strength", 4.5, 3.0, 6.0),
  ex("s015", "Cable rows", "strength", 4.5, 3.0, 6.0),
  ex("s016", "Shoulder press (dumbbell)", "strength", 4.5, 3.0, 6.0),
  ex("s017", "Lateral raises", "strength", 3.0, 2.0, 4.0),
  ex("s018", "Face pulls", "strength", 3.0, 2.0, 4.0),
  ex("s019", "Chest flyes", "strength", 3.5, 2.5, 4.5),
  ex("s020", "Incline bench press", "strength", 5.0, 3.5, 6.5),

  // Lower body
  ex("s021", "Squats (barbell)", "strength", 5.0, 3.5, 7.0),
  ex("s022", "Squats (bodyweight)", "strength", 3.5, 2.5, 5.0),
  ex("s023", "Deadlift", "strength", 6.0, 4.5, 8.0),
  ex("s024", "Romanian deadlift", "strength", 5.0, 3.5, 7.0),
  ex("s025", "Lunges", "strength", 4.0, 3.0, 5.5),
  ex("s026", "Leg press", "strength", 4.5, 3.0, 6.0),
  ex("s027", "Leg curl", "strength", 3.5, 2.5, 4.5),
  ex("s028", "Leg extension", "strength", 3.5, 2.5, 4.5),
  ex("s029", "Calf raises", "strength", 2.0, 1.5, 3.0),
  ex("s030", "Hip thrusts", "strength", 4.0, 3.0, 5.5),
  ex("s031", "Step-ups", "strength", 5.0, 3.5, 7.0),
  ex("s032", "Bulgarian split squat", "strength", 5.0, 3.5, 7.0),
  ex("s033", "Sumo deadlift", "strength", 6.0, 4.5, 8.0),
  ex("s034", "Hack squat", "strength", 5.0, 3.5, 6.5),
  ex("s035", "Glute bridges", "strength", 3.0, 2.0, 4.0),

  // Core
  ex("s036", "Plank", "strength", 3.0, 2.0, 4.0),
  ex("s037", "Sit-ups", "strength", 3.0, 2.0, 4.0),
  ex("s038", "Crunches", "strength", 2.8, 2.0, 3.5),
  ex("s039", "Bicycle crunches", "strength", 3.0, 2.0, 4.0),
  ex("s040", "Russian twists", "strength", 3.0, 2.0, 4.0),
  ex("s041", "Leg raises", "strength", 3.0, 2.0, 4.0),
  ex("s042", "Ab wheel rollout", "strength", 4.0, 3.0, 5.5),
  ex("s043", "Side plank", "strength", 3.0, 2.0, 4.0),
  ex("s044", "Dead bug", "strength", 2.5, 2.0, 3.5),
  ex("s045", "Pallof press", "strength", 3.0, 2.0, 4.0),

  // Functional / compound
  ex("s046", "Kettlebell swings", "strength", 8.2, 6.5, 10.0),
  ex("s047", "Kettlebell clean and press", "strength", 7.0, 5.5, 9.0),
  ex("s048", "Turkish get-up", "strength", 5.0, 3.5, 7.0),
  ex("s049", "Medicine ball slams", "strength", 7.0, 5.5, 9.0),
  ex("s050", "Battle ropes", "strength", 10.3, 8.0, 13.0),
  ex("s051", "Sled push", "strength", 8.0, 6.0, 11.0),
  ex("s052", "Farmer's walk", "strength", 6.0, 4.5, 8.0),
  ex("s053", "Clean and jerk", "strength", 6.5, 5.0, 8.5),
  ex("s054", "Snatch", "strength", 6.5, 5.0, 8.5),
  ex("s055", "CrossFit WOD (moderate)", "strength", 9.0, 7.0, 12.0),
  ex("s056", "Circuit training (light)", "strength", 4.3, 3.0, 6.0),
  ex("s057", "Circuit training (moderate)", "strength", 6.0, 4.5, 8.0),
  ex("s058", "Circuit training (vigorous)", "strength", 8.0, 6.5, 10.0),
  ex("s059", "Suspension training (TRX)", "strength", 5.5, 4.0, 7.5),
  ex("s060", "Resistance band training", "strength", 3.5, 2.5, 5.0),
];
