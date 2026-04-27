import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Salad, Loader2, ChevronLeft, Flame, Dumbbell, Droplets, Zap } from "lucide-react";

const OBJECTIVES = [
  { value: "bulking", label: "🏋️ Bulking", desc: "Ganho de massa muscular com superávit calórico" },
  { value: "cutting", label: "🔥 Cutting", desc: "Perda de gordura preservando músculo" },
  { value: "manutencao", label: "⚖️ Manutenção", desc: "Manter o peso atual com saúde" },
  { value: "recomposicao", label: "💪 Recomposição", desc: "Ganhar músculo e perder gordura simultaneamente" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentario", label: "Sedentário", desc: "Sem exercício" },
  { value: "leve", label: "Levemente ativo", desc: "1-2x por semana" },
  { value: "moderado", label: "Moderadamente ativo", desc: "3-4x por semana" },
  { value: "ativo", label: "Muito ativo", desc: "5-6x por semana" },
  { value: "muito_ativo", label: "Extremamente ativo", desc: "2x por dia" },
];

export default function GerarDieta() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  const [objective, setObjective] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [activityLevel, setActivityLevel] = useState("");
  const [restrictions, setRestrictions] = useState("");
  const [preferences, setPreferences] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState(5);

  const generateMutation = trpc.diets.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Dieta gerada com sucesso!");
      navigate(`/dieta/${data.insertId}`);
    },
    onError: (err) => {
      toast.error("Erro ao gerar dieta: " + err.message);
    },
  });

  const handleGenerate = () => {
    if (!objective || !weight || !height || !age || !gender || !activityLevel) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    generateMutation.mutate({
      objective: objective as any,
      weight,
      height,
      age: parseInt(age),
      gender,
      activityLevel,
      restrictions: restrictions || undefined,
      preferences: preferences || undefined,
      mealsPerDay,
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/meus-treinos")}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Salad className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Gerar Dieta com IA</h1>
            <p className="text-xs text-muted-foreground">Plano alimentar personalizado</p>
          </div>
        </div>
      </div>

      {/* Objetivo */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" /> Objetivo *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {OBJECTIVES.map((obj) => (
              <button
                key={obj.value}
                onClick={() => setObjective(obj.value)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  objective === obj.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-sm">{obj.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{obj.desc}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dados pessoais */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-blue-500" /> Dados Pessoais *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Peso (kg)</Label>
              <Input
                type="number"
                placeholder="ex: 83"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Altura (cm)</Label>
              <Input
                type="number"
                placeholder="ex: 178"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Idade</Label>
              <Input
                type="number"
                placeholder="ex: 25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Gênero</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Masculino">Masculino</SelectItem>
                  <SelectItem value="Feminino">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nível de atividade */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" /> Nível de Atividade *
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((level) => (
              <button
                key={level.value}
                onClick={() => setActivityLevel(level.value)}
                className={`w-full p-3 rounded-lg border text-left transition-all flex items-center justify-between ${
                  activityLevel === level.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="font-medium text-sm">{level.label}</span>
                <span className="text-xs text-muted-foreground">{level.desc}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Refeições por dia */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Droplets className="w-4 h-4 text-cyan-500" /> Refeições por dia: {mealsPerDay}
          </CardTitle>
          <CardDescription className="text-xs">Quantas refeições você consegue fazer por dia</CardDescription>
        </CardHeader>
        <CardContent>
          <Slider
            min={3}
            max={7}
            step={1}
            value={[mealsPerDay]}
            onValueChange={([v]) => setMealsPerDay(v)}
            className="mt-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>3 refeições</span>
            <span>7 refeições</span>
          </div>
        </CardContent>
      </Card>

      {/* Restrições e preferências */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Personalização (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Restrições alimentares</Label>
            <Textarea
              placeholder="ex: intolerante a lactose, alergia a amendoim, vegetariano..."
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Preferências alimentares</Label>
            <Textarea
              placeholder="ex: prefiro frango e ovo, gosto de arroz e batata doce, não gosto de peixe..."
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botão gerar */}
      <Button
        className="w-full h-12 text-base font-semibold"
        onClick={handleGenerate}
        disabled={generateMutation.isPending}
      >
        {generateMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Gerando sua dieta...
          </>
        ) : (
          <>
            <Salad className="w-5 h-5 mr-2" />
            Gerar Dieta Personalizada
          </>
        )}
      </Button>

      {generateMutation.isPending && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Isso pode levar alguns segundos. A IA está calculando seus macros e montando o plano...
        </p>
      )}
    </div>
  );
}
