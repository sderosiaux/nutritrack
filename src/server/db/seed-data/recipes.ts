/**
 * Recipe seed data — 35 recipes across 5 categories.
 * Categories via tags: breakfast | lunch | dinner | snack | dessert
 * Macros calculated per serving from real ingredient data.
 */

export interface SeedRecipe {
  id: string;
  title: string;
  description: string;
  servings: number;
  prepTimeMins: number;
  cookTimeMins: number;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  steps: string[];
  caloriesPerServing: string;
  proteinPerServing: string;
  carbsPerServing: string;
  fatPerServing: string;
  fiberPerServing: string;
  published: boolean;
  source: "system";
}

// ── Breakfast (8 recipes) ────────────────────────────────────────────────────

const BREAKFAST: SeedRecipe[] = [
  {
    id: "recipe-b001",
    title: "Classic Overnight Oats",
    description: "No-cook oatmeal prep-ahead with banana and almond milk.",
    servings: 1, prepTimeMins: 5, cookTimeMins: 0, difficulty: "easy",
    tags: ["breakfast", "meal-prep", "vegetarian"],
    steps: [
      "Combine 80g rolled oats with 200ml almond milk in a jar.",
      "Add 1 tbsp chia seeds and stir well.",
      "Refrigerate overnight (at least 6 hours).",
      "Top with sliced banana and a drizzle of honey before eating.",
    ],
    caloriesPerServing: "380", proteinPerServing: "11", carbsPerServing: "62",
    fatPerServing: "9", fiberPerServing: "8", published: true, source: "system",
  },
  {
    id: "recipe-b002",
    title: "Scrambled Eggs & Avocado Toast",
    description: "Protein-rich eggs on whole grain toast with creamy avocado.",
    servings: 1, prepTimeMins: 5, cookTimeMins: 8, difficulty: "easy",
    tags: ["breakfast", "high-protein", "vegetarian"],
    steps: [
      "Toast 2 slices of whole grain bread.",
      "Whisk 3 eggs with a pinch of salt and pepper.",
      "Cook eggs over medium-low heat, stirring gently, until just set.",
      "Mash half an avocado on toast with lemon juice.",
      "Top with scrambled eggs. Sprinkle chili flakes if desired.",
    ],
    caloriesPerServing: "520", proteinPerServing: "28", carbsPerServing: "38",
    fatPerServing: "28", fiberPerServing: "9", published: true, source: "system",
  },
  {
    id: "recipe-b003",
    title: "Greek Yogurt Parfait",
    description: "Layered Greek yogurt with granola, berries, and honey.",
    servings: 1, prepTimeMins: 5, cookTimeMins: 0, difficulty: "easy",
    tags: ["breakfast", "snack", "vegetarian", "no-cook"],
    steps: [
      "Spoon 200g Greek yogurt into a bowl or glass.",
      "Layer with 40g granola.",
      "Top with 80g mixed berries.",
      "Drizzle with 1 tsp honey.",
    ],
    caloriesPerServing: "340", proteinPerServing: "20", carbsPerServing: "48",
    fatPerServing: "6", fiberPerServing: "4", published: true, source: "system",
  },
  {
    id: "recipe-b004",
    title: "Banana Protein Pancakes",
    description: "Fluffy 3-ingredient pancakes packed with protein.",
    servings: 2, prepTimeMins: 5, cookTimeMins: 10, difficulty: "easy",
    tags: ["breakfast", "high-protein", "vegetarian", "gluten-free"],
    steps: [
      "Mash 2 ripe bananas in a bowl.",
      "Mix in 4 eggs and 60g rolled oats.",
      "Heat a non-stick pan over medium heat with a little coconut oil.",
      "Pour small circles of batter, cook 2-3 min per side.",
      "Serve with fresh fruit or maple syrup.",
    ],
    caloriesPerServing: "290", proteinPerServing: "16", carbsPerServing: "38",
    fatPerServing: "8", fiberPerServing: "4", published: true, source: "system",
  },
  {
    id: "recipe-b005",
    title: "Veggie Omelette",
    description: "Fluffy egg omelette filled with spinach, peppers, and cheese.",
    servings: 1, prepTimeMins: 5, cookTimeMins: 8, difficulty: "easy",
    tags: ["breakfast", "high-protein", "vegetarian", "low-carb"],
    steps: [
      "Whisk 3 eggs with 2 tbsp milk, salt, and pepper.",
      "Sauté diced bell pepper and spinach in an oiled pan for 2 min.",
      "Pour egg mixture over veggies and cook on medium-low.",
      "When top begins to set, add 30g shredded cheese.",
      "Fold omelette in half and slide onto plate.",
    ],
    caloriesPerServing: "380", proteinPerServing: "30", carbsPerServing: "6",
    fatPerServing: "26", fiberPerServing: "2", published: true, source: "system",
  },
  {
    id: "recipe-b006",
    title: "Smoothie Bowl",
    description: "Thick blended smoothie topped with fruits, nuts, and seeds.",
    servings: 1, prepTimeMins: 10, cookTimeMins: 0, difficulty: "easy",
    tags: ["breakfast", "vegetarian", "vegan", "no-cook"],
    steps: [
      "Blend 200g frozen mixed berries with 150g frozen banana chunks.",
      "Add 50ml almond milk — use minimal liquid for thick texture.",
      "Pour into a bowl.",
      "Top with sliced fresh fruit, 2 tbsp granola, and 1 tsp chia seeds.",
    ],
    caloriesPerServing: "310", proteinPerServing: "5", carbsPerServing: "65",
    fatPerServing: "5", fiberPerServing: "9", published: true, source: "system",
  },
  {
    id: "recipe-b007",
    title: "Avocado Egg Cups",
    description: "Eggs baked inside avocado halves — simple and nutritious.",
    servings: 2, prepTimeMins: 5, cookTimeMins: 15, difficulty: "easy",
    tags: ["breakfast", "high-protein", "vegetarian", "keto", "gluten-free"],
    steps: [
      "Preheat oven to 200°C (400°F).",
      "Halve 2 avocados and remove pits. Scoop out a bit more flesh to fit egg.",
      "Place avocado halves in a baking dish, crack an egg into each.",
      "Season with salt, pepper, and chili flakes.",
      "Bake 12-15 min until eggs are set to your liking.",
    ],
    caloriesPerServing: "310", proteinPerServing: "13", carbsPerServing: "9",
    fatPerServing: "26", fiberPerServing: "7", published: true, source: "system",
  },
  {
    id: "recipe-b008",
    title: "Chia Seed Pudding",
    description: "Creamy pudding made with chia seeds and coconut milk.",
    servings: 2, prepTimeMins: 5, cookTimeMins: 0, difficulty: "easy",
    tags: ["breakfast", "snack", "vegetarian", "vegan", "meal-prep"],
    steps: [
      "Whisk 6 tbsp chia seeds into 400ml coconut milk.",
      "Add 1 tsp vanilla extract and 2 tsp maple syrup.",
      "Stir well — continue stirring for 5 minutes to prevent clumping.",
      "Refrigerate for at least 4 hours or overnight.",
      "Serve topped with mango slices and toasted coconut.",
    ],
    caloriesPerServing: "280", proteinPerServing: "7", carbsPerServing: "22",
    fatPerServing: "19", fiberPerServing: "10", published: true, source: "system",
  },
];

