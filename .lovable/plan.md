# AI Cooking To-Do Micro-App

A single-page app where a user describes their day (schedule, energy, dietary needs, pantry, budget) and gets back a structured cooking plan for breakfast, lunch, and dinner, plus a grocery list, ingredient substitutions, and a budget feasibility check.

## User flow

1. **Input form** (one screen, grouped sections):
   - Day context: wake/sleep time, busy blocks, energy level (low/med/high), cooking time available per meal
   - Diet: preferences (veg / vegan / omnivore / etc.), allergies, dislikes
   - Pantry: free-text list of ingredients already at home
   - Budget: total grocery budget + currency
   - Servings: number of people
2. **Generate** → single AI call returns a structured plan
3. **Result view** with four sections:
   - Meal plan (breakfast, lunch, dinner cards: name, prep time, short steps, fits-in-schedule note)
   - Grocery list (grouped by aisle: produce / protein / pantry / dairy / other, with qty + est. price)
   - Substitutions (per ingredient: original → alternative + reason, e.g. allergy, pantry match, cost)
   - Budget feasibility (estimated total vs. user budget, verdict: under / on / over, and if over: which swaps would bring it under)
4. **Actions**: regenerate, copy grocery list, print/download plan as text

## Design

- Warm, appetizing but calm — off-white background, deep green primary, subtle card shadows, generous spacing
- Semantic tokens in `src/styles.css` (add `--color-primary` green, accent warm terracotta)
- shadcn Card, Button, Input, Textarea, Select, Badge, Separator, Progress (for budget bar)
- Result laid out as a 2-col grid on desktop (meals left, list/substitutions/budget right), stacked on mobile

## Technical details

- **Stack**: existing TanStack Start + Lovable AI Gateway (no DB, no auth — stateless)
- **AI call**: `createServerFn` in `src/lib/mealPlan.functions.ts`
  - Model: `google/gemini-3-flash-preview` via `createLovableAiGatewayProvider`
  - Uses `generateText` + `Output.object` with a small Zod schema:
    ```
    { meals: { breakfast, lunch, dinner: { name, prepMinutes, steps[], scheduleNote } },
      grocery: [{ item, qty, category, estPrice }],
      substitutions: [{ original, alternative, reason }],
      budget: { estimatedTotal, currency, verdict: "under"|"on"|"over", notes } }
    ```
  - Guarded with `NoObjectGeneratedError.isInstance` fallback
  - Server helper `src/lib/ai-gateway.server.ts` per gateway pattern
- **Client**: `src/routes/index.tsx` replaces placeholder with the form + result view; uses `useMutation` (TanStack Query, already in template) calling `useServerFn(generateMealPlan)`
- **State**: local `useState` for form + result; no persistence
- **SEO**: set real title/description in `__root.tsx` head (e.g. "DayChef — AI cooking plan for your day")
- **No new deps** required beyond what's in the template (`ai`, `@ai-sdk/openai-compatible`, `zod` — install any missing)

## Out of scope (v1)

- Saving plans, accounts, history
- Real grocery prices (AI estimates only, clearly labeled)
- Image generation for meals
- Multi-day planning

Ready to build on approval.
