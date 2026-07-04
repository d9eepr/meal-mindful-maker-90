import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  wakeTime: z.string(),
  sleepTime: z.string(),
  busyBlocks: z.string(),
  energy: z.enum(["low", "medium", "high"]),
  cookMinutesPerMeal: z.number().int().positive(),
  diet: z.string(),
  allergies: z.string(),
  dislikes: z.string(),
  pantry: z.string(),
  budget: z.number().nonnegative(),
  currency: z.string(),
  servings: z.number().int().positive(),
});

export type MealPlanInput = z.infer<typeof InputSchema>;

const Meal = z.object({
  name: z.string(),
  prepMinutes: z.number(),
  steps: z.array(z.string()),
  scheduleNote: z.string(),
});

const PlanSchema = z.object({
  meals: z.object({
    breakfast: Meal,
    lunch: Meal,
    dinner: Meal,
  }),
  grocery: z.array(
    z.object({
      item: z.string(),
      qty: z.string(),
      category: z.string(),
      estPrice: z.number(),
    }),
  ),
  substitutions: z.array(
    z.object({
      original: z.string(),
      alternative: z.string(),
      reason: z.string(),
    }),
  ),
  budget: z.object({
    estimatedTotal: z.number(),
    currency: z.string(),
    verdict: z.enum(["under", "on", "over"]),
    notes: z.string(),
  }),
});

export type MealPlan = z.infer<typeof PlanSchema>;

export const generateMealPlan = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<MealPlan> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const prompt = `You are a personal cooking planner. Build a one-day cooking plan for the user.

User day:
- Wake: ${data.wakeTime}, sleep: ${data.sleepTime}
- Busy blocks: ${data.busyBlocks || "none"}
- Energy: ${data.energy}
- Max cooking time per meal: ${data.cookMinutesPerMeal} minutes
- Servings: ${data.servings}

Diet:
- Preferences: ${data.diet || "no preference"}
- Allergies: ${data.allergies || "none"}
- Dislikes: ${data.dislikes || "none"}

Pantry already at home: ${data.pantry || "assume nothing"}
Grocery budget: ${data.budget} ${data.currency}

Requirements:
- Three meals: breakfast, lunch, dinner. Each with a short recipe (3-6 concise steps), prep time within the max, and a scheduleNote explaining when to cook it around busy blocks and energy.
- Grocery list ONLY for items not in pantry. Group by category (produce, protein, dairy, pantry, other). Estimate reasonable per-item prices in ${data.currency}.
- Provide 2-5 useful substitutions (allergy-safe, pantry-based, or cheaper).
- Budget: sum estimated grocery prices into estimatedTotal. Verdict "under" if <= budget*0.9, "on" if within 10% of budget, "over" if > budget. If over, notes must suggest specific swaps to fit budget.
- Keep everything realistic and concise.`;

    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: PlanSchema }),
        prompt,
      });
      return output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        try {
          return PlanSchema.parse(JSON.parse(error.text ?? "{}"));
        } catch {
          throw new Error("The AI response could not be parsed. Please try again.");
        }
      }
      throw error;
    }
  });
