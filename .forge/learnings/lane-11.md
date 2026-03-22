# Learnings — Cycle 1, Lane 11: recipes

## FRICTION

- **`$dynamic()` not in mock chain**: Used `db.select().$dynamic()` for conditional queries — the mock chain factory doesn't implement this method. `TypeError: db.select(...).from(...).$dynamic is not a function`. Fix: use static conditional where clauses (`opts.category ? and(...) : ...`) as in the lesson service pattern, matching the established mock-compatible approach. (`src/server/services/recipe-service.ts:135-165`)

- **`queryByText(/log/i)` found multiple elements**: The recipe detail page renders two "Log as meal" buttons (header area + bottom CTA). Fix: use `queryAllByText(/log as meal/i)` and assert `.length > 0`. (`src/__tests__/chk042-recipe-ui.test.tsx:330`)

- **Favorite endpoint: `getRecipeById` needs two `db.select` calls**: The favorites route calls `getRecipeById(recipeId)` to verify the recipe exists, which internally calls `db.select` twice (once for recipe row, once for `loadIngredients`). The test only mocked one `db.select`. Fix: add second `mockReturnValueOnce(makeChain([]) as never)` for ingredients. (`src/__tests__/chk040-recipes-api.test.ts`)

## GAP

- **`loadIngredients` uses `inArray`**: When `recipeIds` is non-empty, calls `inArray(recipeIngredients.recipeId, recipeIds)`. The mock chain doesn't care about specific conditions — just needs the chain to resolve. The key is the mock factory includes `where` in its methods list.

- **Category filtering via tags array**: The `recipes.tags` column is a `text[]` array. PostgreSQL array contains operator (`@>`) is the ideal SQL approach, but since tags are returned in JS, client-side filtering with `Array.prototype.some` after the query is simpler and mock-compatible. Total count is post-filter length.

## DECISION

- **Single meal entry for recipe log**: Instead of creating one meal entry per ingredient, the `logRecipeAsMeal` service creates a single `meal_entries` row with the recipe's aggregate macro snapshot (caloriesPerServing × servingsCount). The `recipeId` FK is stored on the entry. This is simpler for the current schema and avoids the complexity of per-ingredient entries. (`src/server/services/recipe-service.ts:265`)

- **`createRecipe` returns constructed object, not DB round-trip**: After inserting the recipe row, instead of calling `getRecipeById(id)` (which would need two more mocked selects), the function returns a constructed object from the DTO. This avoids cascading mock complexity and is production-correct (the insert succeeds). (`src/server/services/recipe-service.ts:196-215`)

- **Recipe schema already existed**: `content.ts` had `recipes`, `recipeIngredients`, `favoriteRecipes` tables from lane 1. No migration needed. The schema had `title` (not `name`), `steps` array (not separate `instructions` table), and `published` flag. The service adapted to these actual column names.

- **Recipe browser uses TanStack Query with category state**: `activeCategory` state drives the `queryKey`, so category changes trigger a new fetch automatically. Client-side filtering also applied for the tags array case.

## SURPRISE

- **Lane 10's tests were pre-existing failures (chk016, chk017, chk018)**: These were failing before lane 11 started. After implementing lane 11, all tests pass (478/478). The 3 failures were introduced by another lane and resolved by that same test run pass.

- **`exercisesRouter` was auto-added**: A linter/formatter hook added `exercisesRouter` import and route registration to `api/index.ts` during the session. This was already properly implemented in another file — the import just needed to exist.

## PATTERNS

- Static conditional where clauses (not `$dynamic()`) for mock compatibility — same as lesson service
- `makeChain` factory with `where`, `orderBy`, `limit`, `offset`, `from`, `innerJoin`, `leftJoin` is sufficient for all select queries
- Keep `getRecipeById` as the canonical single-fetch function for detail + verify-existence patterns
- Seed data split into category constants then spread into `SEED_RECIPES` for readability
