import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Dumbbell, Activity, Loader2, Home, Video, ChevronDown, ChevronUp,
  Clock, Calendar, Trash2, Eye, Sparkles, BookOpen, Play, ChevronRight,
  Zap, User
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import { parseWorkoutDays } from "@/lib/parseWorkoutDays";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type AiWorkout = {
  id: number;
  title: string;
  content: string;
  type: string;
  athleteName?: string | null;
  videoUrl?: string | null;
  focus?: string | null;
  duration?: number | null;
  difficulty?: string | null;
  createdAt: Date;
};

// Gera uma letra/ícone e cor para o card IA baseado no tipo e índice
function getAiCardStyle(type: string, index: number) {
  const calisteniaColors = [
    { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-500", letter: "C" },
    { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-500", letter: "C" },
    { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-500", letter: "C" },
  ];
  const musculacaoColors = [
    { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500", letter: "M" },
    { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500", letter: "M" },
    { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500", letter: "M" },
  ];
  const copiadoColors = [
    { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500", letter: "V" },
    { bg: "bg-indigo-500/10", border: "border-indigo-500/30", text: "text-indigo-500", letter: "V" },
    { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-500", letter: "V" },
  ];

  const palette = type === "calistenia" ? calisteniaColors
    : type === "musculacao" ? musculacaoColors
    : copiadoColors;

  return palette[index % palette.length];
}

// ─── Card Visual Grande (igual ao A/B/C/D) ───────────────────────────────────

function AiWorkoutBigCard({
  workout,
  colorIndex = 0,
  onDelete,
  isDeleting,
}: {
  workout: AiWorkout;
  colorIndex?: number;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [, navigate] = useLocation();
  const [showContent, setShowContent] = useState(false);
  const c = getAiCardStyle(workout.type, colorIndex);

  const dateStr = new Date(workout.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  // Extrai uma descrição curta do título ou focus
  const description = workout.focus
    ? `Foco: ${workout.focus}`
    : workout.athleteName
    ? `Baseado em ${workout.athleteName}`
    : "Treino gerado por IA";

  return (
    <div className="space-y-2">
      <Card className={`transition-all hover:scale-[1.01] ${c.border} ${c.bg} relative`}>
        {/* Badge Atual */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30 px-2">
            Atual
          </Badge>
        </div>

        <CardHeader className="pb-3 pr-20">
          <div className="flex items-center gap-3">
            {/* Letra/Ícone */}
            <div className={`w-12 h-12 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
              <span className={`text-2xl font-bold ${c.text}`}>{c.letter}</span>
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base leading-tight">{workout.title}</CardTitle>
              <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Metadados */}
          <div className="flex items-center gap-4 flex-wrap">
            {workout.duration && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                <span>{workout.duration} min</span>
              </div>
            )}
            {workout.difficulty && (
              <Badge variant="outline" className="text-xs py-0">{workout.difficulty}</Badge>
            )}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{dateStr}</span>
            </div>
            {workout.athleteName && (
              <div className="flex items-center gap-1 text-xs text-primary font-medium">
                <User className="w-3 h-3" />
                <span>{workout.athleteName}</span>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={() => navigate(`/treino-ia/${workout.id}/executar`)}
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar Treino
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowContent(!showContent)}
              title="Ver conteúdo"
            >
              {showContent ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            {workout.videoUrl && (
              <a href={workout.videoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" title="Ver vídeo">
                  <Video className="w-4 h-4" />
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Conteúdo expandido */}
          {showContent && (
            <div className="border-t border-border pt-4 mt-2">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Streamdown>{workout.content}</Streamdown>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Card Compacto para Treinos Antigos ──────────────────────────────────────

function AiWorkoutOldCard({
  workout,
  onDelete,
  isDeleting,
}: {
  workout: AiWorkout;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [, navigate] = useLocation();
  const [showContent, setShowContent] = useState(false);
  const dateStr = new Date(workout.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <Card className="border-border/50 bg-muted/20">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{workout.title}</p>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {dateStr}
              </span>
              {workout.duration && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {workout.duration} min
                </span>
              )}
              {workout.athleteName && (
                <span className="text-xs text-muted-foreground">{workout.athleteName}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={() => navigate(`/treino-ia/${workout.id}/executar`)}>
              <Play className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowContent(!showContent)}>
              {showContent ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete} disabled={isDeleting}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {showContent && (
        <CardContent className="pt-0">
          <div className="border-t border-border pt-3">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown>{workout.content}</Streamdown>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Seção de Musculação (Programa) ─────────────────────────────────────────

// Cores para os dias do treino IA (mesmas do programa fixo)
const DAY_COLORS = [
  { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500" },
  { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500" },
  { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500" },
  { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-500" },
  { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-500" },
  { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-500" },
];

function MusculacaoSection() {
  const { data: workoutTypes, isLoading } = trpc.workoutTypes.getAll.useQuery();
  const { data: savedMusculacao, refetch } = trpc.savedWorkouts.getAll.useQuery({ type: "musculacao" });
  const deleteMutation = trpc.savedWorkouts.delete.useMutation({
    onSuccess: () => { toast.success("Treino removido"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const [showOld, setShowOld] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [, navigate] = useLocation();

  const fixedColors = {
    A: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500" },
    B: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500" },
    C: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500" },
    D: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-500" },
  } as Record<string, { bg: string; border: string; text: string }>;

  // O mais recente é o "atual", os demais são anteriores
  const current = savedMusculacao?.[0];
  const previous = savedMusculacao?.slice(1) ?? [];

  // Parsear dias do treino IA atual
  const iaDays = current ? parseWorkoutDays(current.content) : [];
  const hasIaDays = iaDays.length >= 2;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Dumbbell className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Musculação</h2>
      </div>

      {/* Programa atual */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Programa Atual
            {hasIaDays && (
              <Badge className="ml-1 text-xs bg-primary/10 text-primary border-primary/30 px-1.5 py-0">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                IA
              </Badge>
            )}
          </p>
          {hasIaDays && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              onClick={() => setShowOriginal(!showOriginal)}
            >
              {showOriginal ? "Ocultar original" : "Ver programa original"}
              {showOriginal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : hasIaDays ? (
          /* Cards dos dias do treino IA substituindo A/B/C/D */
          <div className="grid gap-3 md:grid-cols-2">
            {iaDays.map((day, idx) => {
              const c = DAY_COLORS[idx % DAY_COLORS.length];
              return (
                <div
                  key={day.label}
                  className="cursor-pointer"
                  onClick={() => navigate(`/treino-ia/${current!.id}/executar`)}
                >
                  <Card className={`transition-all hover:scale-[1.02] ${c.border} ${c.bg}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-xl font-bold ${c.text}`}>{day.letter}</span>
                        </div>
                        <div>
                          <CardTitle className="text-base">{day.label}</CardTitle>
                          <CardDescription className="text-xs">{day.exercises.length} exercícios</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Treino IA</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {day.exercises.slice(0, 3).join(", ")}{day.exercises.length > 3 ? ` +${day.exercises.length - 3}` : ""}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          /* Cards originais A/B/C/D */
          <div className="grid gap-3 md:grid-cols-2">
            {workoutTypes?.map((workout) => {
              const c = fixedColors[workout.code] || { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" };
              return (
                <Link key={workout.id} href={`/treino/${workout.code}`}>
                  <Card className={`cursor-pointer transition-all hover:scale-[1.02] ${c.border} ${c.bg}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-xl font-bold ${c.text}`}>{workout.code}</span>
                        </div>
                        <div>
                          <CardTitle className="text-base">{workout.name}</CardTitle>
                          <CardDescription className="text-xs">Treino {workout.code}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Activity className="w-3 h-3" />
                        <span>{workout.duration} min</span>
                      </div>
                      {workout.description && (
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{workout.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {/* Programa original colapsável (quando IA está ativo) */}
        {hasIaDays && showOriginal && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-3">Programa original (A/B/C/D):</p>
            <div className="grid gap-3 md:grid-cols-2">
              {workoutTypes?.map((workout) => {
                const c = fixedColors[workout.code] || { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" };
                return (
                  <Link key={workout.id} href={`/treino/${workout.code}`}>
                    <Card className={`cursor-pointer transition-all hover:scale-[1.02] ${c.border} ${c.bg} opacity-70`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
                            <span className={`text-base font-bold ${c.text}`}>{workout.code}</span>
                          </div>
                          <div>
                            <CardTitle className="text-sm">{workout.name}</CardTitle>
                            <CardDescription className="text-xs">Treino {workout.code}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Treinos IA antigos */}
      {previous.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 hover:text-foreground transition-colors"
            onClick={() => setShowOld(!showOld)}
          >
            {showOld ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Treinos Antigos ({previous.length})
          </button>
          {showOld && (
            <div className="space-y-2">
              {previous.map((w) => (
                <AiWorkoutOldCard
                  key={w.id}
                  workout={w}
                  onDelete={() => deleteMutation.mutate({ id: w.id })}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Seção de Calistenia ─────────────────────────────────────────────────────

function CalisteniaSection() {
  const { data: saved, refetch } = trpc.savedWorkouts.getAll.useQuery({ type: "calistenia" });
  const deleteMutation = trpc.savedWorkouts.delete.useMutation({
    onSuccess: () => { toast.success("Treino removido"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const [showOld, setShowOld] = useState(false);
  const [, navigate] = useLocation();

  if (!saved || saved.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Home className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Calistenia</h2>
        </div>
        <Card className="border-dashed border-border/50">
          <CardContent className="py-8 text-center">
            <Home className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-3">Nenhum treino de calistenia salvo ainda.</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/calistenia")}>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Treino de Calistenia
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const [current, ...previous] = saved;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Home className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Calistenia</h2>
        <Badge variant="secondary" className="text-xs">{saved.length}</Badge>
      </div>

      {/* Treino atual — card visual grande */}
      <div className="mb-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Treino Atual
        </p>
        <AiWorkoutBigCard
          workout={current}
          colorIndex={0}
          onDelete={() => deleteMutation.mutate({ id: current.id })}
          isDeleting={deleteMutation.isPending}
        />
      </div>

      {/* Treinos antigos colapsáveis */}
      {previous.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 hover:text-foreground transition-colors"
            onClick={() => setShowOld(!showOld)}
          >
            {showOld ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Treinos Antigos ({previous.length})
          </button>
          {showOld && (
            <div className="space-y-2">
              {previous.map((w) => (
                <AiWorkoutOldCard
                  key={w.id}
                  workout={w}
                  onDelete={() => deleteMutation.mutate({ id: w.id })}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Seção de Cópia por Vídeo ────────────────────────────────────────────────

function CopiaVideoSection() {
  const { data: saved, refetch } = trpc.savedWorkouts.getAll.useQuery({ type: "copied" });
  const deleteMutation = trpc.savedWorkouts.delete.useMutation({
    onSuccess: () => { toast.success("Treino removido"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const [showOld, setShowOld] = useState(false);
  const [, navigate] = useLocation();

  if (!saved || saved.length === 0) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Video className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-lg font-bold">Cópia por Vídeo</h2>
        </div>
        <Card className="border-dashed border-border/50">
          <CardContent className="py-8 text-center">
            <Video className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground mb-3">Nenhum treino copiado de atleta ainda.</p>
            <Button variant="outline" size="sm" onClick={() => navigate("/copiar-treino")}>
              <Video className="w-4 h-4 mr-2" />
              Copiar Treino de Atleta
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  const [current, ...previous] = saved;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Video className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Cópia por Vídeo</h2>
        <Badge variant="secondary" className="text-xs">{saved.length}</Badge>
      </div>

      {/* Treino atual — card visual grande */}
      <div className="mb-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Treino Atual
        </p>
        <AiWorkoutBigCard
          workout={current}
          colorIndex={0}
          onDelete={() => deleteMutation.mutate({ id: current.id })}
          isDeleting={deleteMutation.isPending}
        />
      </div>

      {/* Treinos antigos colapsáveis */}
      {previous.length > 0 && (
        <div>
          <button
            className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 hover:text-foreground transition-colors"
            onClick={() => setShowOld(!showOld)}
          >
            {showOld ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            Treinos Antigos ({previous.length})
          </button>
          {showOld && (
            <div className="space-y-2">
              {previous.map((w) => (
                <AiWorkoutOldCard
                  key={w.id}
                  workout={w}
                  onDelete={() => deleteMutation.mutate({ id: w.id })}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function MeusTreinos() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-primary/10 rounded-lg">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Meus Treinos</h1>
            <p className="text-sm text-muted-foreground">
              Programa atual e treinos gerados por IA
            </p>
          </div>
        </div>

        {/* Seções */}
        <div className="space-y-10">
          <MusculacaoSection />
          <div className="border-t border-border/50" />
          <CalisteniaSection />
          <div className="border-t border-border/50" />
          <CopiaVideoSection />
        </div>
      </main>
    </div>
  );
}
