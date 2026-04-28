import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Beef, Wheat, Droplets, Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

// Calcula metas diárias baseado em peso, altura, idade, gênero e objetivo
function calcularMetas(params: {
  weight?: string | null;
  height?: string | null;
  age?: number | null;
  gender?: string | null;
  objective?: string | null;
}): { calories: number; protein: number; carbs: number; fat: number } {
  const peso = parseFloat(params.weight || "80") || 80;
  const altura = parseFloat(params.height || "175") || 175;
  const idade = params.age || 25;
  const genero = params.gender || "masculino";
  const objetivo = params.objective || "manutencao";

  // Fórmula de Mifflin-St Jeor
  let tmb: number;
  if (genero === "feminino") {
    tmb = 10 * peso + 6.25 * altura - 5 * idade - 161;
  } else {
    tmb = 10 * peso + 6.25 * altura - 5 * idade + 5;
  }

  // Fator de atividade moderada (treino 3-5x/semana)
  const tdee = tmb * 1.55;

  let calories: number;
  let proteinFactor: number;

  switch (objetivo) {
    case "bulking":
      calories = Math.round(tdee + 400);
      proteinFactor = 2.2; // 2.2g por kg
      break;
    case "cutting":
      calories = Math.round(tdee - 500);
      proteinFactor = 2.5; // mais proteína no cutting
      break;
    case "recomposicao":
      calories = Math.round(tdee);
      proteinFactor = 2.3;
      break;
    default: // manutencao
      calories = Math.round(tdee);
      proteinFactor = 2.0;
  }

  const protein = Math.round(peso * proteinFactor);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return { calories, protein, carbs, fat };
}

const MEAL_LABELS: Record<string, string> = {
  cafe_manha: "☀️ Café da Manhã",
  lanche_manha: "🍎 Lanche da Manhã",
  almoco: "🍽️ Almoço",
  lanche_tarde: "🥜 Lanche da Tarde",
  jantar: "🌙 Jantar",
  ceia: "🌛 Ceia",
};

const MEAL_ORDER = ["cafe_manha", "lanche_manha", "almoco", "lanche_tarde", "jantar", "ceia"];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function MacroBar({ label, current, goal, color, unit = "g", icon }: {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
  icon: React.ReactNode;
}) {
  const pct = Math.min(100, goal > 0 ? Math.round((current / goal) * 100) : 0);
  const over = current > goal;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="font-medium">{label}</span>
        </div>
        <span className={over ? "text-red-400 font-semibold" : "text-muted-foreground"}>
          {current}{unit} / {goal}{unit}
        </span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? "bg-red-500" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{pct}% da meta</span>
        {over ? (
          <span className="text-red-400">+{current - goal}{unit} acima</span>
        ) : (
          <span className="text-green-400">{goal - current}{unit} restante</span>
        )}
      </div>
    </div>
  );
}