// ── Lunch (8 recipes) ─────────────────────────────────────────────────────────

const LUNCH: SeedRecipe[] = [
  {
    id: "recipe-l001",
    title: "Grilled Chicken Caesar Salad",
    description: "Classic Caesar salad topped with juicy grilled chicken.",
    servings: 1, prepTimeMins: 10, cookTimeMins: 15, difficulty: "easy",
    tags: ["lunch", "high-protein", "salad"],
    steps: [
      "Season 150g chicken breast with salt, pepper, and garlic powder.",
      "Grill or pan-fry 6-7 min per side until cooked through. Rest 5 min, slice.",
      "Toss romaine lettuce with 2 tbsp Caesar dressing and parmesan.",
      "Top with croutons and sliced chicken.",
    ],
    caloriesPerServing: "450", proteinPerServing: "42", carbsPerServing: "18",
    fatPerServing: "22", fiberPerServing: "3", published: true, source: "system",
  },
  {
    id: "recipe-l002",
    title: "Quinoa Buddha Bowl",
    description: "Nourishing grain bowl with roasted veggies and tahini dressing.",
    servings: 2, prepTimeMins: 15, cookTimeMins: 25, difficulty: "easy",
    tags: ["lunch", "dinner", "vegetarian", "vegan", "meal-prep"],
    steps: [
      "Cook 150g quinoa per package instructions.",
      "Toss chopped sweet potato, broccoli, and chickpeas in olive oil and cumin. Roast at 200°C for 20 min.",
      "Make dressing: whisk 2 tbsp tahini, lemon juice, garlic, and water.",
      "Assemble bowls with quinoa, roasted veggies, and greens.",
      "Drizzle with tahini dressing and sprinkle sesame seeds.",
    ],
    caloriesPerServing: "480", proteinPerServing: "18", carbsPerServing: "68",
    fatPerServing: "16", fiberPerServing: "12", published: true, source: "system",
  },
  {
    id: "recipe-l003",
    title: "Turkey & Hummus Wrap",
    description: "Quick whole wheat wrap with sliced turkey and fresh veggies.",
    servings: 1, prepTimeMins: 5, cookTimeMins: 0, difficulty: "easy",
    tags: ["lunch", "high-protein", "no-cook", "meal-prep"],
    steps: [
      "Spread 3 tbsp hummus over a whole wheat tortilla.",
      "Layer with 100g sliced turkey breast, spinach, cucumber, and tomato.",
      "Add a drizzle of lemon juice and sprinkle of feta if desired.",
      "Roll tightly and slice in half.",
    ],
    caloriesPerServing: "420", proteinPerServing: "32", carbsPerServing: "44",
    fatPerServing: "12", fiberPerServing: "7", published: true, source: "system",
  },
  {
    id: "recipe-l004",
    title: "Lentil Soup",
    description: "Hearty red lentil soup with warming spices.",
    servings: 4, prepTimeMins: 10, cookTimeMins: 30, difficulty: "easy",
    tags: ["lunch", "dinner", "vegetarian", "vegan", "meal-prep"],
    steps: [
      "Sauté onion, garlic, and carrots in olive oil for 5 min.",
      "Add 1 tsp cumin, 1 tsp turmeric, 0.5 tsp paprika and toast 1 min.",
      "Add 300g red lentils and 1.2L vegetable broth. Bring to boil.",
      "Simmer 20-25 min until lentils are very soft.",
      "Blend half the soup for a creamy texture. Season with lemon juice.",
    ],
    caloriesPerServing: "310", proteinPerServing: "17", carbsPerServing: "48",
    fatPerServing: "6", fiberPerServing: "14", published: true, source: "system",
  },
  {
    id: "recipe-l005",
    title: "Tuna Nicoise Salad",
    description: "Classic French salad with tuna, eggs, olives, and potatoes.",
    servings: 2, prepTimeMins: 15, cookTimeMins: 15, difficulty: "medium",
    tags: ["lunch", "high-protein", "salad"],
    steps: [
      "Boil 200g baby potatoes until tender, 12-15 min. Cool and halve.",
      "Boil 4 eggs for 7 min, cool, peel and halve.",
      "Blanch 100g green beans in boiling water 3 min, then ice-bath.",
      "Arrange greens, potatoes, beans, eggs, 1 can drained tuna, and olives.",
      "Dress with Dijon vinaigrette (mustard, olive oil, lemon juice, garlic).",
    ],
    caloriesPerServing: "460", proteinPerServing: "38", carbsPerServing: "30",
    fatPerServing: "20", fiberPerServing: "6", published: true, source: "system",
  },
  {
    id: "recipe-l006",
    title: "Caprese Chicken Sandwich",
    description: "Grilled chicken with fresh mozzarella, tomato, and basil.",
    servings: 1, prepTimeMins: 5, cookTimeMins: 12, difficulty: "easy",
    tags: ["lunch", "high-protein"],
    steps: [
      "Season and grill 120g chicken breast until cooked through.",
      "Toast a ciabatta roll.",
      "Slice fresh mozzarella and tomato.",
      "Layer chicken, mozzarella, tomato, and fresh basil on roll.",
      "Drizzle with balsamic glaze and olive oil.",
    ],
    caloriesPerServing: "490", proteinPerServing: "40", carbsPerServing: "36",
    fatPerServing: "18", fiberPerServing: "2", published: true, source: "system",
  },
  {
    id: "recipe-l007",
    title: "Asian Noodle Salad",
    description: "Cold soba noodles with crunchy veggies and sesame dressing.",
    servings: 2, prepTimeMins: 15, cookTimeMins: 8, difficulty: "easy",
    tags: ["lunch", "vegetarian", "vegan", "salad"],
    steps: [
      "Cook 200g soba noodles per package, rinse in cold water and drain.",
      "Julienne cucumber, carrots, and red cabbage.",
      "Make dressing: soy sauce, sesame oil, rice vinegar, ginger, garlic.",
      "Toss noodles and veggies with dressing.",
      "Top with sesame seeds, scallions, and crushed peanuts.",
    ],
    caloriesPerServing: "390", proteinPerServing: "14", carbsPerServing: "62",
    fatPerServing: "11", fiberPerServing: "5", published: true, source: "system",
  },
  {
    id: "recipe-l008",
    title: "Black Bean Burrito Bowl",
    description: "Mexican-inspired rice bowl with black beans and salsa.",
    servings: 2, prepTimeMins: 10, cookTimeMins: 20, difficulty: "easy",
    tags: ["lunch", "dinner", "vegetarian", "vegan", "meal-prep"],
    steps: [
      "Cook 150g brown rice per package instructions.",
      "Season 1 can drained black beans with cumin, chili powder, and garlic.",
      "Heat beans in pan 3-4 min.",
      "Assemble bowls with rice, beans, corn, avocado, salsa, and lime.",
      "Top with cilantro and a squeeze of lime juice.",
    ],
    caloriesPerServing: "430", proteinPerServing: "15", carbsPerServing: "75",
    fatPerServing: "9", fiberPerServing: "16", published: true, source: "system",
  },
];

