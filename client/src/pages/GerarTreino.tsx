import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Sparkles, Loader2, CheckCircle2, BookmarkPlus, Bookmark, RefreshCw } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

export default function GerarTreino() {
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const generateMutation = trpc.anamnese.generateWorkout.useMutation({
    onSuccess: (data) => {
      setGeneratedPlan(String(data.workoutPlan));
      setSaved(false);
      toast.success("Treino gerado com sucesso!");
    },
    onError: (error) => {
      toast.error(`Erro ao gerar treino: ${error.message}`);
    },
  });

  const saveMutation = trpc.savedWorkouts.save.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Treino salvo em Meus Treinos!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    setGeneratedPlan(null);
    setSaved(false);
    generateMutation.mutate({});
  };

  const handleSave = () => {
    if (!generatedPlan) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    saveMutation.mutate({
      type: "musculacao",
      title: `Treino IA — Musculação (${dateStr})`,
      content: generatedPlan,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Gerador de Treino com IA</h1>
            <p className="text-sm text-muted-foreground">
              Crie um programa de treino personalizado baseado na sua anamnese
            </p>
          </div>
        </div>

        {/* Botão de Gerar */}
        {!generatedPlan && !generateMutation.isPending && (
          <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Pronto para criar seu treino?
              </CardTitle>
              <CardDescription>
                Nossa IA analisará sua anamnese e criará um programa completo e personalizado para você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Análise completa da sua anamnese</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>4 treinos personalizados (A, B, C, D)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Exercícios, séries, repetições e cargas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Recomendações de cardio e progressão</span>
                  </div>
                </div>
                <Button size="lg" className="w-full" onClick={handleGenerate}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Gerar Treino Personalizado
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {generateMutation.isPending && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-semibold mb-2">Gerando seu treino...</h3>
              <p className="text-muted-foreground">
                Nossa IA está analisando sua anamnese e criando um programa personalizado para você.
                Isso pode levar alguns segundos.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {generatedPlan && (
          <div className="space-y-6">
            <Card className="border-green-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Treino Gerado com Sucesso!
                </CardTitle>
                <CardDescription>
                  Seu programa de treino personalizado está pronto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={handleGenerate} variant="outline" disabled={generateMutation.isPending}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Gerar Novo Treino
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || saved}
                    variant={saved ? "secondary" : "default"}
                  >
                    {saved ? (
                      <><Bookmark className="w-4 h-4 mr-2 fill-current" />Salvo em Meus Treinos</>
                    ) : saveMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                    ) : (
                      <><BookmarkPlus className="w-4 h-4 mr-2" />Salvar em Meus Treinos</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Seu Programa de Treino</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <Streamdown>{generatedPlan}</Streamdown>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
