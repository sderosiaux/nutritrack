/**
 * Lesson seed data — 24 articles across all 6 categories.
 * Categories: nutrition | sleep | stress | habits | fitness | mindfulness
 */

export interface SeedLesson {
  id: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  category: "nutrition" | "sleep" | "stress" | "habits" | "fitness" | "mindfulness";
  tags: string[];
  readTimeMin: number;
  order: number;
  publishedAt: string;
}

export const seedLessons: SeedLesson[] = [
  // ── Nutrition (5 articles) ─────────────────────────────────────────────
  {
    id: "lesson-nut-001",
    slug: "intro-to-macros",
    title: "Intro to Macronutrients",
    summary: "Understand the three main macros — protein, carbs, and fat — and why they matter.",
    category: "nutrition",
    tags: ["basics", "macros", "protein", "carbs", "fat"],
    readTimeMin: 5,
    order: 10,
    publishedAt: "2024-01-01",
    bodyMarkdown: `# Intro to Macronutrients

Macronutrients — often called "macros" — are the three main categories of nutrients your body needs in large amounts to function properly.

## The Three Macros

### Protein (4 kcal/g)
Protein is made of amino acids, the building blocks of muscle, enzymes, and hormones. Good sources include chicken, fish, eggs, beans, and dairy.

**Why it matters**: Muscle repair, immune function, satiety.

### Carbohydrates (4 kcal/g)
Carbs are your body's preferred energy source. They break down into glucose, which fuels your brain and muscles.

**Why it matters**: Energy, brain function, fiber for gut health.

### Fat (9 kcal/g)
Dietary fat supports hormone production, vitamin absorption (A, D, E, K), and cell membrane integrity.

**Why it matters**: Hormones, brain health, inflammation regulation.

## Practical Takeaway

A balanced diet typically provides:
- **Protein**: 15–30% of calories
- **Carbs**: 45–65% of calories
- **Fat**: 20–35% of calories

Start tracking and you'll quickly see where your current intake stands.`,
  },
  {
    id: "lesson-nut-002",
    slug: "calorie-deficit-explained",
    title: "Calorie Deficit Explained",
    summary: "The science behind weight loss — why a calorie deficit works and how to achieve it sustainably.",
    category: "nutrition",
    tags: ["calories", "weight-loss", "deficit", "tdee"],
    readTimeMin: 6,
    order: 11,
    publishedAt: "2024-01-02",
    bodyMarkdown: `# Calorie Deficit Explained

Weight loss fundamentally comes down to energy balance. When you consume fewer calories than you burn, your body taps stored fat for fuel.

## What Is TDEE?

Your **Total Daily Energy Expenditure (TDEE)** is the number of calories your body burns in 24 hours. It includes:

- **Basal Metabolic Rate (BMR)**: calories burned at rest (60–75% of TDEE)
- **Thermic Effect of Food (TEF)**: digesting food (~10%)
- **Physical Activity**: exercise + daily movement (15–30%)

## Creating a Deficit

A deficit of 500 kcal/day leads to roughly 0.5 kg (1 lb) of fat loss per week.

| Deficit | Weekly Loss |
|---------|-------------|
| 250 kcal | ~0.25 kg |
| 500 kcal | ~0.5 kg |
| 750 kcal | ~0.75 kg |

## Sustainability Tips

- Avoid deficits larger than 1000 kcal/day — muscle loss risk
- Prioritize protein (1.6–2.2g/kg bodyweight) to preserve muscle
- Adjust every 2–4 weeks as weight changes

The goal is steady, sustainable progress — not speed.`,
  },
  {
    id: "lesson-nut-003",
    slug: "fiber-and-gut-health",
    title: "Fiber and Gut Health",
    summary: "Dietary fiber is crucial for gut health, blood sugar control, and satiety. Here's how to get enough.",
    category: "nutrition",
    tags: ["fiber", "gut-health", "digestion", "vegetables"],
    readTimeMin: 5,
    order: 12,
    publishedAt: "2024-01-03",
    bodyMarkdown: `# Fiber and Gut Health

Most people consume far less fiber than recommended. The average is around 15g/day when the goal is 25–38g.

## Types of Fiber

### Soluble Fiber
Dissolves in water, forms a gel. Slows digestion, helps lower cholesterol.

**Sources**: oats, apples, beans, psyllium husk

### Insoluble Fiber
Doesn't dissolve in water. Adds bulk to stool, promotes regularity.

**Sources**: whole grains, nuts, vegetables, wheat bran

## Benefits

1. **Blood sugar control** — slows glucose absorption
2. **Satiety** — keeps you fuller longer
3. **Cholesterol** — soluble fiber binds bile acids
4. **Microbiome** — feeds beneficial gut bacteria
5. **Bowel regularity** — prevents constipation

## How to Increase Fiber

- Swap white rice for brown rice or quinoa
- Add legumes to soups and salads
- Eat fruit whole (not juice)
- Snack on nuts and seeds

Increase intake gradually and drink plenty of water to avoid discomfort.`,
  },
  {
    id: "lesson-nut-004",
    slug: "reading-nutrition-labels",
    title: "Reading Nutrition Labels",
    summary: "Learn to decode food labels — serving sizes, ingredient lists, and marketing tricks.",
    category: "nutrition",
    tags: ["labels", "packaging", "ingredients", "awareness"],
    readTimeMin: 4,
    order: 13,
    publishedAt: "2024-01-04",
    bodyMarkdown: `# Reading Nutrition Labels

Nutrition labels are packed with information — once you know how to read them.

## Serving Size

**Always check the serving size first.** A bag of chips labeled "150 kcal" may contain 2.5 servings — making the real total 375 kcal.

## The % Daily Value

Based on a 2,000 kcal diet. Use as a rough guide:
- **5% or less** = low in that nutrient
- **20% or more** = high in that nutrient

## Ingredients List

Ingredients are listed in **order of weight** (most to least). The first 3–5 ingredients make up the majority of the product.

**Red flags**: sugar listed multiple times under different names (high-fructose corn syrup, dextrose, maltose).

## Marketing Claims

| Claim | What It Means |
|-------|--------------|
| "Low fat" | ≤3g fat per serving (often high sugar) |
| "Sugar-free" | <0.5g per serving |
| "Natural" | No legal definition in most countries |
| "Multigrain" | Multiple grains — not necessarily whole grain |

## Practical Habit

Spend 10 seconds reading the label before adding a new packaged food to your cart. You'll quickly spot patterns.`,
  },
  {
    id: "lesson-nut-005",
    slug: "protein-sources-guide",
    title: "Complete Guide to Protein Sources",
    summary: "Animal and plant-based proteins — amino acid completeness, bioavailability, and practical tips.",
    category: "nutrition",
    tags: ["protein", "amino-acids", "plant-based", "meat"],
    readTimeMin: 6,
    order: 14,
    publishedAt: "2024-01-05",
    bodyMarkdown: `# Complete Guide to Protein Sources

Protein quality depends on two factors: amino acid profile and bioavailability.

## Complete vs Incomplete Proteins

A **complete protein** contains all 9 essential amino acids (EAAs) in adequate amounts.

**Complete sources**: meat, fish, eggs, dairy, soy, quinoa

**Incomplete sources** (missing 1+ EAA): most legumes, grains, nuts — but these can be combined.

## Protein Bioavailability

| Source | PDCAAS Score |
|--------|-------------|
| Whey protein | 1.00 |
| Eggs | 1.00 |
| Casein | 1.00 |
| Soy protein | 0.99 |
| Black beans | 0.75 |
| Wheat gluten | 0.25 |

## Animal Sources (per 100g cooked)

- Chicken breast: 31g protein, 165 kcal
- Tuna (canned): 30g, 132 kcal
- Greek yogurt: 10g, 59 kcal
- Eggs: 13g, 155 kcal

## Plant Sources (per 100g cooked)

- Tempeh: 19g, 193 kcal
- Edamame: 11g, 122 kcal
- Lentils: 9g, 116 kcal
- Chickpeas: 8g, 164 kcal

## Practical Tip

If you're plant-based, pair legumes + grains (e.g., rice and beans) to get all EAAs across your day.`,
  },

  // ── Hydration (3 articles) ─────────────────────────────────────────────
  {
    id: "lesson-hyd-001",
    slug: "hydration-basics",
    title: "Hydration Basics",
    summary: "How much water do you actually need? Signs of dehydration and practical hydration strategies.",
    category: "nutrition",
    tags: ["water", "hydration", "health"],
    readTimeMin: 4,
    order: 20,
    publishedAt: "2024-01-06",
    bodyMarkdown: `# Hydration Basics

Water is involved in nearly every bodily process — digestion, circulation, temperature regulation, and cognition.

## How Much Water?

A common guideline is **2–3 litres per day** for adults, but individual needs vary based on:

- Body size and composition
- Physical activity level
- Climate
- Diet (fruits and vegetables provide ~20% of water intake)

## Signs of Dehydration

- Urine color darker than pale yellow
- Headache
- Fatigue
- Difficulty concentrating
- Dry mouth and lips

## Practical Strategies

1. **Start the day with water** — drink 300–500ml before coffee
2. **Eat water-rich foods** — cucumber, watermelon, spinach
3. **Set reminders** — or use an app to track intake
4. **Drink before meals** — supports digestion and satiety
5. **Increase intake when exercising** — add 500ml per hour of moderate activity

## Electrolytes

For intense exercise (>1 hour), plain water may not be enough. Consider sodium, potassium, and magnesium from food or electrolyte tablets.`,
  },
  {
    id: "lesson-hyd-002",
    slug: "drinks-ranked",
    title: "Drinks Ranked by Hydration",
    summary: "Not all drinks hydrate equally. Learn which beverages help and which hinder.",
    category: "nutrition",
    tags: ["drinks", "coffee", "alcohol", "hydration"],
    readTimeMin: 4,
    order: 21,
    publishedAt: "2024-01-07",
    bodyMarkdown: `# Drinks Ranked by Hydration

## Best Hydrators

1. **Water** — the gold standard. Zero calories, zero drawbacks.
2. **Herbal tea (unsweetened)** — hydrates like water with bonus antioxidants.
3. **Sparkling water** — same hydration as still; the acidity is mild and not harmful for most people.
4. **Milk** — hydrates well due to protein and electrolytes; adds calories.
5. **Coconut water** — natural electrolytes; higher sugar than plain water.

## Moderate Hydrators

6. **Coffee** — mild diuretic effect is mostly offset by water content. 2–4 cups/day is fine.
7. **Tea (black/green)** — similar to coffee; hydrates net positive.
8. **Fruit juice** — hydrates but high in sugar; eat the fruit instead.

## Poor Hydrators

9. **Soda/sugary drinks** — net dehydrating over time due to sugar load.
10. **Alcohol** — strong diuretic. Drink one glass of water per alcoholic drink.
11. **Energy drinks** — high caffeine may increase urination.

## Takeaway

For most people, coffee and tea count toward daily fluid goals. Just offset alcohol with extra water.`,
  },

  // ── Sleep (3 articles) ─────────────────────────────────────────────────
  {
    id: "lesson-slp-001",
    slug: "sleep-and-weight",
    title: "How Sleep Affects Weight",
    summary: "Sleep deprivation disrupts hunger hormones and metabolism. Learn the connection.",
    category: "sleep",
    tags: ["sleep", "weight", "hormones", "cortisol", "ghrelin"],
    readTimeMin: 5,
    order: 30,
    publishedAt: "2024-01-08",
    bodyMarkdown: `# How Sleep Affects Weight

Sleep is a powerful regulator of metabolism and appetite. Just a few nights of poor sleep can shift your hunger hormones significantly.

## The Hormonal Connection

### Ghrelin (hunger hormone)
Sleep deprivation increases ghrelin levels — you feel hungrier.

### Leptin (satiety hormone)
Poor sleep decreases leptin — you feel less full even after eating.

### Cortisol (stress hormone)
Sleep debt raises cortisol, which promotes fat storage, especially visceral (belly) fat.

## The Research

Studies show that sleeping 5–6 hours vs 7–9 hours leads to:
- 24% more hunger
- Increased cravings for high-calorie, high-carb foods
- Slower metabolism
- More muscle loss (less fat loss) during calorie restriction

## Sleep Hygiene Basics

- **Consistent schedule** — same wake time every day, even weekends
- **Dark, cool room** — 16–19°C (60–66°F) is ideal
- **No screens 60 min before bed** — blue light suppresses melatonin
- **Limit caffeine after 2pm**

7–9 hours per night is not a luxury — it's a critical nutrition tool.`,
  },
  {
    id: "lesson-slp-002",
    slug: "sleep-optimization",
    title: "Optimizing Your Sleep Quality",
    summary: "Practical strategies to fall asleep faster, sleep deeper, and wake up refreshed.",
    category: "sleep",
    tags: ["sleep", "quality", "recovery", "routine"],
    readTimeMin: 5,
    order: 31,
    publishedAt: "2024-01-09",
    bodyMarkdown: `# Optimizing Your Sleep Quality

Good sleep isn't just about duration — quality matters enormously.

## Wind-Down Routine (60 min before bed)

1. Dim lights or use warm lighting
2. Stop work emails and social media
3. Light stretching or gentle yoga
4. Herbal tea (chamomile, valerian)
5. 10 minutes of reading (physical book preferred)

## Environment Optimization

- **Temperature**: 16–19°C — your core temperature needs to drop to initiate sleep
- **Darkness**: blackout curtains or sleep mask; even small LEDs matter
- **Sound**: white noise or earplugs if your environment is noisy
- **Mattress/pillow**: invest here before buying supplements

## Timing Your Exercise

Exercise improves sleep quality — but timing matters. High-intensity workouts within 3 hours of bedtime can make it harder to fall asleep for some people. Morning or afternoon exercise is ideal.

## The 20-Minute Rule

If you can't fall asleep after 20 minutes, get up. Do something calm in dim light until you feel sleepy, then return to bed. This strengthens the bed-sleep association.`,
  },
  {
    id: "lesson-slp-003",
    slug: "napping-guide",
    title: "The Science of Napping",
    summary: "When naps help and when they hurt — optimal nap duration and timing.",
    category: "sleep",
    tags: ["nap", "sleep", "productivity", "recovery"],
    readTimeMin: 4,
    order: 32,
    publishedAt: "2024-01-10",
    bodyMarkdown: `# The Science of Napping

## Nap Duration Matters

| Duration | Effect |
|----------|--------|
| 10–20 min (power nap) | Alertness boost, no grogginess |
| 30 min | May cause "sleep inertia" |
| 60 min | Deep sleep; groggy upon waking but useful for memory |
| 90 min | Full sleep cycle; feels refreshed, improves learning |

## Best Time to Nap

The ideal window is **1–3pm** — aligned with your natural circadian dip.

Napping after 3pm risks interfering with nighttime sleep.

## Who Benefits Most

- Night shift workers
- Athletes recovering from training
- Those compensating for one bad night (not as a chronic habit)

## Caffeine Nap

Drink a coffee, nap for 20 minutes. Caffeine takes ~20 min to peak, so you wake up right as it kicks in. Studies show this beats either coffee or nap alone for alertness.

## When to Skip the Nap

If you have insomnia or trouble sleeping at night, napping often makes it worse. Consolidating your sleep into one block is more effective.`,
  },

  // ── Stress (3 articles) ────────────────────────────────────────────────
  {
    id: "lesson-str-001",
    slug: "stress-eating-patterns",
    title: "Understanding Stress Eating",
    summary: "Why stress drives us to eat — and evidence-based techniques to break the cycle.",
    category: "stress",
    tags: ["stress", "eating", "cortisol", "emotional-eating"],
    readTimeMin: 5,
    order: 40,
    publishedAt: "2024-01-11",
    bodyMarkdown: `# Understanding Stress Eating

## Why Stress Makes Us Eat

When stressed, your body releases cortisol — a hormone that increases appetite and particularly cravings for high-fat, high-sugar foods.

From an evolutionary standpoint this made sense: stress meant physical danger requiring energy. Modern stress (work, finances, relationships) triggers the same system without the physical demand.

## The Reward Loop

Comfort foods temporarily boost dopamine and serotonin, providing real (but brief) relief. This creates a learned association: stress → food → feel better.

## Breaking the Cycle

### Pause Before Eating
When the urge to eat strikes, wait 5 minutes. Ask: am I physically hungry (stomach growling) or emotionally hungry (boredom, anxiety)?

### Identify the Real Need
Stress eating often masks another need. A short walk, calling a friend, or 5 minutes of journaling can address the root cause.

### Keep Better Options Available
If you do stress eat, have lower-calorie dense options (vegetables, fruit, plain yogurt) within reach.

### Reduce Overall Stress Load
Addressing the source through sleep, exercise, therapy, or workload management reduces the trigger.`,
  },
  {
    id: "lesson-str-002",
    slug: "breathwork-for-stress",
    title: "Breathwork for Stress Relief",
    summary: "Simple breathing techniques that activate the parasympathetic system for fast stress reduction.",
    category: "stress",
    tags: ["breathing", "stress", "anxiety", "nervous-system"],
    readTimeMin: 4,
    order: 41,
    publishedAt: "2024-01-12",
    bodyMarkdown: `# Breathwork for Stress Relief

Your breath is one of the few autonomic functions you can consciously control — and it directly influences your nervous system.

## How It Works

Slow, deep breathing activates the **parasympathetic nervous system** ("rest and digest"), counteracting the stress response ("fight or flight").

Extending your exhale beyond your inhale lowers heart rate within 30 seconds.

## Techniques

### 4-7-8 Breathing
- Inhale for 4 counts
- Hold for 7 counts
- Exhale for 8 counts
- Repeat 4 cycles

Good for falling asleep or acute anxiety.

### Box Breathing (used by Navy SEALs)
- Inhale for 4 counts
- Hold for 4 counts
- Exhale for 4 counts
- Hold for 4 counts
- Repeat 4–6 cycles

Good for staying calm under pressure.

### Physiological Sigh
- Double inhale through nose (short, then long)
- Long exhale through mouth

Research shows this is the fastest way to reduce physiological stress.

## Daily Practice

5 minutes of breathwork each morning, before meals, or during breaks. Consistency builds a stronger parasympathetic response over time.`,
  },

  // ── Habits (3 articles) ────────────────────────────────────────────────
  {
    id: "lesson-hab-001",
    slug: "habit-stacking",
    title: "Habit Stacking for Health",
    summary: "Use existing habits as anchors for new healthy behaviors — the most reliable way to build lasting change.",
    category: "habits",
    tags: ["habits", "behavior-change", "consistency", "routine"],
    readTimeMin: 5,
    order: 50,
    publishedAt: "2024-01-13",
    bodyMarkdown: `# Habit Stacking for Health

## What Is Habit Stacking?

Habit stacking means attaching a new behavior to an existing one:

**"After [CURRENT HABIT], I will [NEW HABIT]."**

Because the cue is built in, you don't need willpower — the existing habit triggers the new one.

## Examples

| Existing Habit | Stacked Habit |
|----------------|---------------|
| Morning coffee | Log breakfast |
| Brush teeth | Take supplements |
| Sit down for lunch | Fill water bottle |
| End of workday | 10-min walk |
| Watch TV | Prepare tomorrow's lunch |

## Why It Works

Neural pathways strengthen with repetition. By linking a new habit to a well-worn pathway, you borrow the existing pathway's automaticity.

## Building Your Stack

1. List your existing automatic habits
2. Choose one health habit to add
3. Find the right anchor habit (similar timing/context)
4. Start tiny — 2 minutes max
5. Track for 21+ days to solidify

## Common Mistakes

- **Too many new habits at once** — start with one
- **Wrong anchor** — anchor and new habit must share context
- **Skipping too often** — missing once is okay; missing twice is the start of breaking a habit`,
  },
  {
    id: "lesson-hab-002",
    slug: "meal-prep-fundamentals",
    title: "Meal Prep Fundamentals",
    summary: "A practical guide to weekly meal prep — save time, reduce decision fatigue, and stay on track.",
    category: "habits",
    tags: ["meal-prep", "cooking", "planning", "time-saving"],
    readTimeMin: 6,
    order: 51,
    publishedAt: "2024-01-14",
    bodyMarkdown: `# Meal Prep Fundamentals

## Why Meal Prep Works

Decision fatigue is real. When you're tired and hungry, you default to easy (often less nutritious) options. Meal prep eliminates the decision.

## The 2-Hour Sunday System

**Hour 1: Proteins**
Cook 2–3 protein sources in bulk:
- Baked chicken thighs (oven, 400°F, 35 min)
- Hard-boiled eggs (12 at once)
- Ground turkey or beef (stovetop, 15 min)

**Hour 2: Carbs + Vegetables**
- Rice cooker: brown rice or quinoa (set and forget)
- Sheet pan: roasted vegetables (400°F, 25 min)
- Wash and chop raw vegetables for snacks

## Storage Tips

- **Glass containers** beat plastic for freshness
- Label with day of week
- Proteins last 4–5 days refrigerated
- Soups and stews freeze well (3 months)

## Simplify Further

You don't need full recipes. A **component prep** approach is enough:
- Proteins: 2 types
- Carbs: 1–2 types
- Vegetables: roasted + raw

Combine components into different meals throughout the week.`,
  },
  {
    id: "lesson-hab-003",
    slug: "tracking-and-awareness",
    title: "The Power of Food Tracking",
    summary: "Why awareness is the first step to change — how to track without obsession.",
    category: "habits",
    tags: ["tracking", "awareness", "logging", "mindful-eating"],
    readTimeMin: 4,
    order: 52,
    publishedAt: "2024-01-15",
    bodyMarkdown: `# The Power of Food Tracking

## Awareness, Not Obsession

Research consistently shows that people underestimate their calorie intake by 20–40%. This isn't dishonesty — our portion perception is genuinely poor.

Tracking creates awareness without judgment.

## Benefits of Tracking

1. **Accurate baseline** — know where you actually are
2. **Pattern recognition** — identify problem meals/times
3. **Accountability** — harder to ignore choices
4. **Goal alignment** — see if you're hitting protein, fiber, water targets

## How to Track Without Obsession

- **Track 80%, not 100%** — social meals are fine to estimate
- **Use it for 4–8 weeks** to calibrate, then decide if you want to continue
- **Focus on trends** — one bad day doesn't matter
- **Log before eating** — planning ahead beats tracking regret

## When to Stop

Tracking becomes a problem if it causes anxiety, restricts social eating, or leads to eating disorder behaviors. Use it as a tool, not a rulebook.

## Getting Started

Log everything honestly for one week — no changes, just observation. The data will show you exactly where to focus first.`,
  },

  // ── Fitness (3 articles) ──────────────────────────────────────────────
  {
    id: "lesson-fit-001",
    slug: "strength-training-basics",
    title: "Strength Training for Beginners",
    summary: "Why resistance training matters beyond aesthetics — and how to start safely.",
    category: "fitness",
    tags: ["strength", "resistance", "muscle", "metabolism"],
    readTimeMin: 5,
    order: 60,
    publishedAt: "2024-01-16",
    bodyMarkdown: `# Strength Training for Beginners

## Why Strength Training?

- **Increases muscle mass** → higher resting metabolic rate
- **Improves insulin sensitivity** → better blood sugar control
- **Protects bone density** → critical after 30
- **Reduces injury risk** → stronger joints and connective tissue
- **Mental health** → as effective as antidepressants for mild-moderate depression in studies

## Core Principles

### Progressive Overload
Gradually increase the difficulty over time (more weight, reps, or sets). Without progression, muscles don't adapt.

### Compound Movements
The most efficient exercises work multiple muscle groups:
- **Squat**: quads, hamstrings, glutes, core
- **Deadlift**: hamstrings, glutes, back, core
- **Push-up/Bench**: chest, shoulders, triceps
- **Row**: back, biceps

### Recovery
Muscles grow during rest, not during training. Allow 48 hours between training the same muscle group.

## Beginner Program (3x/week)

Each session: Squat, Hip Hinge, Push, Pull, Core
- 3 sets of 8–12 reps
- Rest 90 seconds between sets
- Increase weight when you can complete all sets with good form`,
  },
  {
    id: "lesson-fit-002",
    slug: "cardio-types-guide",
    title: "LISS vs HIIT: Cardio Explained",
    summary: "Low-intensity steady-state vs high-intensity interval training — when each is appropriate.",
    category: "fitness",
    tags: ["cardio", "hiit", "liss", "exercise", "fat-burning"],
    readTimeMin: 5,
    order: 61,
    publishedAt: "2024-01-17",
    bodyMarkdown: `# LISS vs HIIT: Cardio Explained

## Low-Intensity Steady-State (LISS)

**Definition**: Sustained aerobic activity at 50–65% max heart rate for 30–60+ minutes.

**Examples**: Walking, light jogging, cycling, swimming

**Benefits**:
- Easy to recover from
- Sustainable daily activity
- Burns primarily fat at this intensity
- Improves aerobic base

**Best for**: Active recovery, daily movement goals, beginners

## High-Intensity Interval Training (HIIT)

**Definition**: Alternating bursts of maximum effort with recovery periods.

**Example**: 30 seconds sprint / 90 seconds walk, repeated 8–10 times.

**Benefits**:
- Time-efficient (20–30 min = equivalent to 45–60 min LISS)
- EPOC (afterburn effect) — elevated calorie burn for hours
- Improves VO2 max quickly

**Best for**: Time-limited schedules, breaking through plateaus, athletes

## Practical Recommendation

| Goal | Recommendation |
|------|---------------|
| Fat loss | 3–4x LISS/week + 1–2x HIIT |
| General fitness | 2–3x LISS + 1x HIIT |
| Athletic performance | Periodized program |

For most people: start with LISS daily (walking), add 1 HIIT session/week.`,
  },
  {
    id: "lesson-fit-003",
    slug: "recovery-and-rest-days",
    title: "Recovery: Why Rest Days Matter",
    summary: "Muscle growth, performance improvement, and injury prevention all happen during recovery.",
    category: "fitness",
    tags: ["recovery", "rest", "muscle", "overtraining"],
    readTimeMin: 4,
    order: 62,
    publishedAt: "2024-01-18",
    bodyMarkdown: `# Recovery: Why Rest Days Matter

## Adaptation Happens at Rest

Training provides the *stimulus*. Rest provides the *adaptation*.

During exercise, you create microtears in muscle fibers and deplete glycogen. During recovery:
- Muscle fibers repair and grow thicker
- Glycogen stores refill
- Nervous system recovers
- Hormones rebalance

## Signs You Need More Recovery

- **Performance declining** over 1–2 weeks
- **Persistent muscle soreness** (not just after leg day)
- **Sleep quality worsening**
- **Mood changes** — irritability, lack of motivation
- **Elevated resting heart rate** (+5–10 bpm above baseline)

## Active vs Passive Recovery

**Passive**: complete rest — reading, relaxation, gentle stretching

**Active**: light movement that promotes blood flow without adding stress:
- 20–30 min walk
- Light yoga or mobility work
- Swimming at easy pace

Active recovery generally accelerates recovery better than doing nothing.

## Programming Rest Days

Minimum: **1–2 rest or active recovery days per week**

For strength training:
- Beginners: 3 sessions/week, 4 rest days
- Intermediate: 4 sessions/week, 3 rest days`,
  },

  // ── Mindfulness (4 articles) ──────────────────────────────────────────
  {
    id: "lesson-min-001",
    slug: "mindful-eating-intro",
    title: "Introduction to Mindful Eating",
    summary: "Eat slower, enjoy more, and improve satiety signals by bringing awareness to meals.",
    category: "mindfulness",
    tags: ["mindful-eating", "awareness", "satiety", "habits"],
    readTimeMin: 4,
    order: 70,
    publishedAt: "2024-01-19",
    bodyMarkdown: `# Introduction to Mindful Eating

## What Is Mindful Eating?

Mindful eating applies the principles of mindfulness — non-judgmental present-moment awareness — to the experience of eating.

It's not a diet. It's a way of relating to food.

## The Satiety Signal Problem

It takes 15–20 minutes for fullness hormones (GLP-1, CCK) to signal the brain. If you eat fast, you can consume far more than needed before the signal arrives.

## Core Practices

### Eat Without Distractions
Phone down, TV off. Eating in front of screens leads to 10–25% more food consumption in studies.

### Slow Down Deliberately
- Put utensils down between bites
- Chew each bite 20+ times
- Aim for meals to take 15–20 minutes

### Hunger-Fullness Check
Before eating: rate hunger 1–10. Stop when you reach 6–7 (satisfied, not stuffed).

### Engage the Senses
Notice colors, textures, aromas, and flavors. Engagement increases satisfaction from smaller portions.

## Start Small

Apply mindful eating to just one meal per day for a week. Track how it affects hunger and fullness.`,
  },
  {
    id: "lesson-min-002",
    slug: "meditation-and-food",
    title: "Meditation for Healthier Eating",
    summary: "A short daily meditation practice reduces emotional eating and improves food-related decision making.",
    category: "mindfulness",
    tags: ["meditation", "mindfulness", "emotional-eating", "stress"],
    readTimeMin: 5,
    order: 71,
    publishedAt: "2024-01-20",
    bodyMarkdown: `# Meditation for Healthier Eating

## The Research

A 2014 meta-analysis found mindfulness-based interventions significantly reduce binge eating and emotional eating. Even 10 minutes per day showed measurable effects.

## How It Connects to Food

Meditation trains the prefrontal cortex — the rational decision-making part of your brain — to override impulse-driven eating cues from the limbic system.

## Getting Started: 5-Minute Morning Practice

1. Sit comfortably, eyes closed
2. Take 3 slow breaths
3. Notice physical sensations without judgment (tension, hunger, energy)
4. Set one intention for the day ("I'll notice before I eat if I'm actually hungry")
5. Three slow breaths to close

## Body Scan for Hunger

Once per day, especially before meals:
1. Pause and close eyes
2. Scan from head to stomach
3. Notice any sensations of actual physical hunger
4. Rate 1–10
5. Decide to eat or wait

This practice distinguishes physical hunger from emotional hunger.

## Apps & Resources

Many free options exist for guided meditation. Start with 5 minutes and build from there.`,
  },
  {
    id: "lesson-min-003",
    slug: "body-image-and-health",
    title: "Body Image and Health Goals",
    summary: "How your relationship with your body affects your food choices and long-term health outcomes.",
    category: "mindfulness",
    tags: ["body-image", "self-compassion", "mental-health", "motivation"],
    readTimeMin: 5,
    order: 72,
    publishedAt: "2024-01-21",
    bodyMarkdown: `# Body Image and Health Goals

## Why This Matters for Nutrition

Research shows that people with negative body image are more likely to:
- Engage in yo-yo dieting
- Stress eat
- Avoid exercise due to shame
- Develop disordered eating patterns

Paradoxically, self-criticism tends to undermine the very changes people are trying to make.

## The Self-Compassion Alternative

Self-compassion (treating yourself as you would a friend) is associated with:
- More consistent healthy behaviors
- Faster recovery from setbacks
- Less emotional eating
- Better long-term adherence

## Reframing Your Goals

**Away-from goals** ("I don't want to be fat") are less motivating and create shame.

**Toward goals** ("I want to have energy to play with my kids") build identity and intrinsic motivation.

## Practical Reframing

Replace: "I need to lose 10kg"
With: "I want to eat in a way that gives me energy and feels good"

Replace: "I'm bad for eating that cake"
With: "I noticed I ate when I wasn't hungry. What was I actually needing?"

## You Are Not Your Body Composition

Health at every size, functional fitness, energy, and mental wellbeing are all valid health goals. Weight is one biomarker among many.`,
  },
  {
    id: "lesson-min-004",
    slug: "gratitude-and-wellbeing",
    title: "Gratitude Practice for Wellbeing",
    summary: "Regular gratitude practice reduces stress, improves sleep, and supports healthier lifestyle choices.",
    category: "mindfulness",
    tags: ["gratitude", "wellbeing", "happiness", "mental-health"],
    readTimeMin: 4,
    order: 73,
    publishedAt: "2024-01-22",
    bodyMarkdown: `# Gratitude Practice for Wellbeing

## The Science

Over 40 studies link gratitude practice to improved wellbeing. Mechanisms include:
- Downregulation of the threat response (less cortisol)
- Increased dopamine and serotonin
- Improved sleep quality
- Strengthened social bonds

## Simple Daily Practice

### Morning (2 minutes)
Write 3 specific things you're grateful for. Be specific:
- Not: "I'm grateful for my health"
- Better: "I'm grateful my knee doesn't hurt this morning so I could take a walk"

### Evening (1 minute)
Note one thing that went well today and why.

## Why Specificity Matters

The brain habituates to vague positive thoughts. Specific, concrete details engage memory and imagery systems, creating a stronger emotional response.

## Connecting Gratitude to Health

Gratitude for your body — what it can do rather than how it looks — supports a healthier relationship with food and exercise:
- "My body carries me through the day"
- "I'm grateful I can cook a meal"
- "I'm glad I have access to fresh vegetables"

## Sustaining the Practice

Pair with an existing habit (morning coffee, brushing teeth). Just 3–5 minutes daily is enough to see benefits within 2–4 weeks.`,
  },
];

if (seedLessons.length < 20) {
  throw new Error(`Expected at least 20 seed lessons, got ${seedLessons.length}`);
}
