import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ChevronLeft, Salad, Flame, Loader2, Trash2, Plus,
  Apple, Clock, BarChart3, ChevronDown, ChevronUp
} from "lucide-react";

// ─── Parser de refeições ─────────────────────────────────────────────────────

interface Meal {
  name: string;
  time: string;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  foods: string[];
  tip: string;
}

interface ParsedDiet {
  title: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
  guidelines: string;
  substitutions: string;
}

function parseDietMarkdown(content: string): ParsedDiet {
  const lines = content.split("\n");
  const title = lines.find(l => l.startsWith("# "))?.replace(/^#\s*/, "").trim() || "Plano Alimentar";

  // Extrair resumo nutricional
  const summarySection = content.match(/##\s*Resumo Nutricional([\s\S]*?)(?=##|$)/i)?.[1] || "";
  const totalCalories = parseInt(summarySection.match(/(\d{3,4})\s*kcal/i)?.[1] || "0");
  const totalProtein = parseInt(summarySection.match(/[Pp]rote[ií]na[:\s*]*(\d{2,3})\s*g/)?.[1] || "0");
  const totalCarbs = parseInt(summarySection.match(/[Cc]arboidratos[:\s*]*(\d{2,3})\s*g/)?.[1] || "0");
  const totalFat = parseInt(summarySection.match(/[Gg]ordura[:\s*]*(\d{2,3})\s*g/)?.[1] || "0");

  // Extrair refeições
  const mealRegex = /##\s*Refei[cç][aã]o\s*\d+[:\s]*([^\n]+)/gi;
  const mealMatches: { name: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = mealRegex.exec(content)) !== null) {
    mealMatches.push({ name: m[1].trim(), index: m.index });
  }

  const meals: Meal[] = [];
  for (let i = 0; i < mealMatches.length; i++) {
    const start = mealMatches[i].index;
    const end = i + 1 < mealMatches.length ? mealMatches[i + 1].index : content.length;
    const block = content.slice(start, end);

    // Extrair horário do nome
    const timeMatch = mealMatches[i].name.match(/\(([^)]+)\)/);
    const time = timeMatch ? timeMatch[1] : "";
    const cleanName = mealMatches[i].name.replace(/\([^)]+\)/, "").trim();

    // Macros da refeição
    const macroLine = block.match(/\*\*Macros[:\s*]*\*\*[^P]*[Pp]rote[ií]na[:\s]*(\d+)g[^C]*[Cc]arboidratos[:\s]*(\d+)g[^G]*[Gg]ordura[:\s]*(\d+)g[^C]*[Cc]alorias[:\s]*(\d+)/i);
    const protein = parseInt(macroLine?.[1] || "0");
    const carbs = parseInt(macroLine?.[2] || "0");
    const fat = parseInt(macroLine?.[3] || "0");
    const calories = parseInt(macroLine?.[4] || "0");

    // Alimentos
    const foodsSection = block.match(/###\s*Alimentos[:\s]*([\s\S]*?)(?=\*\*Dica|$)/i)?.[1] || "";
    const foods = foodsSection
      .split("\n")
      .filter(l => l.trim().startsWith("-"))
      .map(l => l.replace(/^-\s*/, "").trim())
      .filter(Boolean);

    // Dica
    const tip = block.match(/\*\*Dica[:\s*]*\*\*\s*([^\n]+)/i)?.[1]?.trim() || "";

    meals.push({ name: cleanName, time, protein, carbs, fat, calories, foods, tip });
  }

  // Orientações gerais
  const guidelines = content.match(/##\s*Orienta[cç][oõ]es Gerais([\s\S]*?)(?=##|$)/i)?.[1]?.trim() || "";
  const substitutions = content.match(/##\s*Substitui[cç][oõ]es([\s\S]*?)(?=##|$)/i)?.[1]?.trim() || "";

  return { title, totalCalories, totalProtein, totalCarbs, totalFat, meals, guidelines, substitutions };
}

// ─── Componente de card de refeição ──────────────────────────────────────────

function MealCard({ meal, index }: { meal: Meal; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const colors = [
    "bg-orange-500/10 border-orange-500/30 text-orange-400",
    "bg-green-500/10 border-green-500/30 text-green-400",
    "bg-blue-500/10 border-blue-500/30 text-blue-400",
    "bg-purple-500/10 border-purple-500/30 text-purple-400",
    "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
    "bg-pink-500/10 border-pink-500/30 text-pink-400",
    "bg-cyan-500/10 border-cyan-500/30 text-cyan-400",
  ];
  const color = colors[index % colors.length];

  return (
    <Card className={`border ${color.split(" ")[1]}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${color.split(" ")[0]} flex items-center justify-center`}>
              <Apple className={`w-4 h-4 ${color.split(" ")[2]}`} />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">{meal.name}</CardTitle>
              {meal.time && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" /> {meal.time}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {meal.calories > 0 && (
              <Badge variant="outline" className="text-xs">
                {meal.calories} kcal
              </Badge>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
        {/* Macros resumo */}
        {meal.protein > 0 && (
          <div className="flex gap-3 mt-2">
            <span className="text-xs text-blue-400">P: {meal.protein}g</span>
            <span className="text-xs text-yellow-400">C: {meal.carbs}g</span>
            <span className="text-xs text-red-400">G: {meal.fat}g</span>
          </div>
        )}
      </CardHeader>
      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {meal.foods.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Alimentos:</p>
              <ul className="space-y-1">
                {meal.foods.map((food, i) => (
                  <li key={i} className="text-xs text-foreground flex gap-1">
                    <span className="text-muted-foreground">•</span> {food}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {meal.tip && (
            <div className="bg-muted/50 rounded-lg p-2">
              <p className="text-xs text-muted-foreground"><span className="font-semibold">💡 Dica:</span> {meal.tip}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Visualização de uma dieta específica ────────────────────────────────────

function DietView({ dietId }: { dietId: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [showGuidelines, setShowGuidelines] = useState(false);

  const { data: diet, isLoading } = trpc.diets.getById.useQuery({ id: dietId });

  const deleteMutation = trpc.diets.delete.useMutation({
    onSuccess: () => {
      toast.success("Dieta excluída.");
      utils.diets.getAll.invalidate();
      navigate("/dieta");
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!diet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Dieta não encontrada.</p>
      </div>
    );
  }

  const parsed = parseDietMarkdown(diet.content);
  const objectiveColors: Record<string, string> = {
    bulking: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    cutting: "bg-red-500/10 text-red-400 border-red-500/30",
    manutencao: "bg-green-500/10 text-green-400 border-green-500/30",
    recomposicao: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };
  const objectiveLabels: Record<string, string> = {
    bulking: "🏋️ Bulking",
    cutting: "🔥 Cutting",
    manutencao: "⚖️ Manutenção",
    recomposicao: "💪 Recomposição",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dieta")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold line-clamp-1">{parsed.title}</h1>
            <Badge variant="outline" className={`text-xs mt-0.5 ${objectiveColors[diet.objective] || ""}`}>
              {objectiveLabels[diet.objective] || diet.objective}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => deleteMutation.mutate({ id: diet.id })}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Resumo nutricional */}
      {(parsed.totalCalories > 0 || diet.targetCalories) && (
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> Resumo Nutricional Diário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-background rounded-lg p-2">
                <div className="text-lg font-bold text-primary">{parsed.totalCalories || diet.targetCalories || "—"}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
              </div>
              <div className="bg-background rounded-lg p-2">
                <div className="text-lg font-bold text-blue-400">{parsed.totalProtein || diet.targetProtein || "—"}g</div>
                <div className="text-xs text-muted-foreground">Proteína</div>
              </div>
              <div className="bg-background rounded-lg p-2">
                <div className="text-lg font-bold text-yellow-400">{parsed.totalCarbs || diet.targetCarbs || "—"}g</div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div className="bg-background rounded-lg p-2">
                <div className="text-lg font-bold text-red-400">{parsed.totalFat || diet.targetFat || "—"}g</div>
                <div className="text-xs text-muted-foreground">Gordura</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refeições */}
      <div className="space-y-3 mb-4">
        {parsed.meals.length > 0 ? (
          parsed.meals.map((meal, i) => <MealCard key={i} meal={meal} index={i} />)
        ) : (
          <Card>
            <CardContent className="pt-4">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap">{diet.content}</pre>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Orientações gerais */}
      {parsed.guidelines && (
        <Card className="mb-4">
          <CardHeader
            className="pb-2 cursor-pointer"
            onClick={() => setShowGuidelines(!showGuidelines)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">📋 Orientações Gerais</CardTitle>
              {showGuidelines ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </CardHeader>
          {showGuidelines && (
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">{parsed.guidelines}</p>
            </CardContent>
          )}
        </Card>
      )}

      {/* Substituições */}
      {parsed.substitutions && (
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">🔄 Substituições</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{parsed.substitutions}</p>
          </CardContent>
        </Card>
      )}

      <Button
        className="w-full"
        variant="outline"
        onClick={() => navigate("/gerar-dieta")}
      >
        <Plus className="w-4 h-4 mr-2" /> Gerar Nova Dieta
      </Button>
    </div>
  );
}

// ─── Lista de dietas salvas ───────────────────────────────────────────────────

function DietList() {
  const [, navigate] = useLocation();
  const { data: diets, isLoading } = trpc.diets.getAll.useQuery();

  const objectiveLabels: Record<string, string> = {
    bulking: "🏋️ Bulking",
    cutting: "🔥 Cutting",
    manutencao: "⚖️ Manutenção",
    recomposicao: "💪 Recomposição",
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/meus-treinos")}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Salad className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Minhas Dietas</h1>
              <p className="text-xs text-muted-foreground">Planos alimentares com IA</p>
            </div>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate("/gerar-dieta")}>
          <Plus className="w-4 h-4 mr-1" /> Nova
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !diets || diets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Salad className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">Nenhuma dieta gerada ainda</p>
            <Button onClick={() => navigate("/gerar-dieta")}>
              <Plus className="w-4 h-4 mr-2" /> Gerar Minha Primeira Dieta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {diets.map((diet) => (
            <Card
              key={diet.id}
              className="cursor-pointer hover:border-primary/50 transition-all"
              onClick={() => navigate(`/dieta/${diet.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Salad className="w-4 h-4 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{diet.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {new Date(diet.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {objectiveLabels[diet.objective] || diet.objective}
                  </Badge>
                </div>
              </CardHeader>
              {diet.targetCalories && (
                <CardContent className="pt-0">
                  <div className="flex gap-3 text-xs">
                    <span className="text-primary font-medium">{diet.targetCalories} kcal</span>
                    {diet.targetProtein && <span className="text-blue-400">P: {diet.targetProtein}g</span>}
                    {diet.targetCarbs && <span className="text-yellow-400">C: {diet.targetCarbs}g</span>}
                    {diet.targetFat && <span className="text-red-400">G: {diet.targetFat}g</span>}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MinhasDietas() {
  const params = useParams<{ id?: string }>();
  const dietId = params.id ? parseInt(params.id) : null;

  if (dietId && !isNaN(dietId)) {
    return <DietView dietId={dietId} />;
  }

  return <DietList />;
}