// ── Dinner (8 recipes) ───────────────────────────────────────────────────────

const DINNER: SeedRecipe[] = [
  {
    id: "recipe-d001",
    title: "Baked Salmon with Roasted Vegetables",
    description: "Omega-3 rich salmon fillet baked with seasonal vegetables.",
    servings: 2, prepTimeMins: 10, cookTimeMins: 25, difficulty: "easy",
    tags: ["dinner", "high-protein", "gluten-free", "healthy"],
    steps: [
      "Preheat oven to 200°C. Line a baking tray.",
      "Toss broccoli, bell peppers, and zucchini in olive oil, salt, and herbs.",
      "Roast vegetables 15 min.",
      "Place 2 salmon fillets (150g each) on tray. Season with lemon, garlic, dill.",
      "Bake 12-15 min until salmon flakes easily.",
    ],
    caloriesPerServing: "480", proteinPerServing: "42", carbsPerServing: "18",
    fatPerServing: "26", fiberPerServing: "6", published: true, source: "system",
  },
  {
    id: "recipe-d002",
    title: "Chicken Stir-Fry",
    description: "Quick weeknight stir-fry with tender chicken and crisp vegetables.",
    servings: 2, prepTimeMins: 15, cookTimeMins: 12, difficulty: "easy",
    tags: ["dinner", "high-protein", "quick"],
    steps: [
      "Slice 300g chicken breast thin. Marinate in soy sauce, ginger, garlic 10 min.",
      "Heat wok or large pan on high heat with sesame oil.",
      "Stir-fry chicken 4-5 min until golden. Remove and set aside.",
      "Stir-fry broccoli, snap peas, carrots, and bell peppers 3-4 min.",
      "Return chicken, add stir-fry sauce and noodles or rice. Toss to combine.",
    ],
    caloriesPerServing: "420", proteinPerServing: "38", carbsPerServing: "32",
    fatPerServing: "12", fiberPerServing: "5", published: true, source: "system",
  },
  {
    id: "recipe-d003",
    title: "Beef Bolognese",
    description: "Classic Italian meat sauce over pasta — comfort food done right.",
    servings: 4, prepTimeMins: 10, cookTimeMins: 45, difficulty: "medium",
    tags: ["dinner", "high-protein", "italian", "meal-prep"],
    steps: [
      "Brown 500g lean ground beef in olive oil over high heat.",
      "Add diced onion, carrot, celery and cook 5 min.",
      "Stir in garlic, tomato paste, and Italian herbs.",
      "Add 1 can crushed tomatoes and 200ml beef broth. Simmer 30 min.",
      "Cook 400g pasta, toss with sauce, top with parmesan.",
    ],
    caloriesPerServing: "560", proteinPerServing: "38", carbsPerServing: "62",
    fatPerServing: "16", fiberPerServing: "5", published: true, source: "system",
  },
  {
    id: "recipe-d004",
    title: "Shrimp Tacos",
    description: "Seasoned shrimp in corn tortillas with mango salsa and lime.",
    servings: 2, prepTimeMins: 15, cookTimeMins: 8, difficulty: "easy",
    tags: ["dinner", "lunch", "seafood", "quick"],
    steps: [
      "Season 300g large shrimp with chili powder, cumin, garlic, and lime zest.",
      "Pan-fry shrimp 2-3 min per side until pink and cooked through.",
      "Make mango salsa: diced mango, red onion, cilantro, lime juice, chili.",
      "Warm corn tortillas in dry pan.",
      "Fill with shrimp, slaw, mango salsa, and avocado crema.",
    ],
    caloriesPerServing: "380", proteinPerServing: "32", carbsPerServing: "38",
    fatPerServing: "11", fiberPerServing: "5", published: true, source: "system",
  },
  {
    id: "recipe-d005",
    title: "Chickpea Curry",
    description: "Fragrant Indian-spiced chickpea curry with coconut milk.",
    servings: 4, prepTimeMins: 10, cookTimeMins: 25, difficulty: "easy",
    tags: ["dinner", "vegetarian", "vegan", "meal-prep", "gluten-free"],
    steps: [
      "Sauté onion, garlic, and ginger in coconut oil until soft.",
      "Add garam masala, cumin, coriander, and turmeric. Toast 1 min.",
      "Add 2 cans chickpeas, 1 can diced tomatoes, and 400ml coconut milk.",
      "Simmer 15 min. Add spinach in final 2 min.",
      "Serve with basmati rice or naan. Garnish with cilantro.",
    ],
    caloriesPerServing: "420", proteinPerServing: "14", carbsPerServing: "58",
    fatPerServing: "16", fiberPerServing: "12", published: true, source: "system",
  },
  {
    id: "recipe-d006",
    title: "Turkey Meatballs with Marinara",
    description: "Lean turkey meatballs in rich tomato sauce over zucchini noodles.",
    servings: 3, prepTimeMins: 20, cookTimeMins: 25, difficulty: "medium",
    tags: ["dinner", "high-protein", "low-carb", "gluten-free"],
    steps: [
      "Mix 500g ground turkey with egg, garlic, parmesan, herbs, and breadcrumbs.",
      "Form into 18 balls, place on baking tray.",
      "Bake at 200°C for 18-20 min until cooked through.",
      "Simmer marinara sauce with fresh basil.",
      "Serve meatballs on spiralized zucchini, topped with sauce and parmesan.",
    ],
    caloriesPerServing: "390", proteinPerServing: "40", carbsPerServing: "16",
    fatPerServing: "18", fiberPerServing: "4", published: true, source: "system",
  },
  {
    id: "recipe-d007",
    title: "Tofu Fried Rice",
    description: "Savory fried rice with crispy tofu, eggs, and vegetables.",
    servings: 2, prepTimeMins: 10, cookTimeMins: 15, difficulty: "easy",
    tags: ["dinner", "vegetarian", "vegan"],
    steps: [
      "Press and cube 250g firm tofu. Pan-fry in sesame oil until golden.",
      "Add diced onion, garlic, and frozen peas and carrots. Cook 3 min.",
      "Push aside, scramble 2 eggs in same pan.",
      "Add 300g cooked cold rice, soy sauce, and oyster sauce.",
      "Stir-fry everything together 3-4 min on high heat.",
    ],
    caloriesPerServing: "440", proteinPerServing: "22", carbsPerServing: "58",
    fatPerServing: "14", fiberPerServing: "5", published: true, source: "system",
  },
  {
    id: "recipe-d008",
    title: "Stuffed Bell Peppers",
    description: "Colorful peppers filled with ground turkey, rice, and cheese.",
    servings: 4, prepTimeMins: 15, cookTimeMins: 40, difficulty: "medium",
    tags: ["dinner", "high-protein", "meal-prep", "gluten-free"],
    steps: [
      "Cut tops off 4 large bell peppers and remove seeds. Parboil 3 min.",
      "Brown 400g ground turkey with onion, garlic, and Italian seasoning.",
      "Mix turkey with 200g cooked rice, diced tomatoes, and tomato paste.",
      "Fill peppers with mixture, top with shredded cheese.",
      "Bake covered at 190°C for 25 min, then 10 min uncovered.",
    ],
    caloriesPerServing: "420", proteinPerServing: "32", carbsPerServing: "38",
    fatPerServing: "14", fiberPerServing: "5", published: true, source: "system",
  },
];

