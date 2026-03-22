/**
 * Exercise seed data — Part B: flexibility + sports + daily_activity (100 exercises)
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

export const EXERCISE_SEED_B: SeedExercise[] = [
  // ── FLEXIBILITY (25 exercises) ─────────────────────────────────────────────

  ex("f001", "Yoga (Hatha)", "flexibility", 2.5, 2.0, 3.0),
  ex("f002", "Yoga (Vinyasa / power)", "flexibility", 4.0, 3.0, 5.5),
  ex("f003", "Yoga (Ashtanga)", "flexibility", 5.0, 4.0, 6.5),
  ex("f004", "Yoga (Bikram / hot)", "flexibility", 5.0, 4.0, 6.5),
  ex("f005", "Yoga (restorative)", "flexibility", 2.0, 1.5, 2.5),
  ex("f006", "Pilates (mat, light)", "flexibility", 3.0, 2.0, 4.0),
  ex("f007", "Pilates (mat, moderate)", "flexibility", 4.0, 3.0, 5.0),
  ex("f008", "Pilates (reformer)", "flexibility", 4.5, 3.5, 5.5),
  ex("f009", "Stretching (general)", "flexibility", 2.3, 1.5, 3.0),
  ex("f010", "Static stretching", "flexibility", 2.0, 1.5, 2.5),
  ex("f011", "Dynamic stretching", "flexibility", 2.8, 2.0, 3.5),
  ex("f012", "Foam rolling", "flexibility", 1.5, 1.0, 2.0),
  ex("f013", "Tai chi", "flexibility", 3.0, 2.5, 3.5),
  ex("f014", "Tai chi (vigorous)", "flexibility", 4.0, 3.0, 5.0),
  ex("f015", "Qi gong", "flexibility", 2.5, 2.0, 3.0),
  ex("f016", "Barre class (light)", "flexibility", 3.0, 2.0, 4.0),
  ex("f017", "Barre class (moderate)", "flexibility", 4.0, 3.0, 5.0),
  ex("f018", "Ballet (practice)", "flexibility", 4.8, 3.5, 6.5),
  ex("f019", "Contemporary dance", "flexibility", 5.0, 4.0, 7.0),
  ex("f020", "Flexibility class", "flexibility", 2.5, 2.0, 3.0),
  ex("f021", "Mobility drills", "flexibility", 2.5, 2.0, 3.5),
  ex("f022", "Yin yoga", "flexibility", 2.0, 1.5, 2.5),
  ex("f023", "AcroYoga", "flexibility", 4.5, 3.5, 6.0),
  ex("f024", "Meditation (seated)", "flexibility", 1.0, 1.0, 1.0),
  ex("f025", "Breathwork", "flexibility", 1.3, 1.0, 1.5),

  // ── SPORTS (40 exercises) ──────────────────────────────────────────────────

  // Ball sports
  ex("sp001", "Soccer (casual)", "sports", 7.0, 5.5, 9.0),
  ex("sp002", "Soccer (competitive)", "sports", 10.0, 8.5, 12.0),
  ex("sp003", "Basketball (casual)", "sports", 6.5, 5.0, 8.5),
  ex("sp004", "Basketball (competitive)", "sports", 8.0, 6.5, 10.0),
  ex("sp005", "Tennis (doubles)", "sports", 5.0, 4.0, 6.5),
  ex("sp006", "Tennis (singles)", "sports", 7.3, 5.5, 9.0),
  ex("sp007", "Volleyball (casual)", "sports", 3.0, 2.5, 4.0),
  ex("sp008", "Volleyball (competitive)", "sports", 6.0, 4.5, 8.0),
  ex("sp009", "Beach volleyball", "sports", 8.0, 6.5, 10.0),
  ex("sp010", "Baseball / softball", "sports", 5.0, 4.0, 6.5),
  ex("sp011", "Football (flag)", "sports", 7.8, 6.0, 10.0),
  ex("sp012", "Football (tackle, casual)", "sports", 8.0, 6.5, 10.5),
  ex("sp013", "Rugby", "sports", 8.3, 7.0, 11.0),
  ex("sp014", "Cricket", "sports", 4.8, 3.5, 6.5),
  ex("sp015", "Handball", "sports", 12.0, 9.5, 14.5),

  // Racquet sports
  ex("sp016", "Badminton (casual)", "sports", 4.5, 3.5, 5.5),
  ex("sp017", "Badminton (competitive)", "sports", 7.0, 5.5, 9.0),
  ex("sp018", "Squash", "sports", 12.0, 9.5, 15.0),
  ex("sp019", "Table tennis", "sports", 4.0, 3.0, 5.5),
  ex("sp020", "Pickleball", "sports", 4.5, 3.5, 6.0),

  // Water sports
  ex("sp021", "Kayaking", "sports", 5.0, 3.5, 7.0),
  ex("sp022", "Canoeing (moderate)", "sports", 5.8, 4.0, 7.5),
  ex("sp023", "Stand-up paddleboarding", "sports", 6.0, 4.5, 8.0),
  ex("sp024", "Surfing", "sports", 6.0, 3.5, 9.0),
  ex("sp025", "Water polo", "sports", 10.0, 8.0, 12.5),

  // Winter / other
  ex("sp026", "Downhill skiing", "sports", 6.8, 5.0, 9.0),
  ex("sp027", "Cross-country skiing (racing)", "sports", 14.0, 11.0, 17.0),
  ex("sp028", "Ice skating (recreational)", "sports", 5.5, 4.0, 7.5),
  ex("sp029", "Ice hockey", "sports", 10.0, 8.0, 12.5),
  ex("sp030", "Snowboarding", "sports", 5.3, 4.0, 7.5),

  // Martial arts
  ex("sp031", "Boxing (sparring)", "sports", 12.8, 10.0, 15.5),
  ex("sp032", "Boxing (heavy bag)", "sports", 9.5, 7.5, 12.0),
  ex("sp033", "Karate / martial arts", "sports", 10.3, 8.0, 13.0),
  ex("sp034", "Judo / wrestling", "sports", 10.5, 8.5, 13.0),
  ex("sp035", "Brazilian jiu-jitsu", "sports", 8.0, 6.0, 11.0),

  // Other sports
  ex("sp036", "Golf (walking, carrying bag)", "sports", 4.8, 3.5, 6.0),
  ex("sp037", "Golf (cart)", "sports", 3.5, 2.5, 4.5),
  ex("sp038", "Gymnastics", "sports", 3.8, 3.0, 5.5),
  ex("sp039", "Cycling (mountain bike racing)", "sports", 14.0, 11.0, 17.0),
  ex("sp040", "Triathlon (general)", "sports", 12.0, 10.0, 14.0),

  // ── DAILY ACTIVITY (35 exercises) ─────────────────────────────────────────

  // Household
  ex("d001", "Cleaning (light, dusting)", "daily_activity", 2.5, 2.0, 3.0),
  ex("d002", "Vacuuming", "daily_activity", 3.5, 3.0, 4.5),
  ex("d003", "Mopping floors", "daily_activity", 3.5, 3.0, 4.5),
  ex("d004", "Scrubbing floors (on hands/knees)", "daily_activity", 3.5, 3.0, 4.5),
  ex("d005", "Washing windows", "daily_activity", 3.0, 2.5, 4.0),
  ex("d006", "Making beds", "daily_activity", 2.0, 1.5, 2.5),
  ex("d007", "Carrying groceries (upstairs)", "daily_activity", 7.5, 6.0, 9.0),
  ex("d008", "Carrying groceries (level)", "daily_activity", 4.0, 3.0, 5.0),
  ex("d009", "Cooking (standing)", "daily_activity", 2.0, 1.5, 2.5),
  ex("d010", "Washing dishes (standing)", "daily_activity", 1.8, 1.5, 2.5),

  // Garden / outdoor
  ex("d011", "Gardening (general)", "daily_activity", 3.5, 3.0, 4.5),
  ex("d012", "Digging / spading", "daily_activity", 5.0, 4.0, 6.5),
  ex("d013", "Mowing lawn (push mower)", "daily_activity", 5.5, 4.5, 6.5),
  ex("d014", "Raking leaves", "daily_activity", 3.8, 3.0, 5.0),
  ex("d015", "Shoveling snow (hand)", "daily_activity", 6.0, 4.5, 7.5),
  ex("d016", "Chopping wood", "daily_activity", 4.9, 3.5, 6.5),
  ex("d017", "Watering garden (standing)", "daily_activity", 1.5, 1.0, 2.0),
  ex("d018", "Planting / weeding", "daily_activity", 3.5, 3.0, 4.5),

  // Childcare / occupation
  ex("d019", "Playing with children (light effort)", "daily_activity", 2.8, 2.0, 3.5),
  ex("d020", "Playing with children (moderate effort)", "daily_activity", 4.0, 3.0, 5.5),
  ex("d021", "Carrying infant / toddler", "daily_activity", 3.0, 2.0, 4.0),

  // Transport / commuting
  ex("d022", "Walking to work or errands", "daily_activity", 3.5, 3.0, 4.5),
  ex("d023", "Cycling to work (leisurely)", "daily_activity", 4.0, 3.5, 5.0),
  ex("d024", "Stair climbing (slow, no load)", "daily_activity", 4.0, 3.0, 5.5),
  ex("d025", "Stair climbing (fast)", "daily_activity", 8.8, 7.0, 10.5),

  // Standing / light activity
  ex("d026", "Standing (light work)", "daily_activity", 1.5, 1.2, 2.0),
  ex("d027", "Standing (active, e.g. retail)", "daily_activity", 2.0, 1.5, 2.5),
  ex("d028", "Light office work (standing desk)", "daily_activity", 1.8, 1.5, 2.0),
  ex("d029", "Packing / moving boxes", "daily_activity", 3.5, 3.0, 4.5),
  ex("d030", "Moving furniture", "daily_activity", 5.8, 4.5, 7.5),

  // Pets
  ex("d031", "Dog walking (light pace)", "daily_activity", 3.0, 2.5, 3.5),
  ex("d032", "Dog walking (brisk pace)", "daily_activity", 4.0, 3.0, 5.0),
  ex("d033", "Playing with dog (fetch etc.)", "daily_activity", 4.0, 3.0, 5.5),

  // Misc movement
  ex("d034", "Shopping (cart pushing)", "daily_activity", 2.3, 2.0, 3.0),
  ex("d035", "Dancing (social, ballroom)", "daily_activity", 4.5, 3.0, 6.0),
];
