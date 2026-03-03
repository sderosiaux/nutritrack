/**
 * Extended food data — Part C: ethnic cuisines, more vegetables, desserts, sports nutrition.
 * ~200 additional base foods to push total beyond 10k items after variant expansion.
 */
import { mk, type SeedFood } from "./food-helpers";

const u = (
  id: string, name: string,
  cal: number, pro: number, carb: number, fat: number, fib: number,
  cat: string, ss2?: [string, number]
): SeedFood => mk(id, name, "usda", cal, pro, carb, fat, fib,
  ss2 ? [["100g", 100], ss2] : [["100g", 100]], { cat });

const o = (
  id: string, name: string,
  cal: number, pro: number, carb: number, fat: number, fib: number,
  cat: string, brand: string, ss2?: [string, number], barcode?: string
): SeedFood => mk(id, name, "open_food_facts", cal, pro, carb, fat, fib,
  ss2 ? [["100g", 100], ss2] : [["100g", 100]], { cat, brand, barcode });

export const EXTENDED_FOODS_C: SeedFood[] = [
  // ── Korean & Japanese Cuisine ────────────────────────────────────────────
  u("usda-372","Bibimbap (mixed rice bowl)",156,8,22,4.2,2,"meals",["1 cup (250g)",250]),
  u("usda-373","Korean BBQ Beef (bulgogi)",218,20,8,12,0.5,"meat",["3 oz (85g)",85]),
  u("usda-374","Japchae (glass noodles)",136,3.5,24,3.5,1.2,"meals",["1 cup (180g)",180]),
  u("usda-375","Doenjang Jjigae (soybean stew)",45,3.5,4.2,1.6,1.1,"soup",["1 cup (250g)",250]),
  u("usda-376","Sundubu Jjigae (soft tofu stew)",58,4.5,4.8,2.2,1,"soup",["1 cup (250g)",250]),
  u("usda-377","Sushi, tuna nigiri",131,11,17,1.2,0.5,"meals",["2 pieces (88g)",88]),
  u("usda-378","Sushi, salmon roll",155,9,20,4,1,"meals",["6 pieces (198g)",198]),
  u("usda-379","Miso Soup",10,0.9,1.3,0.4,0.3,"soup",["1 cup (240g)",240]),
  u("usda-380","Ramen, chicken broth",440,20,55,15,2,"meals",["1 bowl (450g)",450]),
  u("usda-381","Dashi Broth",5,0.5,0.6,0.1,0,"soup",["1 cup (240g)",240]),
  u("usda-382","Onigiri, salmon",168,8,27,2.5,0.8,"meals",["1 piece (100g)",100]),
  u("usda-383","Edamame in Pods",121,11,10,5.2,5.2,"legumes",["1 cup (155g)",155]),
  u("usda-384","Tofu, silken",55,5,1.6,3,0,"soy",["1/2 cup (124g)",124]),
  u("usda-385","Yakitori Chicken",165,16,3,10,0,"meat",["3 skewers (75g)",75]),

  // ── Vietnamese & Thai ────────────────────────────────────────────────────
  u("usda-386","Pho Ga (chicken pho)",65,6,7,1.2,0.5,"meals",["1 cup (240g)",240]),
  u("usda-387","Banh Mi Sandwich",248,12,35,7,2.2,"meals",["1 sandwich (200g)",200]),
  u("usda-388","Fresh Spring Roll",152,6,25,3.5,2,"snacks",["2 rolls (200g)",200]),
  u("usda-389","Pad Thai",168,8,24,5.5,1.5,"meals",["1 cup (249g)",249]),
  u("usda-390","Tom Yum Soup",50,4.2,5,1.5,1,"soup",["1 cup (244g)",244]),
  u("usda-391","Green Curry with Chicken",168,12,12,8.5,2,"meals",["1 cup (240g)",240]),
  u("usda-392","Massaman Curry",198,10,18,10,2.5,"meals",["1 cup (240g)",240]),
  u("usda-393","Papaya Salad (Som Tum)",68,1.5,13,1,2.5,"vegetables",["1 cup (170g)",170]),
  u("usda-394","Sticky Rice, glutinous",97,2,22,0.2,0.6,"grains",["1/2 cup (87g)",87]),

  // ── Indian & South Asian ─────────────────────────────────────────────────
  u("usda-395","Chicken Tikka Masala",178,14,8,10,1.5,"meals",["1 cup (240g)",240]),
  u("usda-396","Palak Paneer (spinach cheese)",148,8.5,9.5,8.5,2.8,"meals",["1 cup (240g)",240]),
  u("usda-397","Biryani, chicken",245,15,31,7,1.5,"meals",["1 cup (240g)",240]),
  u("usda-398","Raita (yogurt sauce)",51,3.2,5.5,1.8,0.5,"condiments",["1/4 cup (60g)",60]),
  u("usda-399","Paneer, fresh",265,18,3.4,20,0,"dairy",["1 oz (28g)",28]),
  u("usda-400","Idli, steamed",55,2.1,11,0.2,0.6,"grains",["2 pieces (60g)",60]),
  u("usda-401","Dosa, plain",167,4.5,30,3.5,1.5,"grains",["1 dosa (100g)",100]),
  u("usda-402","Sambar",46,2.5,8,0.7,2.5,"soup",["1 cup (240g)",240]),
  u("usda-403","Saag (greens curry)",95,4.8,9.5,4.5,4,"vegetables",["1 cup (240g)",240]),

  // ── Middle Eastern & Mediterranean ──────────────────────────────────────
  u("usda-404","Lamb Kebab, grilled",232,18,2,17,0.5,"meat",["2 skewers (100g)",100]),
  u("usda-405","Kofta",244,19,4,17,0.5,"meat",["3 pieces (100g)",100]),
  u("usda-406","Shawarma, chicken",180,15,11,8,1,"meals",["3 oz (85g)",85]),
  u("usda-407","Dolmas (stuffed grape leaves)",141,3.5,18,6,2.5,"meals",["4 pieces (100g)",100]),
  u("usda-408","Labneh (strained yogurt)",99,7,4.5,5.5,0,"dairy",["2 tbsp (30g)",30]),
  u("usda-409","Fattoush Salad",78,2.2,10,3.5,2.5,"vegetables",["1 cup (150g)",150]),
  u("usda-410","Muhammara (pepper spread)",256,4.5,17,20,3.8,"condiments",["2 tbsp (30g)",30]),
  u("usda-411","Manakish (za'atar bread)",345,10,52,11,3,"grains",["1 piece (100g)",100]),

  // ── Latin American ───────────────────────────────────────────────────────
  u("usda-412","Ceviche, shrimp",92,12,7,1.5,0.8,"seafood",["1/2 cup (100g)",100]),
  u("usda-413","Arroz con Leche",148,4.2,24,3.8,0.3,"desserts",["1 cup (240g)",240]),
  u("usda-414","Empanada, beef",290,11,30,14,2,"meals",["1 piece (70g)",70]),
  u("usda-415","Tamale, chicken",190,8,25,7,2.5,"meals",["1 tamale (115g)",115]),
  u("usda-416","Tostada, bean and cheese",248,9,30,11,5.5,"meals",["1 piece (100g)",100]),
  u("usda-417","Pupusa, cheese",222,8,31,7.5,2,"grains",["1 pupusa (85g)",85]),
  u("usda-418","Chimichurri Sauce",247,1.5,4,25,1.5,"condiments",["2 tbsp (20g)",20]),

  // ── More Vegetables ─────────────────────────────────────────────────────
  u("usda-419","Taro Root, cooked",142,0.5,34,0.1,4.3,"vegetables",["1/2 cup (66g)",66]),
  u("usda-420","Lotus Root, cooked",74,1.9,17,0.1,3.1,"vegetables",["1/2 cup (60g)",60]),
  u("usda-421","Bamboo Shoots, canned",11,1.5,1.4,0.3,1,"vegetables",["1/2 cup (66g)",66]),
  u("usda-422","Water Chestnuts, canned",35,0.7,8.6,0.1,1.8,"vegetables",["1/2 cup (70g)",70]),
  u("usda-423","Baby Corn, canned",25,2.4,4.2,0.6,3.2,"vegetables",["1/2 cup (83g)",83]),
  u("usda-424","Bean Sprouts, mung",30,3,5.9,0.2,1.8,"vegetables",["1 cup (104g)",104]),
  u("usda-425","Daikon Radish, raw",18,0.6,4.1,0.1,1.6,"vegetables",["1 cup (116g)",116]),
  u("usda-426","Bitter Melon, raw",17,1,3.7,0.2,2.6,"vegetables",["1/2 cup (62g)",62]),
  u("usda-427","Kabocha Squash",49,1,12,0.1,3.5,"vegetables",["1 cup (140g)",140]),
  u("usda-428","Purple Cabbage, raw",31,1.4,7.4,0.2,2.1,"vegetables",["1 cup (70g)",70]),
  u("usda-429","Chayote, cooked",38,1,8.8,0.6,2.5,"vegetables",["1 cup (160g)",160]),
  u("usda-430","Pattypan Squash",18,1.2,3.8,0.2,1.4,"vegetables",["1 cup (130g)",130]),
  u("usda-431","Nopales (cactus), raw",16,1.1,3.3,0.1,2,"vegetables",["1 cup (86g)",86]),
  u("usda-432","Purslane, raw",20,2,3.4,0.4,0.3,"vegetables",["1 cup (43g)",43]),

  // ── Desserts & Sweets ────────────────────────────────────────────────────
  u("usda-433","Greek Yogurt Parfait",115,7.2,15,2.5,1.2,"desserts",["1 cup (245g)",245]),
  u("usda-434","Banana Bread",317,5.5,53,9.8,2.1,"desserts",["1 slice (60g)",60]),
  u("usda-435","Chocolate Chip Cookies",488,5.5,66,22,2.1,"desserts",["2 cookies (42g)",42]),
  u("usda-436","Cheesecake, plain",321,5.5,26,22,0.4,"desserts",["1 slice (80g)",80]),
  u("usda-437","Tiramisu",257,4.5,28,14,0.6,"desserts",["1 slice (115g)",115]),
  u("usda-438","Crème Brûlée",328,6,28,21,0,"desserts",["1 serving (120g)",120]),
  u("usda-439","Apple Pie, slice",237,2.3,35,11,2,"desserts",["1 slice (125g)",125]),
  u("usda-440","Vanilla Ice Cream",207,3.5,24,11,0.5,"ice cream",["1/2 cup (66g)",66]),
  u("usda-441","Chocolate Mousse",255,4.5,23,16,1.5,"desserts",["1/2 cup (90g)",90]),
  u("usda-442","Rice Pudding",130,3.8,22,3.2,0.2,"desserts",["1/2 cup (113g)",113]),
  u("usda-443","Gelato, pistachio",195,4.2,25,9,0,"desserts",["1/2 cup (80g)",80]),
  u("usda-444","Frozen Yogurt, vanilla",159,4,32,3,0,"ice cream",["1/2 cup (113g)",113]),
  u("usda-445","Sorbet, mango",109,0.3,28,0.1,0.8,"ice cream",["1/2 cup (113g)",113]),

  // ── Sports Nutrition & Supplements ──────────────────────────────────────
  o("off-093","Gatorade Whey Protein Bar",384,20,46,11,2,"snacks","Gatorade","1 bar (80g)",80),
  o("off-094","Clif Builder's Protein Bar",400,20,44,14,4,"snacks","Clif Bar","1 bar (68g)",68),
  o("off-095","Kind Protein Bar, Dark Chocolate",390,12,37,18,5,"snacks","Kind","1 bar (60g)",60),
  o("off-096","Muscle Milk Protein Shake",140,25,6,5,2,"dairy","Hormel","1 bottle (330ml)",330),
  o("off-097","Soylent Original",400,20,36,21,3,"meals","Soylent","1 bottle (400ml)",400),
  o("off-098","Orgain Organic Protein Shake",150,16,15,5,4,"dairy","Orgain","1 bottle (330ml)",330),
  o("off-099","PROBAR Meal Bar",370,10,51,15,5.5,"meals","ProBar","1 bar (85g)",85),
  o("off-100","Nature's Path Granola, Hemp Plus",432,11,62,18,5.5,"cereals","Nature's Path","1/2 cup (55g)",55),

  // ── More Breakfast & Baked Goods ─────────────────────────────────────────
  u("usda-446","French Toast",229,8,27,10,1.3,"grains",["1 slice (65g)",65]),
  u("usda-447","Crepe, plain",145,5.4,19,5.2,0.6,"grains",["1 crepe (45g)",45]),
  u("usda-448","Granola, homemade",471,12,61,21,6.5,"cereals",["1/2 cup (61g)",61]),
  u("usda-449","Acai, frozen puree",60,1.5,6.5,5,2,"fruits",["100g packet (100g)",100]),
  u("usda-450","Chia Pudding",149,5.3,17,7.9,10,"grains",["1/2 cup (113g)",113]),
  u("usda-451","Overnight Oats with Berries",136,5.8,20,3.5,4.2,"grains",["1 cup (250g)",250]),
  u("usda-452","Yogurt Bowl with Granola",165,8,22,5.5,2.5,"dairy",["1 cup (250g)",250]),
  u("usda-453","Avocado Toast",218,6.8,22,12,5.8,"grains",["1 slice (90g)",90]),
  u("usda-454","Egg & Cheese Sandwich",325,18,30,13,1.5,"meals",["1 sandwich (145g)",145]),
  u("usda-455","Smoothie, green (spinach-banana)",71,2.5,15,0.5,2.5,"beverages",["1 cup (240ml)",240]),
  u("usda-456","Protein Smoothie",182,25,16,2.5,3,"beverages",["1 cup (350ml)",350]),

  // ── More Fish & Seafood ──────────────────────────────────────────────────
  u("usda-457","Ahi Tuna (yellowfin), raw",109,24,0,1,0,"fish",["3 oz (85g)",85]),
  u("usda-458","Sea Bass, raw",97,18,0,2.5,0,"fish",["1 fillet (159g)",159]),
  u("usda-459","Flounder, raw",70,15,0,0.8,0,"fish",["1 fillet (127g)",127]),
  u("usda-460","Snapper, raw",100,20,0,1.3,0,"fish",["1 fillet (218g)",218]),
  u("usda-461","Rockfish, raw",94,19,0,1.5,0,"fish",["3 oz (85g)",85]),
  u("usda-462","Sole, raw",72,15,0,0.9,0,"fish",["3 oz (85g)",85]),
  u("usda-463","Octopus, raw",82,15,2.2,1,0,"seafood",["3 oz (85g)",85]),
  u("usda-464","Squid, raw",92,16,3.1,1.4,0,"seafood",["3 oz (85g)",85]),
  u("usda-465","Eel, raw",184,19,0,11,0,"fish",["3 oz (85g)",85]),

  // ── More Dairy ──────────────────────────────────────────────────────────
  u("usda-466","Mascarpone Cheese",429,4.1,3.6,44,0,"dairy",["2 tbsp (29g)",29]),
  u("usda-467","Camembert Cheese",300,20,0.5,25,0,"dairy",["1 oz (28g)",28]),
  u("usda-468","Blue Cheese",353,21,2.3,29,0,"dairy",["1 oz (28g)",28]),
  u("usda-469","Queso Fresco",290,18,2,23,0,"dairy",["1 oz (28g)",28]),
  u("usda-470","Whipping Cream",257,1.9,1.9,27,0,"dairy",["1 tbsp (15g)",15]),
  u("usda-471","Condensed Milk, sweetened",321,7.9,54,8.7,0,"dairy",["2 tbsp (38g)",38]),

  // ── More Legumes & Plant Proteins ────────────────────────────────────────
  u("usda-472","Seitan, wheat gluten",370,75,14,1.9,0,"soy",["3 oz (85g)",85]),
  u("usda-473","Lupini Beans, cooked",119,15,10,2.9,3,"legumes",["1/2 cup (94g)",94]),
  u("usda-474","Adzuki Beans, cooked",128,7.5,25,0.1,7.3,"legumes",["1/2 cup (115g)",115]),
  u("usda-475","Pigeon Peas, cooked",121,8.2,23,0.4,6.5,"legumes",["1/2 cup (84g)",84]),
  u("usda-476","Winged Beans, cooked",147,18,11,5.8,4.7,"legumes",["1/2 cup (62g)",62]),

  // ── Misc Foods ───────────────────────────────────────────────────────────
  u("usda-477","Mozzarella Sticks, fried",302,13,24,17,0.7,"snacks",["4 sticks (91g)",91]),
  u("usda-478","Chicken Wings, buffalo",291,24,3.5,20,0.2,"meals",["4 wings (100g)",100]),
  u("usda-479","Caesar Dressing",357,2,9.6,35,0.4,"condiments",["2 tbsp (30g)",30]),
  u("usda-480","Thousand Island Dressing",375,0.8,15,35,0.6,"condiments",["2 tbsp (30g)",30]),
  u("usda-481","Blue Cheese Dressing",488,5.1,5,50,0.3,"condiments",["2 tbsp (30g)",30]),
  u("usda-482","Maple Glazed Salmon",219,23,7.5,10,0,"fish",["1 fillet (170g)",170]),
  u("usda-483","Teriyaki Chicken",148,17,6.5,5.5,0.3,"meat",["3 oz (85g)",85]),
  u("usda-484","Soy-Glazed Tofu",98,9.5,5,4.5,0.5,"soy",["1/2 cup (100g)",100]),
  u("usda-485","Quinoa Salad",162,6.5,25,5.2,4.2,"meals",["1 cup (185g)",185]),
  u("usda-486","Caprese Salad",165,9.5,5.5,12,0.8,"meals",["1 cup (150g)",150]),
  u("usda-487","Nicoise Salad",178,14,8.5,10,3.5,"meals",["2 cups (300g)",300]),
  u("usda-488","Waldorf Salad",280,3,14,25,2.5,"meals",["1 cup (120g)",120]),
  u("usda-489","Gazpacho",39,1.5,7.5,0.8,1.5,"soup",["1 cup (244g)",244]),
  u("usda-490","French Onion Soup",59,2.5,7,2.5,0.8,"soup",["1 cup (244g)",244]),
];