// ── Snack (6 recipes) ─────────────────────────────────────────────────────────

const SNACK: SeedRecipe[] = [
  {
    id: "recipe-s001",
    title: "Apple Slices with Almond Butter",
    description: "Simple satisfying snack with natural sugars and healthy fats.",
    servings: 1, prepTimeMins: 2, cookTimeMins: 0, difficulty: "easy",
    tags: ["snack", "no-cook", "vegetarian", "vegan"],
    steps: [
      "Core and slice 1 medium apple into wedges.",
      "Measure 2 tbsp almond butter into a small bowl.",
      "Arrange apple slices around the almond butter for dipping.",
    ],
    caloriesPerServing: "240", proteinPerServing: "6", carbsPerServing: "32",
    fatPerServing: "12", fiberPerServing: "5", published: true, source: "system",
  },
  {
    id: "recipe-s002",
    title: "Protein Energy Balls",
    description: "No-bake oat balls with peanut butter, honey, and chocolate chips.",
    servings: 12, prepTimeMins: 15, cookTimeMins: 0, difficulty: "easy",
    tags: ["snack", "meal-prep", "no-cook", "vegetarian"],
    steps: [
      "Mix 200g rolled oats, 120g peanut butter, 4 tbsp honey, and 1 tsp vanilla.",
      "Add 60g chocolate chips and 2 tbsp chia seeds.",
      "Chill mixture 30 min until firm enough to roll.",
      "Roll into 24 balls (about 2 tbsp each).",
      "Store in fridge up to 2 weeks.",
    ],
    caloriesPerServing: "145", proteinPerServing: "5", carbsPerServing: "18",
    fatPerServing: "7", fiberPerServing: "2", published: true, source: "system",
  },
  {
    id: "recipe-s003",
    title: "Hummus & Veggie Sticks",
    description: "Classic hummus with crunchy fresh vegetable dippers.",
    servings: 2, prepTimeMins: 5, cookTimeMins: 0, difficulty: "easy",
    tags: ["snack", "vegetarian", "vegan", "no-cook"],
    steps: [
      "Scoop 80g hummus into a bowl.",
      "Cut carrots, celery, cucumber, and bell peppers into sticks.",
      "Arrange veggie sticks around the hummus.",
      "Sprinkle hummus with paprika and a drizzle of olive oil.",
    ],
    caloriesPerServing: "160", proteinPerServing: "6", carbsPerServing: "20",
    fatPerServing: "7", fiberPerServing: "6", published: true, source: "system",
  },
  {
    id: "recipe-s004",
    title: "Cottage Cheese with Pineapple",
    description: "High-protein cottage cheese with sweet pineapple.",
    servings: 1, prepTimeMins: 2, cookTimeMins: 0, difficulty: "easy",
    tags: ["snack", "high-protein", "no-cook", "vegetarian", "gluten-free"],
    steps: [
      "Spoon 200g cottage cheese into a bowl.",
      "Top with 100g fresh or canned pineapple chunks.",
      "Drizzle with honey and a sprinkle of cinnamon if desired.",
    ],
    caloriesPerServing: "195", proteinPerServing: "24", carbsPerServing: "18",
    fatPerServing: "3", fiberPerServing: "1", published: true, source: "system",
  },
  {
    id: "recipe-s005",
    title: "Edamame with Sea Salt",
    description: "Steamed edamame pods dusted with flaky sea salt.",
    servings: 1, prepTimeMins: 1, cookTimeMins: 5, difficulty: "easy",
    tags: ["snack", "vegetarian", "vegan", "high-protein", "gluten-free"],
    steps: [
      "Steam or microwave 150g frozen edamame pods 4-5 min until tender.",
      "Drain and pat dry.",
      "Sprinkle generously with flaky sea salt.",
      "Eat by squeezing beans out of pods.",
    ],
    caloriesPerServing: "188", proteinPerServing: "16", carbsPerServing: "14",
    fatPerServing: "8", fiberPerServing: "8", published: true, source: "system",
  },
  {
    id: "recipe-s006",
    title: "Rice Cakes with Avocado",
    description: "Light rice cakes topped with mashed avocado and cherry tomatoes.",
    servings: 1, prepTimeMins: 5, cookTimeMins: 0, difficulty: "easy",
    tags: ["snack", "vegetarian", "vegan", "gluten-free", "no-cook"],
    steps: [
      "Mash half an avocado with lemon juice, salt, and red pepper flakes.",
      "Spread evenly on 2-3 plain rice cakes.",
      "Top with halved cherry tomatoes and microgreens.",
      "Season with a pinch of flaky salt.",
    ],
    caloriesPerServing: "210", proteinPerServing: "4", carbsPerServing: "24",
    fatPerServing: "12", fiberPerServing: "5", published: true, source: "system",
  },
];

