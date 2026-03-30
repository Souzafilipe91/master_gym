import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Dumbbell, Activity, Loader2, Home, Video, ChevronDown, ChevronUp,
  Clock, Calendar, Trash2, Eye, Sparkles, BookOpen, Play
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

// ─── Seção de Musculação (Programa) ─────────────────────────────────────────

function MusculacaoSection() {
  const { data: workoutTypes, isLoading } = trpc.workoutTypes.getAll.useQuery();
  const { data: savedMusculacao, refetch } = trpc.savedWorkouts.getAll.useQuery({ type: "musculacao" });
  const deleteMutation = trpc.savedWorkouts.delete.useMutation({
    onSuccess: () => { toast.success("Treino removido"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const [expandedId, setExpandedId] = useState<number | null>(null);

  const colors = {
    A: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-500" },
    B: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-500" },
    C: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-500" },
    D: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-500" },
  } as Record<string, { bg: string; border: string; text: string }>;

  return (
    <section>
      {/* Header da seção */}
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-primary/10 rounded-lg">
          <Dumbbell className="w-4 h-4 text-primary" />
        </div>
        <h2 className="text-lg font-bold">Musculação</h2>
      </div>

      {/* Programa atual */}
      <div className="mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Programa Atual
        </p>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {workoutTypes?.map((workout) => {
              const c = colors[workout.code] || { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" };
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
      </div>

      {/* Treinos IA salvos */}
      {savedMusculacao && savedMusculacao.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
            Gerados por IA ({savedMusculacao.length})
          </p>
          <div className="space-y-2">
            {savedMusculacao.map((w) => (
              <AiWorkoutCard
                key={w.id}
                workout={w}
                expanded={expandedId === w.id}
                onToggle={() => setExpandedId(expandedId === w.id ? null : w.id)}
                onDelete={() => deleteMutation.mutate({ id: w.id })}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
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

  // O mais recente é o "atual", os demais são anteriores
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

      {/* Treino atual */}
      <div className="mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Treino Atual
        </p>
        <AiWorkoutCard
          workout={current}
          expanded={expandedId === current.id}
          onToggle={() => setExpandedId(expandedId === current.id ? null : current.id)}
          onDelete={() => deleteMutation.mutate({ id: current.id })}
          isDeleting={deleteMutation.isPending}
          highlight
        />
      </div>

      {/* Treinos anteriores */}
      {previous.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
            Anteriores ({previous.length})
          </p>
          <div className="space-y-2">
            {previous.map((w) => (
              <AiWorkoutCard
                key={w.id}
                workout={w}
                expanded={expandedId === w.id}
                onToggle={() => setExpandedId(expandedId === w.id ? null : w.id)}
                onDelete={() => deleteMutation.mutate({ id: w.id })}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
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
  const [expandedId, setExpandedId] = useState<number | null>(null);
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

      {/* Treino atual */}
      <div className="mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
          Treino Atual
        </p>
        <AiWorkoutCard
          workout={current}
          expanded={expandedId === current.id}
          onToggle={() => setExpandedId(expandedId === current.id ? null : current.id)}
          onDelete={() => deleteMutation.mutate({ id: current.id })}
          isDeleting={deleteMutation.isPending}
          highlight
          showAthlete
        />
      </div>

      {/* Treinos anteriores */}
      {previous.length > 0 && (
        <div className="mt-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block" />
            Anteriores ({previous.length})
          </p>
          <div className="space-y-2">
            {previous.map((w) => (
              <AiWorkoutCard
                key={w.id}
                workout={w}
                expanded={expandedId === w.id}
                onToggle={() => setExpandedId(expandedId === w.id ? null : w.id)}
                onDelete={() => deleteMutation.mutate({ id: w.id })}
                isDeleting={deleteMutation.isPending}
                showAthlete
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Card de Treino IA ───────────────────────────────────────────────────────

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

function AiWorkoutCard({
  workout,
  expanded,
  onToggle,
  onDelete,
  isDeleting,
  highlight = false,
  showAthlete = false,
}: {
  workout: AiWorkout;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  highlight?: boolean;
  showAthlete?: boolean;
}) {
  const [, navigate] = useLocation();
  const dateStr = new Date(workout.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <Card className={`transition-all ${highlight ? "border-primary/40 bg-primary/5" : "border-border"}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-sm font-semibold truncate">{workout.title}</CardTitle>
              {highlight && <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">Atual</Badge>}
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
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
              {workout.difficulty && (
                <Badge variant="outline" className="text-xs py-0">{workout.difficulty}</Badge>
              )}
              {showAthlete && workout.athleteName && (
                <span className="text-xs text-primary font-medium">{workout.athleteName}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {workout.videoUrl && (
              <a href={workout.videoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Video className="w-3.5 h-3.5" />
                </Button>
              </a>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggle}>
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {/* Botão Executar Treino */}
        <Button
          className="w-full mt-3"
          size="sm"
          onClick={() => navigate(`/treino-ia/${workout.id}/executar`)}
        >
          <Play className="w-4 h-4 mr-2" />
          Executar Treino
        </Button>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0">
          <div className="border-t border-border pt-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <Streamdown>{workout.content}</Streamdown>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
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
