import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Clapperboard, Loader2, BookmarkPlus, Bookmark, RefreshCw, Search } from "lucide-react";
import { useState } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

const PRESETS = [
  { label: "Thor", emoji: "⚡", category: "Personagem" },
  { label: "Henry Cavill", emoji: "🦸", category: "Ator" },
  { label: "Cristiano Ronaldo", emoji: "⚽", category: "Atleta" },
  { label: "Arnold Schwarzenegger", emoji: "🏆", category: "Atleta" },
  { label: "Chris Hemsworth", emoji: "🎬", category: "Ator" },
  { label: "Zac Efron", emoji: "🌊", category: "Ator" },
  { label: "Conor McGregor", emoji: "🥊", category: "Atleta" },
  { label: "John Wick", emoji: "🔫", category: "Personagem" },
  { label: "Ryan Reynolds", emoji: "😎", category: "Ator" },
  { label: "Neymar Jr", emoji: "⚽", category: "Atleta" },
  { label: "Frank Zane", emoji: "🎖️", category: "Atleta" },
  { label: "Jeff Cavaliere", emoji: "💪", category: "Atleta" },
];

export default function TreinoPersonagem() {
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);
  const [referenceName, setReferenceName] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const generateMutation = trpc.anamnese.generateWorkoutByReference.useMutation({
    onSuccess: (data) => {
      setGeneratedPlan(String(data.workoutPlan));
      setReferenceName(data.referenceName);
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
      toast.success("Treino salvo em Treinos Salvos!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = (name?: string) => {
    const target = name ?? input.trim();
    if (!target) {
      toast.error("Digite ou escolha uma referência.");
      return;
    }
    setGeneratedPlan(null);
    setSaved(false);
    generateMutation.mutate({ referenceName: target });
  };

  const handleSelectPreset = (label: string) => {
    setSelected(label);
    setInput(label);
  };

  const handleSave = () => {
    if (!generatedPlan || !referenceName) return;
    const dateStr = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    saveMutation.mutate({
      type: "musculacao",
      title: `Treino Inspirado: ${referenceName} (${dateStr})`,
      content: generatedPlan,
    });
  };

  const handleReset = () => {
    setGeneratedPlan(null);
    setReferenceName(null);
    setSaved(false);
    setInput(selected ?? "");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Clapperboard className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Treino Inspirado em...</h1>
            <p className="text-sm text-muted-foreground">
              Escolha um personagem, ator ou atleta e receba um programa focado em conquistar aquele físico
            </p>
          </div>
        </div>

        {/* Configuração */}
        {!generatedPlan && !generateMutation.isPending && (
          <div className="space-y-6">
            {/* Input livre */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quem é sua referência?</CardTitle>
                <CardDescription>Digite qualquer personagem, ator, atleta ou pessoa famosa</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Ex: Wolverine, Lebron James, Hulk Hogan..."
                      className="pl-9"
                      value={input}
                      onChange={(e) => { setInput(e.target.value); setSelected(null); }}
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                  </div>
                  <Button onClick={() => handleGenerate()} disabled={!input.trim()}>
                    Gerar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chips de sugestão */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Sugestões populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handleSelectPreset(preset.label)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selected === preset.label
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary/50 hover:bg-primary/5"
                      }`}
                    >
                      <span>{preset.emoji}</span>
                      <span>{preset.label}</span>
                      <span className="text-xs opacity-60">· {preset.category}</span>
                    </button>
                  ))}
                </div>
                {selected && (
                  <Button
                    className="mt-4 w-full"
                    size="lg"
                    onClick={() => handleGenerate(selected)}
                  >
                    <Clapperboard className="w-5 h-5 mr-2" />
                    Gerar Treino Inspirado em {selected}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading */}
        {generateMutation.isPending && (
          <Card>
            <CardContent className="py-12 text-center">
              <Clapperboard className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Montando seu treino...</h3>
              <p className="text-muted-foreground">
                Analisando o físico de referência e adaptando à sua anamnese. Pode levar alguns segundos.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {generatedPlan && (
          <div className="space-y-6">
            <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clapperboard className="w-5 h-5 text-primary" />
                  Treino Inspirado em {referenceName}
                </CardTitle>
                <CardDescription>
                  Programa adaptado à sua anamnese com foco no físico de referência
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 flex-wrap">
                  <Button onClick={handleReset} variant="outline" disabled={generateMutation.isPending}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Nova Referência
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || saved}
                    variant={saved ? "secondary" : "default"}
                  >
                    {saved ? (
                      <><Bookmark className="w-4 h-4 mr-2 fill-current" />Salvo</>
                    ) : saveMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</>
                    ) : (
                      <><BookmarkPlus className="w-4 h-4 mr-2" />Salvar Treino</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
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
