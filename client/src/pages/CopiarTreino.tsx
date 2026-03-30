import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Video, Zap, RefreshCw, Copy, Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

// Extrai ID do YouTube de qualquer formato de URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

const EXAMPLE_ATHLETES = [
  { name: "Chris Evans", query: "Chris Evans treino Capitão América rotina academia" },
  { name: "Cristiano Ronaldo", query: "Cristiano Ronaldo workout routine gym training" },
  { name: "Jeff Nippard", query: "Jeff Nippard chest workout routine" },
  { name: "Cbum (Chris Bumstead)", query: "Chris Bumstead cbum workout routine training" },
];

export default function CopiarTreino() {
  const [videoUrl, setVideoUrl] = useState("");
  const [athleteName, setAthleteName] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [result, setResult] = useState<{ videoAnalysis: string; adaptedWorkout: string; athleteName?: string } | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: anamnese } = trpc.anamnese.getMy.useQuery();

  const copyMutation = trpc.copiarTreino.fromVideo.useMutation({
    onSuccess: (data) => {
      setResult({
        videoAnalysis: typeof data.videoAnalysis === "string" ? data.videoAnalysis : String(data.videoAnalysis),
        adaptedWorkout: typeof data.adaptedWorkout === "string" ? data.adaptedWorkout : String(data.adaptedWorkout),
        athleteName: data.athleteName ?? undefined,
      });
      toast.success("Treino analisado e adaptado!");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const isYT = isYouTubeUrl(videoUrl);

  const handleSubmit = () => {
    if (!videoUrl.trim()) {
      toast.error("Cole a URL do vídeo primeiro");
      return;
    }
    copyMutation.mutate({
      videoUrl: videoUrl.trim(),
      athleteName: athleteName.trim() || undefined,
      additionalContext: additionalContext.trim() || undefined,
    });
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.adaptedWorkout);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Treino copiado!");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Video className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Copiar Treino</h1>
              <p className="text-xs text-muted-foreground">Cole o vídeo de qualquer atleta — a IA adapta pra você</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl space-y-6">
        {/* Aviso se não tem anamnese */}
        {!anamnese && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-medium text-yellow-400">Anamnese não preenchida</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Para adaptar treinos ao seu perfil, preencha sua anamnese primeiro.
                </p>
                <Link href="/anamnese/preencher">
                  <Button size="sm" variant="outline" className="mt-2 border-yellow-500/30 text-yellow-400">
                    Preencher Anamnese
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Como funciona */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-primary mb-2">Como funciona</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Cole a URL de um vídeo do YouTube mostrando a rotina de treino de um atleta</li>
              <li>A IA analisa o vídeo e extrai todos os exercícios, séries e repetições</li>
              <li>O treino é adaptado ao seu perfil, respeitando suas limitações e objetivos</li>
            </ol>
          </CardContent>
        </Card>

        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="w-4 h-4 text-primary" />
              URL do Vídeo
            </CardTitle>
            <CardDescription>
              Funciona com vídeos do YouTube. Cole a URL completa do vídeo com a rotina de treino.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Input da URL */}
            <div className="space-y-2">
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="font-mono text-sm"
              />
              {videoUrl && !isYT && (
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  ⚠️ Apenas vídeos do YouTube são suportados no momento
                </p>
              )}
            </div>

            {/* Preview do YouTube */}
            {youtubeId && (
              <div className="rounded-xl overflow-hidden border border-border aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Preview do vídeo"
                />
              </div>
            )}

            {/* Nome do atleta (opcional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nome do atleta <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <Input
                placeholder="Ex: Chris Evans, Jeff Nippard, Cbum..."
                value={athleteName}
                onChange={(e) => setAthleteName(e.target.value)}
              />
            </div>

            {/* Contexto adicional (opcional) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Contexto adicional <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <Textarea
                placeholder="Ex: Este é o treino de peito que ele faz na pré-temporada, foco em hipertrofia..."
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Exemplos de atletas */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Sugestões de busca no YouTube:</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_ATHLETES.map((athlete) => (
                  <a
                    key={athlete.name}
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(athlete.query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:text-primary transition-colors"
                  >
                    {athlete.name}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={copyMutation.isPending || !anamnese || !videoUrl.trim()}
            >
              {copyMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Analisando vídeo e adaptando treino...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Analisar e Adaptar Treino
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading state */}
        {copyMutation.isPending && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                </div>
                <p className="font-medium">Analisando o vídeo...</p>
                <p className="text-sm text-muted-foreground">
                  A IA está assistindo ao vídeo, extraindo os exercícios e adaptando ao seu perfil. Isso pode levar alguns segundos.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {result && !copyMutation.isPending && (
          <div className="space-y-4">
            {/* Treino adaptado */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Treino Adaptado para Você
                  </CardTitle>
                  <div className="flex gap-2">
                    {result.athleteName && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        Baseado em: {result.athleteName}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopy}
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <Streamdown>{result.adaptedWorkout}</Streamdown>
                </div>
              </CardContent>
            </Card>

            {/* Análise do vídeo original (colapsável) */}
            <Card>
              <button
                className="w-full p-4 flex items-center justify-between text-left"
                onClick={() => setShowAnalysis(!showAnalysis)}
              >
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Ver análise do vídeo original</span>
                </div>
                {showAnalysis ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {showAnalysis && (
                <CardContent className="pt-0 border-t border-border">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Streamdown>{result.videoAnalysis}</Streamdown>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Botão para novo treino */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setResult(null);
                setVideoUrl("");
                setAthleteName("");
                setAdditionalContext("");
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Analisar outro vídeo
            </Button>
          </div>
        )}

        {/* Estado vazio */}
        {!result && !copyMutation.isPending && (
          <Card className="border-dashed border-border/50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Video className="w-10 h-10 opacity-30" />
                <p className="text-sm">
                  Cole a URL de um vídeo do YouTube com a rotina de treino de qualquer atleta e a IA vai adaptar para o seu nível e limitações.
                </p>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  <Badge variant="outline" className="text-xs">Análise por IA</Badge>
                  <Badge variant="outline" className="text-xs">Adaptado à sua anamnese</Badge>
                  <Badge variant="outline" className="text-xs">Respeita suas limitações</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
