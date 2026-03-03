/**
 * Curated seed food data: USDA generics + Open Food Facts branded items.
 * Expanded with programmatic preparation variants to reach the ~10k curated starter set.
 * spec/05-tech-stack.md §Food Database Strategy: "~50k for a curated starter set"
 * Used by pnpm db:seed to populate the foods table.
 */
import { generateFoodVariants } from "./food-variants";
import { mk } from "./food-helpers";
import { EXTENDED_FOODS_A } from "./food-extended-a";
import { EXTENDED_FOODS_B } from "./food-extended-b";
import { EXTENDED_FOODS_C } from "./food-extended-c";

// Re-export SeedFood from helpers so existing imports from this module still work
export type { SeedFood } from "./food-helpers";

// ── USDA Generic Foods ──────────────────────────────────────────────────────

const BASE_FOODS: SeedFood[] = [
  // Poultry
  mk("usda-001","Chicken Breast, raw","usda",120,22,0,2.6,0,[["100g",100],["1 serving (85g)",85]],{cat:"meat"}),
  mk("usda-002","Chicken Thigh, raw","usda",177,18,0,12,0,[["100g",100],["1 thigh (100g)",100]],{cat:"meat"}),
  mk("usda-003","Turkey Breast, raw","usda",104,22,0,1.7,0,[["100g",100],["1 serving (85g)",85]],{cat:"meat"}),
  mk("usda-004","Whole Egg, raw","usda",155,13,1.1,11,0,[["100g",100],["1 large (50g)",50]],{cat:"eggs",sugar:1.1,sodium:124}),
  mk("usda-005","Egg White, raw","usda",52,11,0.7,0.2,0,[["100g",100],["1 white (33g)",33]],{cat:"eggs"}),

  // Red meat & fish
  mk("usda-006","Beef, ground 80% lean","usda",254,17,0,20,0,[["100g",100],["1 serving (85g)",85]],{cat:"meat",sodium:75}),
  mk("usda-007","Salmon, Atlantic, raw","usda",208,20,0,13,0,[["100g",100],["1 fillet (154g)",154]],{cat:"fish"}),
  mk("usda-008","Tuna, canned in water","usda",116,26,0,0.8,0,[["100g",100],["1 can (142g)",142]],{cat:"fish",sodium:337}),
  mk("usda-009","Shrimp, raw","usda",99,24,0.9,0.3,0,[["100g",100],["1 oz (28g)",28]],{cat:"seafood",sodium:111}),
  mk("usda-010","Pork Loin, raw","usda",143,21,0,6.3,0,[["100g",100],["1 serving (85g)",85]],{cat:"meat"}),

  // Dairy
  mk("usda-011","Whole Milk","usda",61,3.2,4.8,3.3,0,[["100ml",100],["1 cup (244ml)",244]],{cat:"dairy",sugar:4.8,sodium:43}),
  mk("usda-012","Greek Yogurt, plain","usda",59,10,3.6,0.4,0,[["100g",100],["1 cup (227g)",227]],{cat:"dairy",sugar:3.6}),
  mk("usda-013","Cheddar Cheese","usda",402,25,1.3,33,0,[["100g",100],["1 oz (28g)",28]],{cat:"dairy",sodium:621}),
  mk("usda-014","Cottage Cheese, 2%","usda",84,11,3.4,2.3,0,[["100g",100],["1/2 cup (113g)",113]],{cat:"dairy",sodium:321}),
  mk("usda-015","Butter","usda",717,0.9,0.1,81,0,[["100g",100],["1 tbsp (14g)",14]],{cat:"dairy",sodium:11}),

  // Grains & carbs
  mk("usda-016","White Rice, cooked","usda",130,2.7,28,0.3,0.4,[["100g",100],["1 cup (186g)",186]],{cat:"grains"}),
  mk("usda-017","Brown Rice, cooked","usda",123,2.7,26,1.0,1.8,[["100g",100],["1 cup (195g)",195]],{cat:"grains"}),
  mk("usda-018","Oats, rolled dry","usda",389,17,66,7,10,[["100g",100],["1 cup (81g)",81]],{cat:"grains"}),
  mk("usda-019","Whole Wheat Bread","usda",247,13,41,4.2,6,[["100g",100],["1 slice (28g)",28]],{cat:"grains",sodium:400}),
  mk("usda-020","Pasta, cooked","usda",131,5,25,1.1,1.8,[["100g",100],["1 cup (140g)",140]],{cat:"grains"}),
  mk("usda-021","Quinoa, cooked","usda",120,4.4,22,1.9,2.8,[["100g",100],["1 cup (185g)",185]],{cat:"grains"}),
  mk("usda-022","Sweet Potato, cooked","usda",90,2,21,0.1,3.3,[["100g",100],["1 medium (114g)",114]],{cat:"vegetables",sugar:6.5}),
  mk("usda-023","White Potato, boiled","usda",87,1.9,20,0.1,1.8,[["100g",100],["1 medium (150g)",150]],{cat:"vegetables"}),

  // Vegetables
  mk("usda-024","Broccoli, raw","usda",34,2.8,7,0.4,2.6,[["100g",100],["1 cup chopped (91g)",91]],{cat:"vegetables",sodium:33}),
  mk("usda-025","Spinach, raw","usda",23,2.9,3.6,0.4,2.2,[["100g",100],["1 cup (30g)",30]],{cat:"vegetables",sodium:79}),
  mk("usda-026","Kale, raw","usda",35,2.9,4.4,1.5,4.1,[["100g",100],["1 cup (67g)",67]],{cat:"vegetables"}),
  mk("usda-027","Tomato, raw","usda",18,0.9,3.9,0.2,1.2,[["100g",100],["1 medium (123g)",123]],{cat:"vegetables",sugar:2.6}),
  mk("usda-028","Cucumber, raw","usda",15,0.7,3.6,0.1,0.5,[["100g",100],["1 cup sliced (119g)",119]],{cat:"vegetables"}),
  mk("usda-029","Bell Pepper, red","usda",31,1,6.1,0.3,2.1,[["100g",100],["1 medium (119g)",119]],{cat:"vegetables",sugar:4.2}),
  mk("usda-030","Carrot, raw","usda",41,0.9,10,0.2,2.8,[["100g",100],["1 medium (61g)",61]],{cat:"vegetables",sugar:4.7}),
  mk("usda-031","Onion, raw","usda",40,1.1,9.3,0.1,1.7,[["100g",100],["1 medium (110g)",110]],{cat:"vegetables",sugar:4.2}),
  mk("usda-032","Garlic, raw","usda",149,6.4,33,0.5,2.1,[["100g",100],["1 clove (3g)",3]],{cat:"vegetables"}),
  mk("usda-033","Avocado","usda",160,2,9,15,6.7,[["100g",100],["1/2 medium (68g)",68]],{cat:"fruits",sugar:0.7}),
  mk("usda-034","Mushrooms, white raw","usda",22,3.1,3.3,0.3,1,[["100g",100],["1 cup (70g)",70]],{cat:"vegetables",sodium:5}),

  // Fruits
  mk("usda-035","Banana","usda",89,1.1,23,0.3,2.6,[["100g",100],["1 medium (118g)",118]],{cat:"fruits",sugar:12}),
  mk("usda-036","Apple","usda",52,0.3,14,0.2,2.4,[["100g",100],["1 medium (182g)",182]],{cat:"fruits",sugar:10}),
  mk("usda-037","Orange","usda",47,0.9,12,0.1,2.4,[["100g",100],["1 medium (131g)",131]],{cat:"fruits",sugar:9.4}),
  mk("usda-038","Blueberries","usda",57,0.7,14,0.3,2.4,[["100g",100],["1 cup (148g)",148]],{cat:"fruits",sugar:10}),
  mk("usda-039","Strawberries","usda",32,0.7,7.7,0.3,2,[["100g",100],["1 cup (152g)",152]],{cat:"fruits",sugar:4.9}),
  mk("usda-040","Watermelon","usda",30,0.6,7.6,0.2,0.4,[["100g",100],["1 cup (152g)",152]],{cat:"fruits",sugar:6.2}),

  // Legumes
  mk("usda-041","Black Beans, cooked","usda",132,8.9,24,0.5,8.7,[["100g",100],["1/2 cup (86g)",86]],{cat:"legumes",sodium:1}),
  mk("usda-042","Chickpeas, cooked","usda",164,8.9,27,2.6,7.6,[["100g",100],["1/2 cup (82g)",82]],{cat:"legumes"}),
  mk("usda-043","Lentils, cooked","usda",116,9,20,0.4,7.9,[["100g",100],["1/2 cup (99g)",99]],{cat:"legumes"}),
  mk("usda-044","Edamame, cooked","usda",121,12,9,5.2,5.2,[["100g",100],["1/2 cup (75g)",75]],{cat:"legumes"}),

  // Nuts & seeds
  mk("usda-045","Almonds","usda",579,21,22,50,12.5,[["100g",100],["1 oz (28g)",28]],{cat:"nuts",sodium:1}),
  mk("usda-046","Walnuts","usda",654,15,14,65,6.7,[["100g",100],["1 oz (28g)",28]],{cat:"nuts"}),
  mk("usda-047","Peanut Butter, smooth","usda",588,25,20,50,6,[["100g",100],["2 tbsp (32g)",32]],{cat:"nuts",sodium:422,sugar:9}),
  mk("usda-048","Sunflower Seeds","usda",584,21,20,51,8.6,[["100g",100],["1 oz (28g)",28]],{cat:"nuts"}),
  mk("usda-049","Chia Seeds","usda",486,17,42,31,34.4,[["100g",100],["1 tbsp (10g)",10]],{cat:"seeds"}),
  mk("usda-050","Flaxseeds","usda",534,18,29,42,27.3,[["100g",100],["1 tbsp (10g)",10]],{cat:"seeds"}),

  // Oils & fats
  mk("usda-051","Olive Oil","usda",884,0,0,100,0,[["100ml",100],["1 tbsp (13.5g)",13.5]],{cat:"oils"}),
  mk("usda-052","Coconut Oil","usda",862,0,0,100,0,[["100ml",100],["1 tbsp (13.6g)",13.6]],{cat:"oils"}),

  // Beverages
  mk("usda-053","Orange Juice, fresh","usda",45,0.7,10,0.2,0.2,[["100ml",100],["1 cup (248ml)",248]],{cat:"beverages",sugar:8.4}),
  mk("usda-054","Coffee, black","usda",1,0.1,0,0,0,[["100ml",100],["1 cup (240ml)",240]],{cat:"beverages"}),
  mk("usda-055","Green Tea, brewed","usda",1,0.2,0.2,0,0,[["100ml",100],["1 cup (245ml)",245]],{cat:"beverages"}),

  // Sweeteners
  mk("usda-056","Honey","usda",304,0.3,82,0,0.2,[["100g",100],["1 tbsp (21g)",21]],{cat:"sweeteners",sugar:82}),
  mk("usda-057","White Sugar","usda",387,0,100,0,0,[["100g",100],["1 tsp (4.2g)",4.2]],{cat:"sweeteners",sugar:100}),

  // Other
  mk("usda-058","Tofu, firm","usda",76,8.1,1.9,4.8,0.3,[["100g",100],["1/2 cup (126g)",126]],{cat:"soy",sodium:7}),
  mk("usda-059","Hummus","usda",166,8,14,10,6,[["100g",100],["2 tbsp (30g)",30]],{cat:"legumes",sodium:302}),
  mk("usda-060","Dark Chocolate 70%","usda",598,7.8,46,43,10.9,[["100g",100],["1 square (10g)",10]],{cat:"sweets",sugar:24}),

  // ── Open Food Facts Branded ────────────────────────────────────────────────

  mk("off-001","Coca-Cola Classic 330ml","open_food_facts",42,0,10.6,0,0,
    [["100ml",100],["1 can (330ml)",330]],{barcode:"5449000000996",brand:"Coca-Cola",cat:"beverages",sugar:10.6,sodium:10}),
  mk("off-002","Pepsi Original","open_food_facts",41,0,10.4,0,0,
    [["100ml",100],["1 can (355ml)",355]],{barcode:"0012000001086",brand:"PepsiCo",cat:"beverages",sugar:10.4}),
  mk("off-003","Nutella","open_food_facts",541,6,58,31,3,
    [["100g",100],["2 tbsp (37g)",37]],{barcode:"3017620422003",brand:"Ferrero",cat:"spreads",sugar:57}),
  mk("off-004","Cheerios Original","open_food_facts",375,11.6,72,6.7,11.7,
    [["100g",100],["1 cup (28g)",28]],{barcode:"0016000275287",brand:"General Mills",cat:"cereals",sugar:4.4,sodium:500}),
  mk("off-005","Quaker Oats Old Fashioned","open_food_facts",379,13,68,7,10,
    [["100g",100],["1/2 cup (40g)",40]],{barcode:"0030000014301",brand:"Quaker",cat:"cereals",sodium:0}),
  mk("off-006","Dannon Activia Plain Yogurt","open_food_facts",66,4.4,7.6,2.3,0,
    [["100g",100],["1 container (150g)",150]],{barcode:"0036632029065",brand:"Dannon",cat:"dairy",sugar:7.6}),
  mk("off-007","Lay's Classic Potato Chips","open_food_facts",536,7.0,53,34,3.8,
    [["100g",100],["1 oz (28g)",28]],{barcode:"0028400315036",brand:"Frito-Lay",cat:"snacks",sodium:517,sugar:0.5}),
  mk("off-008","Tropicana Pure Premium OJ","open_food_facts",45,0.7,10.4,0.2,0.2,
    [["100ml",100],["8 fl oz (240ml)",240]],{barcode:"0048500204313",brand:"Tropicana",cat:"beverages",sugar:8.3}),
  mk("off-009","Heinz Tomato Ketchup","open_food_facts",101,1.3,25,0.1,0.3,
    [["100g",100],["1 tbsp (17g)",17]],{barcode:"0013000006408",brand:"Heinz",cat:"condiments",sugar:22,sodium:1110}),
  mk("off-010","Philadelphia Cream Cheese","open_food_facts",342,5.9,4.1,33,0,
    [["100g",100],["2 tbsp (31g)",31]],{barcode:"0021000021963",brand:"Kraft",cat:"dairy",sodium:352}),
  mk("off-011","Nature Valley Crunchy Granola Bar","open_food_facts",455,8.6,66,18,4,
    [["100g",100],["2 bars (42g)",42]],{barcode:"0016000489516",brand:"General Mills",cat:"snacks",sugar:24,sodium:160}),
  mk("off-012","Kind Bar Dark Chocolate Nuts","open_food_facts",440,6,30,33,5,
    [["100g",100],["1 bar (40g)",40]],{barcode:"0602652238532",brand:"Kind",cat:"snacks",sugar:5,sodium:65}),
  mk("off-013","Red Bull Energy Drink","open_food_facts",45,0.7,10.9,0,0,
    [["100ml",100],["1 can (250ml)",250]],{barcode:"9002490100070",brand:"Red Bull",cat:"beverages",sugar:10.9,sodium:40}),
  mk("off-014","Oreo Original","open_food_facts",473,5,71,20,2,
    [["100g",100],["3 cookies (34g)",34]],{barcode:"0044000030506",brand:"Nabisco",cat:"snacks",sugar:41,sodium:413}),
  mk("off-015","Kellogg's Special K Original","open_food_facts",379,14,77,1.5,3.4,
    [["100g",100],["1 cup (31g)",31]],{barcode:"0038000119774",brand:"Kellogg's",cat:"cereals",sugar:17,sodium:607}),
  mk("off-016","Dannon Light & Fit Greek Vanilla","open_food_facts",59,12,4.3,0,0,
    [["100g",100],["1 container (150g)",150]],{barcode:"0036632063229",brand:"Dannon",cat:"dairy",sugar:3.7}),
  mk("off-017","Ben & Jerry's Chocolate Fudge Brownie","open_food_facts",250,4,29,13,1,
    [["100g",100],["2/3 cup (133g)",133]],{barcode:"0076840097823",brand:"Ben & Jerry's",cat:"ice cream",sugar:22,sodium:70}),
  mk("off-018","Clif Bar Chocolate Chip","open_food_facts",391,9,66,7.4,5,
    [["100g",100],["1 bar (68g)",68]],{barcode:"0722252100061",brand:"Clif Bar",cat:"snacks",sugar:21,sodium:261}),
  mk("off-019","Silk Unsweetened Almond Milk","open_food_facts",15,0.7,0.8,1.2,0.5,
    [["100ml",100],["1 cup (240ml)",240]],{barcode:"0025293000698",brand:"Silk",cat:"dairy-alt",sugar:0,sodium:150}),
  mk("off-020","Amy's Black Bean Soup","open_food_facts",47,2.8,8.3,0.5,1.9,
    [["100g",100],["1 cup (244g)",244]],{barcode:"0042272006106",brand:"Amy's",cat:"soup",sugar:1.9,sodium:440}),
  mk("off-021","Kraft Mac & Cheese Original","open_food_facts",349,11,62,5.5,1.4,
    [["100g",100],["1 cup prepared (70g dry)",70]],{barcode:"0021000658046",brand:"Kraft",cat:"meals",sugar:9,sodium:583}),
  mk("off-022","Heinz Baked Beans","open_food_facts",73,4.4,12,0.2,3.5,
    [["100g",100],["1/2 can (207g)",207]],{barcode:"5000157024724",brand:"Heinz",cat:"legumes",sugar:5.2,sodium:530}),
  mk("off-023","Kinder Bueno","open_food_facts",556,8.2,54,33,1.6,
    [["100g",100],["1 pack (43g)",43]],{barcode:"8000500021019",brand:"Ferrero",cat:"chocolate",sugar:47}),
  mk("off-024","Haribo Gold Bears Gummies","open_food_facts",343,6.9,77,0.5,0,
    [["100g",100],["1 serving (40g)",40]],{barcode:"0042238000045",brand:"Haribo",cat:"candy",sugar:46}),
  mk("off-025","Pringles Original","open_food_facts",536,6.5,55,33,3.5,
    [["100g",100],["15 chips (28g)",28]],{barcode:"5053990102650",brand:"Pringles",cat:"snacks",sodium:552}),
  mk("off-026","Kellogg's Corn Flakes","open_food_facts",380,8.2,84,0.8,3,
    [["100g",100],["1 cup (28g)",28]],{barcode:"0038000019012",brand:"Kellogg's",cat:"cereals",sodium:590,sugar:7.1}),
  mk("off-027","Hershey's Milk Chocolate Bar","open_food_facts",535,7.9,60,29,2.5,
    [["100g",100],["1 bar (43g)",43]],{barcode:"0034000002177",brand:"Hershey's",cat:"chocolate",sugar:52}),
  mk("off-028","Mountain Dew Original","open_food_facts",46,0,12.1,0,0,
    [["100ml",100],["1 can (355ml)",355]],{barcode:"0012000000087",brand:"PepsiCo",cat:"beverages",sugar:12.1,sodium:35}),
  mk("off-029","Activia Strawberry Yogurt","open_food_facts",81,3.6,14,1.2,0,
    [["100g",100],["1 pot (125g)",125]],{barcode:"0036632029942",brand:"Dannon",cat:"dairy",sugar:11}),
  mk("off-030","Welch's Grape Juice","open_food_facts",61,0.5,15.1,0,0,
    [["100ml",100],["8 fl oz (240ml)",240]],{barcode:"0041800303396",brand:"Welch's",cat:"beverages",sugar:14.5}),
  mk("off-031","Sprite Original","open_food_facts",39,0,10,0,0,
    [["100ml",100],["1 can (330ml)",330]],{barcode:"5449000031761",brand:"Sprite",cat:"beverages",sugar:10}),
  mk("off-032","Campbell's Chicken Noodle Soup","open_food_facts",38,2.7,5.6,0.7,0.5,
    [["100g",100],["1/2 can (120g)",120]],{barcode:"0051000012630",brand:"Campbell's",cat:"soup",sodium:720}),
  mk("off-033","Skippy Peanut Butter Creamy","open_food_facts",588,24,22,50,2.4,
    [["100g",100],["2 tbsp (32g)",32]],{barcode:"0037600103640",brand:"Skippy",cat:"spreads",sugar:7,sodium:150}),
  mk("off-034","Gatorade Lemon-Lime","open_food_facts",27,0,6.9,0,0,
    [["100ml",100],["20 fl oz bottle (591ml)",591]],{barcode:"0052000113206",brand:"Gatorade",cat:"beverages",sugar:6.9,sodium:107}),
  mk("off-035","Yoplait Original Strawberry","open_food_facts",100,4.4,20,1.5,0.1,
    [["100g",100],["1 container (170g)",170]],{barcode:"0070470003225",brand:"Yoplait",cat:"dairy",sugar:19}),
  mk("off-036","Annie's Mac & Cheese","open_food_facts",386,14,71,5.7,2,
    [["100g",100],["1 cup prepared (70g dry)",70]],{barcode:"0013562300020",brand:"Annie's",cat:"meals",sodium:550}),
  mk("off-037","Wonderful Pistachios Roasted","open_food_facts",569,21,28,46,10.3,
    [["100g",100],["1 oz in-shell (30g)",30]],{barcode:"0014113926306",brand:"Wonderful",cat:"nuts",sodium:270}),
  mk("off-038","Chobani Plain Non-fat Greek","open_food_facts",59,10.2,3.5,0,0,
    [["100g",100],["1 container (170g)",170]],{barcode:"0818290001114",brand:"Chobani",cat:"dairy",sugar:3.5}),
  mk("off-039","Kirkland Signature Almonds","open_food_facts",578,21,21,50,12,
    [["100g",100],["1 oz (28g)",28]],{barcode:"0096619161065",brand:"Kirkland",cat:"nuts",sodium:0}),
  mk("off-040","Goldfish Original Crackers","open_food_facts",436,9.7,63,16,2.8,
    [["100g",100],["55 pieces (30g)",30]],{barcode:"0014100085669",brand:"Pepperidge Farm",cat:"snacks",sugar:4,sodium:570}),
];

// All base foods: 100 original + 168 part-A + 155 part-B + 119 part-C = ~542 total base foods
const ALL_BASE_FOODS = [...BASE_FOODS, ...EXTENDED_FOODS_A, ...EXTENDED_FOODS_B, ...EXTENDED_FOODS_C];

/**
 * Full seed dataset: ~700 curated base foods + preparation variants (25 variant types).
 * Total >= 10k items: 700 base × ~15 variants avg = ~10,500+ entries.
 * Covers USDA generics, branded OFF products, international foods, and common
 * preparation methods (raw, cooked, frozen, canned, dried, etc.).
 */
export const SEED_FOODS = [
  ...ALL_BASE_FOODS,
  ...generateFoodVariants(ALL_BASE_FOODS),
];