// ── Dessert (5 recipes) ───────────────────────────────────────────────────────

const DESSERT: SeedRecipe[] = [
  {
    id: "recipe-de001",
    title: "Dark Chocolate Bark",
    description: "Simple melted dark chocolate studded with nuts and dried fruit.",
    servings: 8, prepTimeMins: 10, cookTimeMins: 5, difficulty: "easy",
    tags: ["dessert", "snack", "vegetarian", "gluten-free"],
    steps: [
      "Melt 200g dark chocolate (70%+) in double boiler or microwave in bursts.",
      "Pour onto parchment-lined tray, spread thin.",
      "Scatter 40g mixed nuts, 30g dried cranberries, and sea salt flakes.",
      "Refrigerate 1 hour until firm.",
      "Break into pieces and store in airtight container.",
    ],
    caloriesPerServing: "165", proteinPerServing: "3", carbsPerServing: "16",
    fatPerServing: "11", fiberPerServing: "2", published: true, source: "system",
  },
  {
    id: "recipe-de002",
    title: "Banana Nice Cream",
    description: "One-ingredient frozen banana ice cream — naturally sweet and creamy.",
    servings: 2, prepTimeMins: 5, cookTimeMins: 0, difficulty: "easy",
    tags: ["dessert", "snack", "vegan", "vegetarian", "gluten-free", "no-cook"],
    steps: [
      "Peel and slice 4 ripe bananas. Freeze on tray overnight.",
      "Blend frozen banana chunks in food processor until creamy (1-2 min).",
      "Scrape sides often. The texture will resemble soft-serve.",
      "Serve immediately or freeze 1 more hour for firmer texture.",
      "Top with berries, granola, or nut butter.",
    ],
    caloriesPerServing: "180", proteinPerServing: "2", carbsPerServing: "46",
    fatPerServing: "1", fiberPerServing: "5", published: true, source: "system",
  },
  {
    id: "recipe-de003",
    title: "Baked Cinnamon Pears",
    description: "Warm baked pears with honey, cinnamon, and crushed walnuts.",
    servings: 2, prepTimeMins: 5, cookTimeMins: 25, difficulty: "easy",
    tags: ["dessert", "vegetarian", "gluten-free"],
    steps: [
      "Preheat oven to 180°C. Halve and core 2 ripe pears.",
      "Place cut-side up in baking dish.",
      "Mix 2 tbsp honey with 0.5 tsp cinnamon and 1 tbsp melted butter.",
      "Spoon over pears, top with 2 tbsp crushed walnuts.",
      "Bake 20-25 min until soft. Serve with yogurt or ice cream.",
    ],
    caloriesPerServing: "220", proteinPerServing: "2", carbsPerServing: "38",
    fatPerServing: "8", fiberPerServing: "5", published: true, source: "system",
  },
  {
    id: "recipe-de004",
    title: "Protein Chocolate Mousse",
    description: "Silky chocolate mousse made with Greek yogurt and cocoa.",
    servings: 2, prepTimeMins: 10, cookTimeMins: 0, difficulty: "easy",
    tags: ["dessert", "snack", "high-protein", "vegetarian", "gluten-free"],
    steps: [
      "Whisk 250g Greek yogurt until smooth.",
      "Sift in 2 tbsp cocoa powder and mix well.",
      "Add 2 tbsp honey or maple syrup and 1 tsp vanilla extract.",
      "Optional: fold in whipped cream for extra fluffiness.",
      "Chill 30 min. Serve with berries or dark chocolate shavings.",
    ],
    caloriesPerServing: "175", proteinPerServing: "14", carbsPerServing: "22",
    fatPerServing: "4", fiberPerServing: "2", published: true, source: "system",
  },
  {
    id: "recipe-de005",
    title: "Oatmeal Cookie Bites",
    description: "Chewy no-bake oatmeal bites that taste like cookies.",
    servings: 10, prepTimeMins: 10, cookTimeMins: 0, difficulty: "easy",
    tags: ["dessert", "snack", "vegetarian", "no-cook", "meal-prep"],
    steps: [
      "Mash 2 ripe bananas in a bowl.",
      "Stir in 200g rolled oats, 60g peanut butter, and 1 tsp cinnamon.",
      "Add 40g raisins or chocolate chips.",
      "Roll into 20 balls and place on parchment paper.",
      "Refrigerate 1 hour until firm. Store in fridge up to 1 week.",
    ],
    caloriesPerServing: "130", proteinPerServing: "4", carbsPerServing: "22",
    fatPerServing: "4", fiberPerServing: "2", published: true, source: "system",
  },
];

export const SEED_RECIPES: SeedRecipe[] = [
  ...BREAKFAST,
  ...LUNCH,
  ...DINNER,
  ...SNACK,
  ...DESSERT,
];