export default function ContadorCalorias() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    quantity: "",
    meal: "almoco" as const,
  });

  // Buscar anamnese para calcular metas
  const { data: anamnese } = trpc.anamnese.getMy.useQuery();
  // Buscar dieta mais recente para pegar objetivo
  const { data: latestDiet } = trpc.diets.getLatest.useQuery();
  // Buscar logs do dia
  const { data: logs = [], refetch } = trpc.foodLogs.getByDate.useQuery({ date: selectedDate });

  const utils = trpc.useUtils();

  const addMutation = trpc.foodLogs.add.useMutation({
    onSuccess: () => {
      utils.foodLogs.getByDate.invalidate({ date: selectedDate });
      setForm({ name: "", calories: "", protein: "", carbs: "", fat: "", quantity: "", meal: "almoco" });
      setShowForm(false);
      toast.success("Refeição registrada! Adicionado ao contador do dia.");
    },
    onError: () => toast.error("Não foi possível registrar a refeição."),
  });

  const deleteMutation = trpc.foodLogs.delete.useMutation({
    onSuccess: () => utils.foodLogs.getByDate.invalidate({ date: selectedDate }),
  });

  // Calcular metas
  const metas = useMemo(() => calcularMetas({
    weight: anamnese?.currentWeight || user?.currentWeight,
    height: anamnese?.height,
    age: anamnese?.age,
    gender: anamnese?.gender,
    objective: latestDiet?.objective || "manutencao",
  }), [anamnese, latestDiet, user]);

  // Totais do dia
  const totais = useMemo(() => {
    return logs.reduce(
      (acc, log) => ({
        calories: acc.calories + (log.calories || 0),
        protein: acc.protein + parseFloat(String(log.protein || 0)),
        carbs: acc.carbs + parseFloat(String(log.carbs || 0)),
        fat: acc.fat + parseFloat(String(log.fat || 0)),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [logs]);

  // Agrupar logs por refeição
  const logsByMeal = useMemo(() => {
    const grouped: Record<string, typeof logs> = {};
    for (const log of logs) {
      if (!grouped[log.meal]) grouped[log.meal] = [];
      grouped[log.meal].push(log);
    }
    return grouped;
  }, [logs]);

  // Navegar entre datas
  function changeDate(delta: number) {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(formatDate(d));
  }

  const isToday = selectedDate === formatDate(new Date());
  const caloriePct = Math.min(100, metas.calories > 0 ? Math.round((totais.calories / metas.calories) * 100) : 0);
  const calorieOver = totais.calories > metas.calories;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    addMutation.mutate({
      date: selectedDate,
      meal: form.meal,
      name: form.name.trim(),
      calories: parseInt(form.calories) || 0,
      protein: parseFloat(form.protein) || 0,
      carbs: parseFloat(form.carbs) || 0,
      fat: parseFloat(form.fat) || 0,
      quantity: form.quantity || undefined,
    });
  }

  const objetivoLabel: Record<string, string> = {
    bulking: "Bulking",
    cutting: "Cutting",
    manutencao: "Manutenção",
    recomposicao: "Recomposição",
  };

  return (
    <div className="container py-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="text-orange-500" size={26} />
            Contador de Calorias
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Meta: {objetivoLabel[latestDiet?.objective || "manutencao"]} · {metas.calories} kcal/dia
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="gap-1.5">
          <Plus size={16} />
          Adicionar
        </Button>
      </div>

      {/* Navegação de data */}
      <div className="flex items-center justify-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
          <ChevronLeft size={18} />
        </Button>
        <div className="text-center">
          <p className="font-semibold">
            {isToday ? "Hoje" : new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long" })}
          </p>
          <p className="text-sm text-muted-foreground">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => changeDate(1)} disabled={isToday}>
          <ChevronRight size={18} />
        </Button>
      </div>

      {/* Card principal de calorias */}
      <Card className={`border-2 ${calorieOver ? "border-red-500/50" : caloriePct >= 90 ? "border-green-500/50" : "border-border"}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-4xl font-bold">{totais.calories}</p>
              <p className="text-muted-foreground text-sm">de {metas.calories} kcal</p>
            </div>
            <div className="text-right">
              {calorieOver ? (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle size={20} />
                  <span className="font-semibold">Acima da meta</span>
                </div>
              ) : caloriePct >= 90 ? (
                <div className="flex items-center gap-1.5 text-green-400">
                  <CheckCircle2 size={20} />
                  <span className="font-semibold">Meta quase batida!</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  <p className="text-2xl font-bold text-foreground">{metas.calories - totais.calories}</p>
                  <p className="text-sm">kcal restantes</p>
                </div>
              )}
            </div>
          </div>
          <Progress value={caloriePct} className="h-3" />
          <p className="text-xs text-muted-foreground mt-1 text-right">{caloriePct}% da meta diária</p>
        </CardContent>
      </Card>

      {/* Macros */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Macronutrientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MacroBar
            label="Proteína"
            current={Math.round(totais.protein)}
            goal={metas.protein}
            color="bg-blue-500"
            icon={<Beef size={14} className="text-blue-400" />}
          />
          <MacroBar
            label="Carboidratos"
            current={Math.round(totais.carbs)}
            goal={metas.carbs}
            color="bg-yellow-500"
            icon={<Wheat size={14} className="text-yellow-400" />}
          />
          <MacroBar
            label="Gordura"
            current={Math.round(totais.fat)}
            goal={metas.fat}
            color="bg-orange-500"
            icon={<Droplets size={14} className="text-orange-400" />}
          />
        </CardContent>
      </Card>

      {/* Formulário de adição */}
      {showForm && (
        <Card className="border-primary/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registrar Alimento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Nome do alimento *</Label>
                  <Input
                    placeholder="Ex: Frango grelhado, Arroz, Whey..."
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Quantidade (opcional)</Label>
                  <Input
                    placeholder="Ex: 150g, 1 unidade"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Refeição</Label>
                  <Select value={form.meal} onValueChange={v => setForm(f => ({ ...f, meal: v as typeof form.meal }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_ORDER.map(m => (
                        <SelectItem key={m} value={m}>{MEAL_LABELS[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Calorias (kcal)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.calories}
                    onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Proteína (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={form.protein}
                    onChange={e => setForm(f => ({ ...f, protein: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Carbs (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={form.carbs}
                    onChange={e => setForm(f => ({ ...f, carbs: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Gordura (g)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={form.fat}
                    onChange={e => setForm(f => ({ ...f, fat: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                <Button type="submit" disabled={addMutation.isPending || !form.name.trim()}>
                  {addMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de refeições do dia */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Flame size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhum alimento registrado ainda</p>
            <p className="text-sm mt-1">Clique em "Adicionar" para começar a registrar o que você comeu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {MEAL_ORDER.filter(m => logsByMeal[m]?.length).map(meal => (
            <Card key={meal}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">{MEAL_LABELS[meal]}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {logsByMeal[meal].reduce((s, l) => s + (l.calories || 0), 0)} kcal
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {logsByMeal[meal].map(log => (
                  <div key={log.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{log.name}</p>
                      {log.quantity && <p className="text-xs text-muted-foreground">{log.quantity}</p>}
                      <div className="flex gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="text-orange-400">{log.calories} kcal</span>
                        <span className="text-blue-400">P: {parseFloat(String(log.protein || 0)).toFixed(0)}g</span>
                        <span className="text-yellow-400">C: {parseFloat(String(log.carbs || 0)).toFixed(0)}g</span>
                        <span className="text-orange-300">G: {parseFloat(String(log.fat || 0)).toFixed(0)}g</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-red-400 h-8 w-8"
                      onClick={() => deleteMutation.mutate({ id: log.id })}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
