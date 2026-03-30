import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, BookOpen, Home, Video, Trash2, ChevronDown, ChevronUp, Calendar, Clock, Dumbbell, Play } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Streamdown } from "streamdown";
import ExecutarCalistenia from "./ExecutarCalistenia";

type FilterType = "all" | "calistenia" | "copied";

interface ExecutingWorkout {
  id: number;
  title: string;
  content: string;
}

function formatDate(dateStr: string | Date) {
  return new Date(dateStr).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function TreinosSalvos() {
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [executing, setExecuting] = useState<ExecutingWorkout | null>(null);

  if (executing) {
    return (
      <ExecutarCalistenia
        workoutContent={executing.content}
        workoutTitle={executing.title}
        onFinish={() => setExecuting(null)}
      />
    );
  }

  const { data: workouts, isLoading, refetch } = trpc.savedWorkouts.getAll.useQuery({
    type: filter === "all" ? undefined : filter,
  });

  const deleteMutation = trpc.savedWorkouts.delete.useMutation({
    onSuccess: () => {
      toast.success("Treino removido");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Remover este treino salvo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
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
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Treinos Salvos</h1>
              <p className="text-xs text-muted-foreground">Calistenia e treinos copiados de atletas</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl space-y-4">
        {/* Filtros */}
        <div className="flex gap-2 bg-muted p-1 rounded-lg">
          {[
            { value: "all" as FilterType, label: "Todos" },
            { value: "calistenia" as FilterType, label: "Calistenia", icon: Home },
            { value: "copied" as FilterType, label: "Copiados", icon: Video },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                filter === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Dumbbell className="w-8 h-8 mx-auto mb-3 animate-spin opacity-50" />
            <p className="text-sm">Carregando treinos...</p>
          </div>
        )}

        {/* Lista de treinos */}
        {!isLoading && workouts && workouts.length === 0 && (
          <Card className="border-dashed border-border/50">
            <CardContent className="p-10 text-center">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <BookOpen className="w-10 h-10 opacity-30" />
                <p className="text-sm font-medium">Nenhum treino salvo ainda</p>
                <p className="text-xs">
                  Gere um treino de calistenia ou copie o treino de um atleta e salve para acessar depois.
                </p>
                <div className="flex gap-2 mt-2">
                  <Link href="/calistenia">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Home className="w-3.5 h-3.5" />
                      Calistenia
                    </Button>
                  </Link>
                  <Link href="/copiar-treino">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Video className="w-3.5 h-3.5" />
                      Copiar Treino
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isLoading && workouts?.map((workout) => {
          const isExpanded = expandedId === workout.id;
          const isCalistenia = workout.type === "calistenia";

          return (
            <Card
              key={workout.id}
              className={`transition-all cursor-pointer hover:border-primary/30 ${
                isExpanded ? "border-primary/40" : ""
              }`}
              onClick={() => toggleExpand(workout.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Ícone de tipo */}
                    <div className={`p-2 rounded-lg shrink-0 ${
                      isCalistenia ? "bg-green-500/10" : "bg-blue-500/10"
                    }`}>
                      {isCalistenia ? (
                        <Home className="w-4 h-4 text-green-400" />
                      ) : (
                        <Video className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-semibold leading-tight truncate">
                        {workout.title}
                      </CardTitle>

                      <div className="flex flex-wrap gap-2 mt-1.5">
                        <Badge
                          variant="outline"
                          className={`text-xs py-0 ${
                            isCalistenia
                              ? "border-green-500/30 text-green-400"
                              : "border-blue-500/30 text-blue-400"
                          }`}
                        >
                          {isCalistenia ? "Calistenia" : "Copiado"}
                        </Badge>

                        {workout.athleteName && (
                          <Badge variant="outline" className="text-xs py-0 border-primary/30 text-primary">
                            {workout.athleteName}
                          </Badge>
                        )}

                        {workout.duration && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {workout.duration}min
                          </span>
                        )}

                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(workout.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => handleDelete(workout.id, e)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

                  {/* Conteúdo expandido */}
                  {isExpanded && (
                    <CardContent className="pt-0 border-t border-border">
                      {/* Botão de iniciar para calistenia */}
                      {isCalistenia && (
                        <Button
                          className="w-full mb-4"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExecuting({ id: workout.id, title: workout.title, content: workout.content });
                          }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar Treino
                        </Button>
                      )}

                      {/* Link do vídeo original para treinos copiados */}
                      {workout.videoUrl && (
                        <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Video className="w-3.5 h-3.5" />
                            Vídeo original
                          </span>
                          <a
                            href={workout.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Assistir no YouTube →
                          </a>
                        </div>
                      )}

                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{workout.content}</Streamdown>
                      </div>
                    </CardContent>
                  )}
            </Card>
          );
        })}
      </main>
    </div>
  );
}
