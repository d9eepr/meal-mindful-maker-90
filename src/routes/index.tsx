import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { generateMealPlan, type MealPlan, type MealPlanInput } from "@/lib/mealPlan.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Toaster } from "@/components/ui/sonner";
import { ChefHat, Copy, RotateCcw, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DayChef — AI cooking plan for your day" },
      {
        name: "description",
        content:
          "Tell DayChef about your day and get a personalized breakfast, lunch, and dinner plan with grocery list, substitutions, and budget check.",
      },
      { property: "og:title", content: "DayChef — AI cooking plan for your day" },
      {
        property: "og:description",
        content:
          "Personal AI meal planner: three meals, grocery list, smart substitutions, and budget feasibility.",
      },
    ],
  }),
  component: Index,
});

const defaultForm: MealPlanInput = {
  wakeTime: "07:00",
  sleepTime: "23:00",
  busyBlocks: "9:00-12:30 meetings, 14:00-17:00 focus work",
  energy: "medium",
  cookMinutesPerMeal: 30,
  diet: "omnivore",
  allergies: "",
  dislikes: "",
  pantry: "rice, olive oil, eggs, onions, garlic",
  budget: 25,
  currency: "USD",
  servings: 2,
};

function Index() {
  const [form, setForm] = useState<MealPlanInput>(defaultForm);
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const generate = useServerFn(generateMealPlan);

  const mutation = useMutation({
    mutationFn: (input: MealPlanInput) => generate({ data: input }),
    onSuccess: (data) => setPlan(data),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Something went wrong"),
  });

  const update = <K extends keyof MealPlanInput>(k: K, v: MealPlanInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const copyGrocery = () => {
    if (!plan) return;
    const text = plan.grocery
      .map((g) => `- ${g.qty} ${g.item} (${g.category}) ~${g.estPrice} ${plan.budget.currency}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Grocery list copied");
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" />
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">DayChef</h1>
            <p className="text-xs text-muted-foreground">
              Your day, on a plate. AI meal plan + grocery list + budget check.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section aria-labelledby="form-heading">
          <Card>
            <CardHeader>
              <CardTitle id="form-heading" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Tell us about your day
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Wake time">
                  <Input
                    type="time"
                    value={form.wakeTime}
                    onChange={(e) => update("wakeTime", e.target.value)}
                  />
                </Field>
                <Field label="Sleep time">
                  <Input
                    type="time"
                    value={form.sleepTime}
                    onChange={(e) => update("sleepTime", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Busy blocks">
                <Textarea
                  rows={2}
                  placeholder="e.g. 9-12 meetings, 3pm school run"
                  value={form.busyBlocks}
                  onChange={(e) => update("busyBlocks", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Energy today">
                  <Select
                    value={form.energy}
                    onValueChange={(v) => update("energy", v as MealPlanInput["energy"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Max cook time / meal (min)">
                  <Input
                    type="number"
                    min={5}
                    value={form.cookMinutesPerMeal}
                    onChange={(e) =>
                      update("cookMinutesPerMeal", Math.max(5, Number(e.target.value) || 30))
                    }
                  />
                </Field>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Diet">
                  <Input
                    placeholder="omnivore, vegetarian, vegan…"
                    value={form.diet}
                    onChange={(e) => update("diet", e.target.value)}
                  />
                </Field>
                <Field label="Servings">
                  <Input
                    type="number"
                    min={1}
                    value={form.servings}
                    onChange={(e) => update("servings", Math.max(1, Number(e.target.value) || 1))}
                  />
                </Field>
              </div>

              <Field label="Allergies">
                <Input
                  placeholder="peanuts, shellfish…"
                  value={form.allergies}
                  onChange={(e) => update("allergies", e.target.value)}
                />
              </Field>
              <Field label="Dislikes">
                <Input
                  placeholder="cilantro, olives…"
                  value={form.dislikes}
                  onChange={(e) => update("dislikes", e.target.value)}
                />
              </Field>

              <Field label="Pantry (what you already have)">
                <Textarea
                  rows={2}
                  value={form.pantry}
                  onChange={(e) => update("pantry", e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-[1fr_100px] gap-3">
                <Field label="Grocery budget">
                  <Input
                    type="number"
                    min={0}
                    value={form.budget}
                    onChange={(e) => update("budget", Math.max(0, Number(e.target.value) || 0))}
                  />
                </Field>
                <Field label="Currency">
                  <Input
                    value={form.currency}
                    onChange={(e) => update("currency", e.target.value.toUpperCase())}
                  />
                </Field>
              </div>

              <Button
                className="w-full"
                size="lg"
                disabled={mutation.isPending}
                onClick={() => mutation.mutate(form)}
              >
                {mutation.isPending ? "Cooking up your plan…" : "Generate my day plan"}
              </Button>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="result-heading" className="space-y-4">
          <h2 id="result-heading" className="sr-only">
            Your plan
          </h2>

          {!plan && !mutation.isPending && <EmptyState />}
          {mutation.isPending && <LoadingState />}
          {plan && (
            <PlanView plan={plan} onRegenerate={() => mutation.mutate(form)} onCopy={copyGrocery} />
          )}
        </section>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ChefHat className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Fill in your day and we'll draft breakfast, lunch, dinner, a grocery list, and a budget
          check.
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <Card>
      <CardContent className="space-y-3 py-10">
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

function PlanView({
  plan,
  onRegenerate,
  onCopy,
}: {
  plan: MealPlan;
  onRegenerate: () => void;
  onCopy: () => void;
}) {
  const verdictColor =
    plan.budget.verdict === "under"
      ? "bg-primary/15 text-primary"
      : plan.budget.verdict === "on"
        ? "bg-accent text-accent-foreground"
        : "bg-destructive/15 text-destructive";

  const grouped = plan.grocery.reduce<Record<string, typeof plan.grocery>>((acc, g) => {
    (acc[g.category] ??= []).push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCopy}>
          <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy list
        </Button>
        <Button variant="outline" size="sm" onClick={onRegenerate}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Regenerate
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meal plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(["breakfast", "lunch", "dinner"] as const).map((k) => {
            const m = plan.meals[k];
            return (
              <div key={k} className="rounded-lg border border-border/60 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{k}</p>
                    <p className="font-medium">{m.name}</p>
                  </div>
                  <Badge variant="secondary">{m.prepMinutes} min</Badge>
                </div>
                <p className="mb-2 text-xs italic text-muted-foreground">{m.scheduleNote}</p>
                <ol className="ml-4 list-decimal space-y-1 text-sm">
                  {m.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grocery list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {cat}
              </p>
              <ul className="space-y-1 text-sm">
                {items.map((g, i) => (
                  <li key={i} className="flex justify-between gap-2">
                    <span>
                      <span className="text-muted-foreground">{g.qty}</span> {g.item}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      ~{g.estPrice.toFixed(2)} {plan.budget.currency}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      {plan.substitutions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Smart substitutions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {plan.substitutions.map((s, i) => (
                <li key={i} className="rounded-md bg-muted/50 p-3">
                  <p>
                    <span className="line-through text-muted-foreground">{s.original}</span>{" "}
                    <span className="mx-1">→</span>
                    <span className="font-medium">{s.alternative}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.reason}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Budget feasibility</span>
            <Badge className={verdictColor}>{plan.budget.verdict.toUpperCase()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Estimated total</span>
            <span className="font-medium tabular-nums">
              {plan.budget.estimatedTotal.toFixed(2)} {plan.budget.currency}
            </span>
          </div>
          <Progress
            value={Math.min(100, (plan.budget.estimatedTotal / Math.max(0.01, plan.budget.estimatedTotal * 1.2)) * 100)}
          />
          <p className="text-sm text-muted-foreground">{plan.budget.notes}</p>
          <p className="text-[11px] text-muted-foreground">
            Prices are AI estimates — actuals vary by store and region.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
