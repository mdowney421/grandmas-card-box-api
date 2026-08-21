import "dotenv/config";
import { MongoClient } from "mongodb";
import { RecipeDocument } from "./types";

const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017");
const databaseName = process.env.MONGO_DB_NAME || "indexCardRecipes";

type SeedRecipe = Omit<RecipeDocument, "_id" | "updatedAt" | "createdBy" | "favoriteCount">;

const recipes: SeedRecipe[] = [
  {
    id: "seed-spaghetti-tomato-sauce",
    title: "SPAGHETTI WITH TOMATO SAUCE",
    ingredients: ["12 oz spaghetti", "2 tbsp olive oil", "3 garlic cloves, sliced", "1 can (28 oz) crushed tomatoes", "1 tsp dried oregano", "Salt", "Black pepper", "Parmesan, to serve"],
    instructions: ["Boil salted water and cook spaghetti until just tender.", "Warm olive oil in a skillet over medium heat.", "Cook garlic for 30 seconds, without browning.", "Add tomatoes and oregano; simmer 15 minutes.", "Season with salt and pepper.", "Toss drained pasta with the sauce and serve with Parmesan."],
    prepTimeMin: 5, cookTimeMin: 20, totalTimeMin: 25, tag: "Dinner", servings: 4, difficulty: "trivial", createdAt: "2025-01-05T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-chicken-stir-fry",
    title: "CHICKEN AND VEGETABLE STIR-FRY",
    ingredients: ["1 lb boneless chicken thighs, sliced", "2 tbsp neutral oil", "1 bell pepper, sliced", "2 cups broccoli florets", "2 garlic cloves, minced", "1 tbsp grated ginger", "3 tbsp soy sauce", "1 tbsp rice vinegar", "1 tsp honey", "Cooked rice"],
    instructions: ["Whisk soy sauce, vinegar, and honey together.", "Heat a large skillet or wok until very hot.", "Cook chicken in 1 tbsp oil until browned and cooked through; remove.", "Add remaining oil, broccoli, and pepper; stir-fry 4 minutes.", "Add garlic and ginger; cook 30 seconds.", "Return chicken, add sauce, and toss for 1 minute.", "Serve over rice."],
    prepTimeMin: 15, cookTimeMin: 12, totalTimeMin: 27, tag: "Dinner", servings: 4, difficulty: "trivial", createdAt: "2025-01-12T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-lentil-soup",
    title: "WEEKDAY LENTIL SOUP",
    ingredients: ["2 tbsp olive oil", "1 onion, diced", "2 carrots, diced", "2 celery stalks, diced", "3 garlic cloves, minced", "1 cup brown lentils", "1 can (14 oz) diced tomatoes", "6 cups vegetable broth", "1 tsp cumin", "Salt and pepper"],
    instructions: ["Heat oil in a Dutch oven over medium heat.", "Cook onion, carrots, and celery with a pinch of salt for 8 minutes.", "Add garlic and cumin; cook 1 minute.", "Stir in lentils, tomatoes, and broth.", "Bring to a boil, then simmer uncovered 30 minutes.", "Season with salt and pepper and serve."],
    prepTimeMin: 15, cookTimeMin: 40, totalTimeMin: 55, tag: "Dinner", servings: 6, difficulty: "trivial", createdAt: "2025-01-19T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-roast-chicken",
    title: "ROAST CHICKEN WITH ROOT VEGETABLES",
    ingredients: ["1 whole chicken, 4 to 5 lb", "1 lb potatoes, halved", "4 carrots, cut into chunks", "1 onion, quartered", "2 tbsp olive oil", "1 lemon, halved", "4 garlic cloves", "1 tsp dried thyme", "Salt", "Black pepper"],
    instructions: ["Heat oven to 425 F.", "Pat chicken dry and season inside and out with salt, pepper, and thyme.", "Put lemon and garlic inside the cavity.", "Toss vegetables with oil, salt, and pepper in a roasting pan.", "Set chicken on top and roast 20 minutes.", "Reduce heat to 375 F and roast 55 to 70 minutes, until the thickest thigh reaches 165 F.", "Rest chicken 15 minutes before carving."],
    prepTimeMin: 20, cookTimeMin: 80, totalTimeMin: 100, tag: "Dinner", servings: 4, difficulty: "medium", createdAt: "2025-01-26T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-black-bean-tacos",
    title: "BLACK BEAN TACOS",
    ingredients: ["1 tbsp olive oil", "1 onion, diced", "2 garlic cloves, minced", "2 cans black beans, drained", "1 tsp ground cumin", "1/2 tsp chili powder", "8 corn tortillas", "Shredded cabbage", "Lime wedges", "Salsa"],
    instructions: ["Warm oil in a skillet over medium heat.", "Cook onion for 5 minutes, then add garlic for 30 seconds.", "Add beans, cumin, chili powder, and 1/3 cup water.", "Simmer 8 minutes, mashing some beans with a spoon.", "Warm tortillas in a dry skillet.", "Fill tortillas with beans and cabbage; serve with salsa and lime."],
    prepTimeMin: 10, cookTimeMin: 15, totalTimeMin: 25, tag: "Quick Fix", servings: 4, difficulty: "trivial", createdAt: "2025-02-02T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-fried-rice",
    title: "VEGETABLE FRIED RICE",
    ingredients: ["3 cups cold cooked rice", "2 tbsp neutral oil", "2 eggs, beaten", "1 carrot, diced", "1 cup frozen peas", "2 garlic cloves, minced", "2 green onions, sliced", "2 tbsp soy sauce", "1 tsp sesame oil"],
    instructions: ["Heat a large skillet or wok over high heat.", "Add 1 tsp oil and scramble the eggs; remove to a plate.", "Add remaining oil and cook carrot for 2 minutes.", "Add peas and garlic; cook 1 minute.", "Add rice and stir-fry until hot and separated.", "Return eggs and add soy sauce and sesame oil.", "Fold in green onions and serve."],
    prepTimeMin: 10, cookTimeMin: 12, totalTimeMin: 22, tag: "Quick Fix", servings: 4, difficulty: "trivial", createdAt: "2025-02-09T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-baked-salmon",
    title: "LEMON GARLIC BAKED SALMON",
    ingredients: ["4 salmon fillets", "1 tbsp olive oil", "2 garlic cloves, minced", "1 lemon", "1/2 tsp dried dill", "Salt", "Black pepper", "Green beans, to serve"],
    instructions: ["Heat oven to 400 F and line a baking sheet.", "Place salmon skin-side down and brush with oil.", "Season with garlic, dill, salt, pepper, and lemon zest.", "Bake 10 to 14 minutes, until the fish flakes easily.", "Squeeze lemon over the salmon and serve with green beans."],
    prepTimeMin: 5, cookTimeMin: 14, totalTimeMin: 19, tag: "Dinner", servings: 4, difficulty: "trivial", createdAt: "2025-02-16T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-chili",
    title: "BEEF AND BEAN CHILI",
    ingredients: ["1 tbsp olive oil", "1 lb ground beef", "1 onion, diced", "2 garlic cloves, minced", "2 tbsp tomato paste", "1 can (28 oz) crushed tomatoes", "2 cans kidney beans, drained", "1 cup beef broth", "2 tbsp chili powder", "1 tsp cumin"],
    instructions: ["Heat oil in a large pot over medium-high heat.", "Brown beef, breaking it up as it cooks.", "Add onion and cook 5 minutes.", "Add garlic and tomato paste; cook 1 minute.", "Stir in tomatoes, beans, broth, chili powder, and cumin.", "Simmer uncovered 30 minutes, stirring occasionally.", "Taste and season before serving."],
    prepTimeMin: 10, cookTimeMin: 45, totalTimeMin: 55, tag: "Dinner", servings: 6, difficulty: "trivial", createdAt: "2025-02-23T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-pancakes",
    title: "BUTTERMILK PANCAKES",
    ingredients: ["2 cups all-purpose flour", "2 tbsp sugar", "2 tsp baking powder", "1/2 tsp baking soda", "1/2 tsp salt", "2 cups buttermilk", "2 eggs", "4 tbsp melted butter"],
    instructions: ["Whisk flour, sugar, baking powder, baking soda, and salt.", "Whisk buttermilk, eggs, and 3 tbsp melted butter separately.", "Pour wet ingredients into dry and stir just until combined.", "Rest batter 5 minutes.", "Heat a buttered skillet over medium heat.", "Cook 1/4-cup portions until bubbles form, then flip and cook until golden."],
    prepTimeMin: 10, cookTimeMin: 15, totalTimeMin: 25, tag: "Breakfast", servings: 4, difficulty: "trivial", createdAt: "2025-03-02T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-shakshuka",
    title: "SHAKSHUKA",
    ingredients: ["2 tbsp olive oil", "1 onion, sliced", "1 bell pepper, sliced", "3 garlic cloves, minced", "1 tsp cumin", "1 can (28 oz) crushed tomatoes", "6 eggs", "Salt", "Black pepper", "Cilantro or parsley"],
    instructions: ["Heat oil in a wide skillet over medium heat.", "Cook onion and pepper for 8 minutes.", "Add garlic and cumin; cook 1 minute.", "Add tomatoes and simmer 10 minutes.", "Make six wells and crack in the eggs.", "Cover and cook 6 to 8 minutes, until whites set and yolks are still soft.", "Season and scatter with herbs."],
    prepTimeMin: 10, cookTimeMin: 25, totalTimeMin: 35, tag: "Vegetarian", servings: 4, difficulty: "trivial", createdAt: "2025-03-09T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-grilled-cheese-tomato-soup",
    title: "GRILLED CHEESE AND TOMATO SOUP",
    ingredients: ["2 tbsp butter", "1 onion, diced", "2 cans (14 oz each) tomatoes", "2 cups vegetable broth", "1/2 cup cream", "Salt", "Black pepper", "8 slices sandwich bread", "4 oz cheddar", "2 tbsp mayonnaise"],
    instructions: ["Melt 1 tbsp butter and cook onion for 6 minutes.", "Add tomatoes and broth; simmer 15 minutes.", "Blend until smooth, then stir in cream and season.", "Spread mayonnaise on the outside of each bread slice.", "Fill sandwiches with cheddar.", "Cook sandwiches in remaining butter over medium-low heat until golden on both sides.", "Serve with the soup."],
    prepTimeMin: 10, cookTimeMin: 25, totalTimeMin: 35, tag: "Vegetarian", servings: 4, difficulty: "trivial", createdAt: "2025-03-16T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-pesto-pasta",
    title: "PESTO PASTA WITH CHERRY TOMATOES",
    ingredients: ["12 oz pasta", "1 cup basil pesto", "1 cup cherry tomatoes, halved", "1/2 cup pasta water", "1/4 cup Parmesan", "Salt", "Black pepper"],
    instructions: ["Cook pasta in salted water until al dente.", "Reserve 1/2 cup pasta water, then drain.", "Toss hot pasta with pesto and enough pasta water to make it glossy.", "Fold in tomatoes and Parmesan.", "Season with pepper and serve."],
    prepTimeMin: 5, cookTimeMin: 12, totalTimeMin: 17, tag: "Vegetarian", servings: 4, difficulty: "trivial", createdAt: "2025-03-23T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-meatloaf",
    title: "WEEKNIGHT MEATLOAF",
    ingredients: ["1 1/2 lb ground beef", "1 egg", "1/2 cup breadcrumbs", "1/2 onion, finely diced", "2 garlic cloves, minced", "1/3 cup milk", "2 tbsp ketchup", "1 tbsp Worcestershire sauce", "1 tsp salt", "1/2 tsp pepper"],
    instructions: ["Heat oven to 375 F.", "Soak breadcrumbs in milk for 5 minutes.", "Mix all ingredients gently until just combined.", "Shape into a loaf on a lined baking sheet.", "Brush with ketchup.", "Bake 45 to 55 minutes, until the center reaches 160 F.", "Rest 10 minutes before slicing."],
    prepTimeMin: 15, cookTimeMin: 50, totalTimeMin: 65, tag: "Dinner", servings: 6, difficulty: "trivial", createdAt: "2025-03-30T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-potato-frittata",
    title: "POTATO AND ONION FRITTATA",
    ingredients: ["8 eggs", "2 tbsp olive oil", "1 lb potatoes, thinly sliced", "1 onion, thinly sliced", "1/2 cup shredded cheddar", "Salt", "Black pepper"],
    instructions: ["Heat oven to 400 F.", "Whisk eggs with salt, pepper, and cheddar.", "Cook potatoes and onion in oil in an oven-safe skillet for 12 minutes.", "Pour eggs over the vegetables.", "Cook on the stove 3 minutes, until edges set.", "Bake 8 to 10 minutes, until the center is just set.", "Rest 5 minutes before slicing."],
    prepTimeMin: 10, cookTimeMin: 30, totalTimeMin: 40, tag: "Vegetarian", servings: 4, difficulty: "trivial", createdAt: "2025-04-06T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-chicken-curry",
    title: "EASY COCONUT CHICKEN CURRY",
    ingredients: ["1 tbsp oil", "1 onion, diced", "2 garlic cloves, minced", "1 tbsp grated ginger", "2 tbsp curry powder", "1 lb chicken thighs, cubed", "1 can (14 oz) coconut milk", "1 cup chicken broth", "1 cup frozen peas", "Cooked rice"],
    instructions: ["Heat oil in a deep skillet over medium heat.", "Cook onion for 6 minutes.", "Add garlic, ginger, and curry powder; cook 1 minute.", "Add chicken and stir until coated.", "Pour in coconut milk and broth.", "Simmer 18 minutes, until chicken is cooked through.", "Stir in peas for the final 3 minutes and serve over rice."],
    prepTimeMin: 10, cookTimeMin: 30, totalTimeMin: 40, tag: "Dinner", servings: 4, difficulty: "trivial", createdAt: "2025-04-13T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-tuna-salad",
    title: "CLASSIC TUNA SALAD",
    ingredients: ["2 cans tuna, drained", "1/4 cup mayonnaise", "1 celery stalk, diced", "2 tbsp diced red onion", "1 tbsp lemon juice", "1 tsp Dijon mustard", "Salt", "Black pepper", "Bread or lettuce"],
    instructions: ["Add tuna, celery, and onion to a bowl.", "Stir in mayonnaise, lemon juice, and mustard.", "Season with salt and pepper.", "Chill 15 minutes if time allows.", "Serve in sandwiches or lettuce cups."],
    prepTimeMin: 10, cookTimeMin: 0, totalTimeMin: 10, tag: "Lunch", servings: 3, difficulty: "trivial", createdAt: "2025-04-20T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-baked-ziti",
    title: "BAKED ZITI",
    ingredients: ["1 lb ziti or penne", "1 tbsp olive oil", "1 lb Italian sausage", "1 onion, diced", "3 garlic cloves, minced", "1 jar (24 oz) marinara", "1 cup ricotta", "2 cups shredded mozzarella", "1/2 cup Parmesan", "Basil"],
    instructions: ["Heat oven to 375 F.", "Boil pasta 2 minutes less than package directions; drain.", "Brown sausage with onion, then add garlic for 30 seconds.", "Stir in marinara and simmer 5 minutes.", "Mix pasta with half the sauce and ricotta.", "Layer pasta, remaining sauce, mozzarella, and Parmesan in a baking dish.", "Cover and bake 20 minutes; uncover and bake 10 minutes more.", "Rest 10 minutes and finish with basil."],
    prepTimeMin: 15, cookTimeMin: 45, totalTimeMin: 60, tag: "Dinner", servings: 6, difficulty: "medium", createdAt: "2025-04-27T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-oatmeal",
    title: "CREAMY MORNING OATMEAL",
    ingredients: ["1 cup rolled oats", "2 cups milk or water", "1/4 tsp salt", "1 banana, sliced", "1 tbsp maple syrup", "1/2 tsp cinnamon", "Chopped nuts"],
    instructions: ["Bring milk or water and salt to a simmer.", "Stir in oats and cook 5 minutes, stirring often.", "Stir in half the banana and cinnamon.", "Spoon into bowls and top with remaining banana, maple syrup, and nuts."],
    prepTimeMin: 2, cookTimeMin: 5, totalTimeMin: 7, tag: "Vegetarian", servings: 2, difficulty: "trivial", createdAt: "2025-05-04T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-garlic-shrimp",
    title: "GARLIC BUTTER SHRIMP",
    ingredients: ["1 lb peeled shrimp", "3 tbsp butter", "4 garlic cloves, minced", "1/2 tsp red pepper flakes", "2 tbsp lemon juice", "2 tbsp chopped parsley", "Salt", "Cooked rice or crusty bread"],
    instructions: ["Pat shrimp dry and season with salt.", "Melt butter in a skillet over medium-high heat.", "Cook shrimp 2 minutes per side, then transfer to a plate.", "Add garlic and pepper flakes; cook 30 seconds.", "Return shrimp and add lemon juice.", "Toss with parsley and serve immediately."],
    prepTimeMin: 5, cookTimeMin: 8, totalTimeMin: 13, tag: "Quick Fix", servings: 4, difficulty: "trivial", createdAt: "2025-05-11T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-sheet-pan-sausage",
    title: "SHEET-PAN SAUSAGE AND VEGETABLES",
    ingredients: ["1 lb smoked sausage, sliced", "1 lb baby potatoes, halved", "1 bell pepper, sliced", "1 zucchini, sliced", "1 red onion, wedged", "2 tbsp olive oil", "1 tsp Italian seasoning", "Salt", "Black pepper"],
    instructions: ["Heat oven to 425 F.", "Toss potatoes with half the oil, salt, and pepper; roast 20 minutes.", "Add sausage, pepper, zucchini, and onion.", "Toss with remaining oil and Italian seasoning.", "Roast 18 to 22 minutes, until vegetables are browned and potatoes are tender."],
    prepTimeMin: 10, cookTimeMin: 42, totalTimeMin: 52, tag: "Dinner", servings: 4, difficulty: "trivial", createdAt: "2025-05-18T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-caesar-salad",
    title: "CHICKEN CAESAR SALAD",
    ingredients: ["2 chicken breasts", "1 tbsp olive oil", "1 romaine heart, chopped", "1/3 cup Parmesan", "1 cup croutons", "1/3 cup mayonnaise", "1 tbsp lemon juice", "1 tsp Dijon mustard", "1 garlic clove, grated", "Black pepper"],
    instructions: ["Season chicken with oil, salt, and pepper.", "Grill or pan-cook 5 to 7 minutes per side, until 165 F.", "Whisk mayonnaise, lemon, Dijon, garlic, and 2 tbsp water.", "Toss romaine with dressing, Parmesan, and croutons.", "Slice chicken and place over the salad."],
    prepTimeMin: 15, cookTimeMin: 14, totalTimeMin: 29, tag: "Lunch", servings: 4, difficulty: "trivial", createdAt: "2025-05-25T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-apple-crisp",
    title: "EASY APPLE CRISP",
    ingredients: ["5 apples, peeled and sliced", "1 tbsp lemon juice", "1/3 cup sugar", "1 tsp cinnamon", "1 cup rolled oats", "1/2 cup flour", "1/2 cup brown sugar", "1/2 cup cold butter, cubed", "1/2 tsp salt"],
    instructions: ["Heat oven to 375 F.", "Toss apples with lemon juice, sugar, and cinnamon in a baking dish.", "Mix oats, flour, brown sugar, and salt.", "Rub in butter until coarse crumbs form.", "Scatter topping over apples.", "Bake 35 to 45 minutes, until bubbling and golden.", "Cool 15 minutes before serving."],
    prepTimeMin: 15, cookTimeMin: 40, totalTimeMin: 55, tag: "Dessert", servings: 6, difficulty: "trivial", createdAt: "2025-06-01T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-pizza-dough",
    title: "EASY PIZZA DOUGH",
    ingredients: ["3 cups bread flour", "1 cup warm water", "2 1/4 tsp instant yeast", "1 tsp sugar", "1 tsp salt", "2 tbsp olive oil"],
    instructions: ["Stir warm water, yeast, and sugar together.", "Add flour, salt, and oil; mix into a shaggy dough.", "Knead 6 minutes, until smooth.", "Cover and rise 60 to 90 minutes, until doubled.", "Heat oven as hot as it will go with a baking sheet inside.", "Stretch dough, top lightly, and bake 8 to 12 minutes."],
    prepTimeMin: 15, cookTimeMin: 12, totalTimeMin: 87, tag: "Staple", servings: 4, difficulty: "medium", createdAt: "2025-06-08T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-corn-chowder",
    title: "SWEET CORN CHOWDER",
    ingredients: ["2 tbsp butter", "1 onion, diced", "2 potatoes, diced", "4 cups corn", "4 cups chicken or vegetable broth", "1 cup milk", "Salt", "Black pepper", "Green onions"],
    instructions: ["Melt butter in a pot over medium heat.", "Cook onion for 6 minutes.", "Add potatoes, corn, and broth.", "Simmer 15 minutes, until potatoes are tender.", "Blend 2 cups of soup and return it to the pot.", "Stir in milk, season, and warm without boiling.", "Top with green onions."],
    prepTimeMin: 10, cookTimeMin: 25, totalTimeMin: 35, tag: "Dinner", servings: 5, difficulty: "trivial", createdAt: "2025-06-15T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-turkey-burgers",
    title: "JUICY TURKEY BURGERS",
    ingredients: ["1 lb ground turkey", "1/4 cup grated onion", "1 tbsp mayonnaise", "1 tsp Worcestershire sauce", "1/2 tsp garlic powder", "1/2 tsp salt", "Black pepper", "Burger buns", "Lettuce and tomato"],
    instructions: ["Mix turkey, onion, mayonnaise, Worcestershire, garlic powder, salt, and pepper.", "Form four patties slightly wider than the buns.", "Chill patties 15 minutes if time allows.", "Cook in an oiled skillet over medium heat 5 to 6 minutes per side.", "Confirm the center reaches 165 F.", "Rest 3 minutes and serve on buns."],
    prepTimeMin: 15, cookTimeMin: 12, totalTimeMin: 27, tag: "Dinner", servings: 4, difficulty: "trivial", createdAt: "2025-06-22T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-cucumber-chickpea-salad",
    title: "CHICKPEA CUCUMBER SALAD",
    ingredients: ["2 cans chickpeas, drained", "1 cucumber, diced", "1 cup cherry tomatoes, halved", "1/4 red onion, sliced", "1/2 cup feta", "3 tbsp olive oil", "2 tbsp lemon juice", "1 tsp dried oregano", "Salt", "Black pepper"],
    instructions: ["Combine chickpeas, cucumber, tomatoes, onion, and feta.", "Whisk oil, lemon juice, oregano, salt, and pepper.", "Pour dressing over the salad and toss.", "Rest 10 minutes before serving."],
    prepTimeMin: 15, cookTimeMin: 0, totalTimeMin: 15, tag: "Lunch", servings: 4, difficulty: "trivial", createdAt: "2025-06-29T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
  {
    id: "seed-banana-bread",
    title: "ONE-BOWL BANANA BREAD",
    ingredients: ["3 very ripe bananas", "1/2 cup melted butter", "3/4 cup brown sugar", "2 eggs", "1 tsp vanilla", "1 1/2 cups flour", "1 tsp baking soda", "1/2 tsp salt", "1/2 tsp cinnamon"],
    instructions: ["Heat oven to 350 F and grease a loaf pan.", "Mash bananas in a bowl.", "Whisk in butter, sugar, eggs, and vanilla.", "Fold in flour, baking soda, salt, and cinnamon until just combined.", "Pour into the pan.", "Bake 50 to 60 minutes, until a toothpick comes out mostly clean.", "Cool 15 minutes before slicing."],
    prepTimeMin: 10, cookTimeMin: 55, totalTimeMin: 65, tag: "Dessert", servings: 10, difficulty: "trivial", createdAt: "2025-07-06T00:00:00.000Z", isUserUpload: false, inMyBox: false,
  },
];

const imageUrls: Record<string, string> = {
  "seed-spaghetti-tomato-sauce": "https://images.unsplash.com/photo-1621996346565-e3d5d6281084?auto=format&fit=crop&w=800&q=80",
  "seed-chicken-stir-fry": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80",
  "seed-lentil-soup": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
  "seed-roast-chicken": "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80",
  "seed-black-bean-tacos": "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85?auto=format&fit=crop&w=800&q=80",
  "seed-fried-rice": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80",
  "seed-baked-salmon": "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80",
  "seed-chili": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  "seed-pancakes": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  "seed-shakshuka": "https://images.unsplash.com/photo-1592417817098-8f3d6eb22521?auto=format&fit=crop&w=800&q=80",
  "seed-grilled-cheese-tomato-soup": "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
  "seed-pesto-pasta": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
  "seed-meatloaf": "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  "seed-potato-frittata": "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80",
  "seed-chicken-curry": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
  "seed-tuna-salad": "https://images.unsplash.com/photo-1546793665-c74683f339c1?auto=format&fit=crop&w=800&q=80",
  "seed-baked-ziti": "https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=800&q=80",
  "seed-oatmeal": "https://images.unsplash.com/photo-1517673132405-a56a62b18caf?auto=format&fit=crop&w=800&q=80",
  "seed-garlic-shrimp": "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80",
  "seed-sheet-pan-sausage": "https://images.unsplash.com/photo-1592417817098-8f3d6eb22521?auto=format&fit=crop&w=800&q=80",
  "seed-caesar-salad": "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80",
  "seed-apple-crisp": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80",
  "seed-pizza-dough": "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=80",
  "seed-corn-chowder": "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80",
  "seed-turkey-burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  "seed-cucumber-chickpea-salad": "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
  "seed-banana-bread": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80",
};

export async function seed(): Promise<void> {
  await client.connect();
  const collection = client.db(databaseName).collection<RecipeDocument>("recipes");
  const operations = recipes.map((recipe) => ({
    replaceOne: {
      filter: { id: recipe.id },
      replacement: {
        ...recipe,
        imageUrl: imageUrls[recipe.id],
        createdBy: null,
        updatedAt: new Date(),
        favoriteCount: 0,
      },
      upsert: true,
    },
  }));

  const result = await collection.bulkWrite(operations);
  console.log(`Seeded ${recipes.length} recipes (${result.upsertedCount} inserted, ${result.modifiedCount} updated).`);
}

if (require.main === module) {
  seed()
    .catch((error) => {
      console.error("Recipe seed failed:", error);
      process.exitCode = 1;
    })
    .finally(() => client.close());
}